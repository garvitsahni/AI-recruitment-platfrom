import sqlite3
import requests
import concurrent.futures
import time

def evaluate_app(app_id):
    try:
        requests.post(f"http://localhost:3001/api/applications/{app_id}/evaluate", timeout=60)
        return True
    except Exception as e:
        print(f"Error on {app_id}: {e}")
        return False

def main():
    db_path = 'recruit.db'
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT id, title FROM jobs ORDER BY created_at DESC LIMIT 1")
    row = c.fetchone()
    if not row:
        print("No job found")
        return

    job_id = row[0]
    print(f"Found job: {row[1]} (ID: {job_id})")

    print("Resetting all candidates to PENDING...")
    res = requests.post(f"http://localhost:3001/api/jobs/{job_id}/applications/re-evaluate-all")
    print("Reset response:", res.json())

    c.execute("SELECT id FROM applications WHERE job_id = ?", (job_id,))
    apps = [r[0] for r in c.fetchall()]
    
    if not apps:
        print("No candidates found.")
        return

    print(f"Triggering evaluation for {len(apps)} candidates in parallel...")
    # Limiting max_workers to 5 to not hit rate limits on Gemini API too hard
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(evaluate_app, apps))
        
    print(f"Done! Evaluated {sum(results)} out of {len(apps)} successfully.")

if __name__ == '__main__':
    main()
