export const API_BASE = '/api';

export const getAuthToken = () => localStorage.getItem('auth_token');
export const setAuthToken = (token: string) => localStorage.setItem('auth_token', token);
export const removeAuthToken = () => localStorage.removeItem('auth_token');

async function fetchWithAuth(url: string, options: RequestInit = {}) {
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
    // Handle unauthorized (maybe logout)
    removeAuthToken();
    window.location.reload();
  }

  return response;
}

export const api = {
  get: async (url: string) => {
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error(await res.text());
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
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
