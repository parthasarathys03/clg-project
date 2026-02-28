"""Upload all section CSVs to cache them."""
import requests
import time
import os

BASE_URL = "http://127.0.0.1:8000/api"
CSV_DIR = os.path.join(os.path.dirname(__file__), "..", "sample_csvs")

def upload_and_wait(csv_name):
    csv_path = os.path.join(CSV_DIR, csv_name)
    print(f"\n{'='*60}")
    print(f"UPLOADING: {csv_name}")
    print(f"{'='*60}")
    
    with open(csv_path, 'rb') as f:
        r = requests.post(f"{BASE_URL}/batch-upload", files={"file": f})
    
    data = r.json()
    batch_id = data["batch_id"]
    print(f"Batch ID: {batch_id}")
    print(f"Total rows: {data['total']}")
    
    # Wait for completion
    start = time.time()
    while True:
        p = requests.get(f"{BASE_URL}/batch/{batch_id}/progress").json()
        elapsed = time.time() - start
        print(f"  [{elapsed:5.1f}s] {p['processed']:3d}/{p['total']} | Cache: {p.get('cache_hits', 0):3d} | AI: {p.get('ai_generated', 0):3d}", end='\r')
        
        if p['status'] == 'done':
            break
        time.sleep(1)
    
    elapsed = time.time() - start
    print(f"\n\nCOMPLETED in {elapsed:.1f}s")
    print(f"  Total: {p['processed']}")
    print(f"  From Cache: {p['cache_hits']}")
    print(f"  AI Generated: {p['ai_generated']}")
    
    # Detect section
    if p['results']:
        section = p['results'][0].get('section', 'Unknown')
        print(f"  Section: {section}")
    
    return p

if __name__ == "__main__":
    # Upload IT-C
    upload_and_wait("SKP_IT_C_Section.csv")
    
    # Upload IT-D
    upload_and_wait("SKP_IT_D_Section.csv")
    
    # Final stats
    print(f"\n{'='*60}")
    print("ALL SECTIONS LOADED")
    print(f"{'='*60}")
    stats = requests.get(f"{BASE_URL}/batch/stats").json()
    print(f"Total Cache Size: {stats['cache_size']}")
    print(f"Total Batch Predictions: {stats['batch_predictions']}")
