export const API_BASE = '/api';

type LoginResponse = {
  accessToken?: string;
};

const DEV_LOGIN = {
  email: 'recruiter@recruitment.local',
  password: 'Recruiter@123456',
};

export const getAuthToken = () => {
  const token = localStorage.getItem('auth_token');
  return (token && token !== 'undefined') ? token : null;
};
export const setAuthToken = (token: string | undefined) => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};
export const removeAuthToken = () => localStorage.removeItem('auth_token');

async function parseApiError(response: Response) {
  const text = await response.text();

  if (!text) {
    return response.statusText || 'Request failed';
  }

  try {
    const data = JSON.parse(text);
    return data?.error?.message || data?.message || text;
  } catch {
    return text;
  }
}

async function requestAuthToken() {
  const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (refreshResponse.ok) {
    const data = await refreshResponse.json() as LoginResponse;
    if (data.accessToken) {
      setAuthToken(data.accessToken);
      return data.accessToken;
    }
  }

  const loginResponse = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(DEV_LOGIN),
  });

  if (!loginResponse.ok) {
    throw new Error(await parseApiError(loginResponse));
  }

  const data = await loginResponse.json() as LoginResponse;
  if (!data.accessToken) {
    throw new Error('Authentication succeeded but no access token was returned.');
  }

  setAuthToken(data.accessToken);
  return data.accessToken;
}

export const ensureAuthenticated = async () => {
  const existingToken = getAuthToken();

  if (!existingToken) {
    await requestAuthToken();
    return;
  }

  const profileResponse = await fetchWithAuth('/auth/profile', {}, false);
  if (profileResponse.ok) return;

  removeAuthToken();
  await requestAuthToken();
};

async function fetchWithAuth(url: string, options: RequestInit = {}, retryOnUnauthorized = true) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeAuthToken();
    if (retryOnUnauthorized) {
      const nextToken = await requestAuthToken();
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set('Authorization', `Bearer ${nextToken}`);

      return fetch(`${API_BASE}${url}`, {
        ...options,
        headers: retryHeaders,
      });
    }
  }

  return response;
}

export const api = {
  get: async (url: string) => {
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error(await parseApiError(res));
    return res.json();
  },
  post: async (url: string, body: any) => {
    const headers: any = {};
    let payload = body;
    
    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    const res = await fetchWithAuth(url, {
      method: 'POST',
      headers,
      body: payload,
    });
    if (!res.ok) throw new Error(await parseApiError(res));
    return res.json();
  }
};
