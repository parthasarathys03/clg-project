"""Test batch upload with cache-first approach."""
import requests
import time
import os

BASE_URL = "http://127.0.0.1:8000/api"

# Get sample CSV path
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "sample_csvs", "SKP_IT_B_Section.csv")

def test_batch_upload():
    print("=" * 60)
    print("BATCH UPLOAD TEST - SKP_IT_B_Section.csv")
    print("=" * 60)
    
    # Get initial stats
    stats = requests.get(f"{BASE_URL}/batch/stats").json()
    print(f"\nInitial stats:")
    print(f"  - Total predictions: {stats['total_predictions']}")
    print(f"  - Batch predictions: {stats['batch_predictions']}")
    print(f"  - Manual predictions: {stats['manual_predictions']}")
    print(f"  - Cache size: {stats['cache_size']}")
    
    # Upload CSV
    print(f"\nUploading {CSV_PATH}...")
    with open(CSV_PATH, 'rb') as f:
        resp = requests.post(f"{BASE_URL}/batch-upload", files={"file": f})
    
    data = resp.json()
    batch_id = data["batch_id"]
    print(f"Batch ID: {batch_id}")
    print(f"Total rows: {data['total']}")
    print(f"Status: {data['status']}")
    
    # Poll for progress
    print("\nPolling progress...")
    start_time = time.time()
    while True:
        prog = requests.get(f"{BASE_URL}/batch/{batch_id}/progress").json()
        elapsed = time.time() - start_time
        
        cache_hits = prog.get('cache_hits', 0)
        ai_gen = prog.get('ai_generated', 0)
        
        print(f"  [{elapsed:.1f}s] {prog['processed']}/{prog['total']} - Cache: {cache_hits}, AI: {ai_gen}")
        
        if prog['status'] == 'done':
            break
        time.sleep(1)
    
    elapsed = time.time() - start_time
    print(f"\n{'=' * 60}")
    print(f"COMPLETED in {elapsed:.1f} seconds")
    print(f"{'=' * 60}")
    print(f"  Total processed: {prog['processed']}")
    print(f"  From cache: {prog['cache_hits']}")
    print(f"  AI generated: {prog['ai_generated']}")
    print(f"  Failed: {prog['failed']}")
    
    # Get final stats
    stats = requests.get(f"{BASE_URL}/batch/stats").json()
    print(f"\nFinal stats:")
    print(f"  - Total predictions: {stats['total_predictions']}")
    print(f"  - Batch predictions: {stats['batch_predictions']}")
    print(f"  - Cache size: {stats['cache_size']}")
    
    return prog

def test_re_upload():
    """Test re-uploading same file - should be instant from cache."""
    print("\n" + "=" * 60)
    print("RE-UPLOAD TEST - Should be instant from cache")
    print("=" * 60)
    
    with open(CSV_PATH, 'rb') as f:
        resp = requests.post(f"{BASE_URL}/batch-upload", files={"file": f})
    
    data = resp.json()
    batch_id = data["batch_id"]
    
    start_time = time.time()
    while True:
        prog = requests.get(f"{BASE_URL}/batch/{batch_id}/progress").json()
        if prog['status'] == 'done':
            break
        time.sleep(0.5)
    
    elapsed = time.time() - start_time
    print(f"\nRE-UPLOAD completed in {elapsed:.1f} seconds")
    print(f"  From cache: {prog['cache_hits']}/{prog['total']}")
    print(f"  AI generated: {prog['ai_generated']}")
    
    if prog['cache_hits'] == prog['total']:
        print("\n✓ SUCCESS: 100% from cache - zero AI calls!")
    else:
        print(f"\n⚠ Partial cache: {prog['cache_hits']}/{prog['total']}")
    
    return prog

if __name__ == "__main__":
    # First upload (may need AI)
    result1 = test_batch_upload()
    
    # Re-upload (should be instant from cache)
    result2 = test_re_upload()
