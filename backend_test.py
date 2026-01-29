import requests
import sys
import json
from datetime import datetime

class POSCarWashTester:
    def __init__(self, base_url="https://sparklepay-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.shift_id = None
        self.customer_id = None
        self.service_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test login with admin credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token obtained for user: {response['user']['full_name']}")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            print(f"   Today Revenue: Rp {response.get('today_revenue', 0):,}")
            print(f"   Today Transactions: {response.get('today_transactions', 0)}")
            print(f"   Active Memberships: {response.get('active_memberships', 0)}")
        return success

    def test_get_services(self):
        """Test getting services list"""
        success, response = self.run_test(
            "Get Services",
            "GET",
            "services",
            200
        )
        if success and response:
            print(f"   Found {len(response)} services")
            if response:
                self.service_id = response[0]['id']
                print(f"   First service: {response[0]['name']} - Rp {response[0]['price']:,}")
        return success

    def test_get_customers(self):
        """Test getting customers list"""
        success, response = self.run_test(
            "Get Customers",
            "GET",
            "customers",
            200
        )
        if success:
            print(f"   Found {len(response)} customers")
        return success

    def test_create_customer(self):
        """Test creating a new customer"""
        customer_data = {
            "name": f"Test Customer {datetime.now().strftime('%H%M%S')}",
            "phone": "081234567890",
            "email": "test@example.com",
            "vehicle_number": "B1234XYZ",
            "vehicle_type": "Sedan"
        }
        success, response = self.run_test(
            "Create Customer",
            "POST",
            "customers",
            200,
            data=customer_data
        )
        if success:
            self.customer_id = response['id']
            print(f"   Created customer: {response['name']}")
        return success

    def test_get_inventory(self):
        """Test getting inventory list"""
        success, response = self.run_test(
            "Get Inventory",
            "GET",
            "inventory",
            200
        )
        if success:
            print(f"   Found {len(response)} inventory items")
        return success

    def test_get_low_stock(self):
        """Test getting low stock items"""
        success, response = self.run_test(
            "Get Low Stock Items",
            "GET",
            "inventory/low-stock",
            200
        )
        if success:
            print(f"   Found {len(response)} low stock items")
        return success

    def test_get_memberships(self):
        """Test getting memberships list"""
        success, response = self.run_test(
            "Get Memberships",
            "GET",
            "memberships",
            200
        )
        if success:
            print(f"   Found {len(response)} memberships")
        return success

    def test_create_membership(self):
        """Test creating a membership"""
        if not self.customer_id:
            print("   Skipping - No customer ID available")
            return True
            
        membership_data = {
            "customer_id": self.customer_id,
            "membership_type": "monthly",
            "price": 500000
        }
        success, response = self.run_test(
            "Create Membership",
            "POST",
            "memberships",
            200,
            data=membership_data
        )
        if success:
            print(f"   Created membership: {response['membership_type']} for {response['customer_name']}")
        return success

    def test_open_shift(self):
        """Test opening a shift"""
        shift_data = {
            "kasir_id": self.user_id,
            "opening_balance": 100000
        }
        success, response = self.run_test(
            "Open Shift",
            "POST",
            "shifts/open",
            200,
            data=shift_data
        )
        if success:
            self.shift_id = response['id']
            print(f"   Opened shift with balance: Rp {response['opening_balance']:,}")
        return success

    def test_get_current_shift(self):
        """Test getting current shift"""
        success, response = self.run_test(
            "Get Current Shift",
            "GET",
            f"shifts/current/{self.user_id}",
            200
        )
        if success and response:
            print(f"   Current shift balance: Rp {response['opening_balance']:,}")
        return success

    def test_create_transaction(self):
        """Test creating a transaction"""
        if not self.shift_id or not self.service_id:
            print("   Skipping - No shift or service ID available")
            return True
            
        transaction_data = {
            "customer_id": self.customer_id,
            "items": [
                {
                    "service_id": self.service_id,
                    "service_name": "Test Service",
                    "price": 50000,
                    "quantity": 1
                }
            ],
            "payment_method": "cash",
            "payment_received": 50000
        }
        success, response = self.run_test(
            "Create Transaction",
            "POST",
            "transactions",
            200,
            data=transaction_data
        )
        if success:
            print(f"   Created transaction: {response['invoice_number']} - Rp {response['total']:,}")
        return success

    def test_get_transactions(self):
        """Test getting transactions list"""
        success, response = self.run_test(
            "Get Transactions",
            "GET",
            "transactions",
            200
        )
        if success:
            print(f"   Found {len(response)} transactions")
        return success

    def test_get_today_transactions(self):
        """Test getting today's transactions"""
        success, response = self.run_test(
            "Get Today Transactions",
            "GET",
            "transactions/today",
            200
        )
        if success:
            print(f"   Found {len(response)} transactions today")
        return success

    def test_close_shift(self):
        """Test closing a shift"""
        if not self.shift_id:
            print("   Skipping - No shift ID available")
            return True
            
        close_data = {
            "shift_id": self.shift_id,
            "closing_balance": 150000,
            "notes": "Test shift closure"
        }
        success, response = self.run_test(
            "Close Shift",
            "POST",
            "shifts/close",
            200,
            data=close_data
        )
        if success:
            variance = response.get('variance', 0)
            print(f"   Closed shift - Variance: Rp {variance:,}")
        return success

    def test_get_users(self):
        """Test getting users list (admin only)"""
        success, response = self.run_test(
            "Get Users",
            "GET",
            "users",
            200
        )
        if success:
            print(f"   Found {len(response)} users")
        return success

def main():
    print("🚀 Starting POS Car Wash System Backend Tests")
    print("=" * 60)
    
    tester = POSCarWashTester()
    
    # Authentication Tests
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1

    # Dashboard Tests
    tester.test_dashboard_stats()
    
    # Service Tests
    tester.test_get_services()
    
    # Customer Tests
    tester.test_get_customers()
    tester.test_create_customer()
    
    # Inventory Tests
    tester.test_get_inventory()
    tester.test_get_low_stock()
    
    # Membership Tests
    tester.test_get_memberships()
    tester.test_create_membership()
    
    # Shift Management Tests
    tester.test_open_shift()
    tester.test_get_current_shift()
    
    # Transaction Tests
    tester.test_create_transaction()
    tester.test_get_transactions()
    tester.test_get_today_transactions()
    
    # Close shift
    tester.test_close_shift()
    
    # User Management Tests
    tester.test_get_users()
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("✅ Backend tests mostly successful!")
        return 0
    else:
        print("❌ Backend has significant issues")
        return 1

if __name__ == "__main__":
    sys.exit(main())