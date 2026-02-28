"""Quick test for re-upload cache efficiency."""
import requests
import time

CSV_PATH = "../sample_csvs/SKP_IT_B_Section.csv"
BASE_URL = "http://127.0.0.1:8000/api"

# Upload
with open(CSV_PATH, 'rb') as f:
    r = requests.post(f"{BASE_URL}/batch-upload", files={"file": f})
bid = r.json()["batch_id"]
print(f"Batch ID: {bid}")

# Wait for completion
start = time.time()
while True:
    p = requests.get(f"{BASE_URL}/batch/{bid}/progress").json()
    if p["status"] == "done":
        break
    time.sleep(0.2)

elapsed = time.time() - start
print(f"\nRE-UPLOAD RESULT:")
print(f"  Time: {elapsed:.1f} seconds")
print(f"  Total: {p['total']}")
print(f"  Cache hits: {p['cache_hits']}")
print(f"  AI generated: {p['ai_generated']}")

if p['cache_hits'] == p['total']:
    print(f"\n✓ SUCCESS: 100% from cache - INSTANT!")
else:
    print(f"\n⚠ {p['cache_hits']}/{p['total']} from cache")
