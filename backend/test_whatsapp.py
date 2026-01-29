import requests
import json

# Test WhatsApp direct from Python
def test_send():
    url = "http://localhost:3001/send"
    
    # GANTI NOMOR INI dengan nomor HP yang mau di-test
    payload = {
        "phone": "08885169997",  # <-- EDIT INI
        "message": "🧼 Test dari OTOPIA Car Wash POS!\n\nJika pesan ini masuk, WhatsApp integration SUKSES! ✅"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        print(f"\n✅ Response Status: {response.status_code}")
        print(f"📦 Response Body: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("\n🎉 SUCCESS! Check WhatsApp sekarang!")
        else:
            print(f"\n❌ FAILED: {response.json().get('error')}")
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")

if __name__ == "__main__":
    print("🧪 Testing WhatsApp Send...")
    print("=" * 50)
    test_send()
