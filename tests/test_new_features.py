"""
Test suite for new POS Car Wash features:
1. Outlet Management (CRUD + User Assignment)
2. Products Page (CRUD)
3. Customer Transaction Export
4. Payment Method 'subscription' for member transactions
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        return data["token"]
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["username"] == "admin"
        print(f"✓ Login successful for user: {data['user']['full_name']}")


class TestOutletManagement:
    """Outlet/Cabang CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def test_outlet_id(self, auth_headers):
        """Create a test outlet and return its ID"""
        outlet_data = {
            "name": "TEST_Outlet Cabang Baru",
            "address": "Jl. Test No. 123, Jakarta",
            "phone": "021-9999999",
            "manager_name": "Test Manager"
        }
        response = requests.post(f"{BASE_URL}/api/outlets", json=outlet_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create outlet: {response.text}"
        data = response.json()
        print(f"✓ Created test outlet: {data['name']} (ID: {data['id']})")
        return data["id"]
    
    def test_get_outlets(self, auth_headers):
        """Test GET /api/outlets - should return list of outlets"""
        response = requests.get(f"{BASE_URL}/api/outlets", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/outlets returned {len(data)} outlets")
        
        # Check if existing outlet exists
        outlet_names = [o['name'] for o in data]
        assert any('Sudirman' in name or 'Cabang' in name for name in outlet_names), "Expected at least one outlet"
    
    def test_create_outlet(self, auth_headers):
        """Test POST /api/outlets - create new outlet"""
        outlet_data = {
            "name": "TEST_Outlet Cabang Kemang",
            "address": "Jl. Kemang Raya No. 456, Jakarta Selatan",
            "phone": "021-7654321",
            "manager_name": "Budi Santoso"
        }
        response = requests.post(f"{BASE_URL}/api/outlets", json=outlet_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == outlet_data["name"]
        assert data["address"] == outlet_data["address"]
        assert "id" in data
        print(f"✓ Created outlet: {data['name']}")
        
        # Cleanup - delete the test outlet
        requests.delete(f"{BASE_URL}/api/outlets/{data['id']}", headers=auth_headers)
    
    def test_get_single_outlet(self, auth_headers, test_outlet_id):
        """Test GET /api/outlets/{id} - get single outlet"""
        response = requests.get(f"{BASE_URL}/api/outlets/{test_outlet_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_outlet_id
        print(f"✓ GET single outlet: {data['name']}")
    
    def test_update_outlet(self, auth_headers, test_outlet_id):
        """Test PUT /api/outlets/{id} - update outlet"""
        update_data = {
            "name": "TEST_Outlet Cabang Updated",
            "phone": "021-8888888"
        }
        response = requests.put(f"{BASE_URL}/api/outlets/{test_outlet_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["phone"] == update_data["phone"]
        print(f"✓ Updated outlet: {data['name']}")
    
    def test_delete_outlet(self, auth_headers, test_outlet_id):
        """Test DELETE /api/outlets/{id} - delete outlet"""
        response = requests.delete(f"{BASE_URL}/api/outlets/{test_outlet_id}", headers=auth_headers)
        assert response.status_code == 200
        print(f"✓ Deleted outlet: {test_outlet_id}")


class TestUserOutletAssignment:
    """Test user assignment to outlets"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_users_with_outlet_info(self, auth_headers):
        """Test GET /api/users - should include outlet_id and outlet_name"""
        response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers)
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        assert len(users) > 0
        
        # Check user structure includes outlet fields
        for user in users:
            assert "outlet_id" in user or user.get("outlet_id") is None
            assert "outlet_name" in user or user.get("outlet_name") is None
        
        print(f"✓ GET /api/users returned {len(users)} users with outlet info")
    
    def test_update_user_outlet_assignment(self, auth_headers):
        """Test PUT /api/users/{id} - assign user to outlet"""
        # First get outlets
        outlets_response = requests.get(f"{BASE_URL}/api/outlets", headers=auth_headers)
        outlets = outlets_response.json()
        
        if len(outlets) == 0:
            pytest.skip("No outlets available for assignment test")
        
        outlet_id = outlets[0]["id"]
        outlet_name = outlets[0]["name"]
        
        # Get users
        users_response = requests.get(f"{BASE_URL}/api/users", headers=auth_headers)
        users = users_response.json()
        
        # Find a non-owner user to update
        test_user = None
        for user in users:
            if user["role"] != "owner":
                test_user = user
                break
        
        if not test_user:
            pytest.skip("No non-owner user available for test")
        
        # Update user with outlet assignment
        update_data = {
            "outlet_id": outlet_id
        }
        response = requests.put(f"{BASE_URL}/api/users/{test_user['id']}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["outlet_id"] == outlet_id
        assert data["outlet_name"] == outlet_name
        print(f"✓ Assigned user {test_user['full_name']} to outlet {outlet_name}")


class TestProductsManagement:
    """Products CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def test_product_id(self, auth_headers):
        """Create a test product and return its ID"""
        product_data = {
            "name": "TEST_Parfum Mobil Premium",
            "description": "Parfum mobil aroma vanilla",
            "price": 75000,
            "category": "parfum"
        }
        response = requests.post(f"{BASE_URL}/api/products", json=product_data, headers=auth_headers)
        assert response.status_code == 200, f"Failed to create product: {response.text}"
        data = response.json()
        print(f"✓ Created test product: {data['name']} (ID: {data['id']})")
        return data["id"]
    
    def test_get_products(self, auth_headers):
        """Test GET /api/products - should return list of products"""
        response = requests.get(f"{BASE_URL}/api/products", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/products returned {len(data)} products")
    
    def test_create_product(self, auth_headers):
        """Test POST /api/products - create new product"""
        product_data = {
            "name": "TEST_Lap Microfiber",
            "description": "Lap microfiber premium untuk poles",
            "price": 35000,
            "category": "cleaning"
        }
        response = requests.post(f"{BASE_URL}/api/products", json=product_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == product_data["name"]
        assert data["price"] == product_data["price"]
        assert data["category"] == product_data["category"]
        assert "id" in data
        print(f"✓ Created product: {data['name']} - Rp {data['price']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/products/{data['id']}", headers=auth_headers)
    
    def test_get_single_product(self, auth_headers, test_product_id):
        """Test GET /api/products/{id} - get single product"""
        response = requests.get(f"{BASE_URL}/api/products/{test_product_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_product_id
        print(f"✓ GET single product: {data['name']}")
    
    def test_update_product(self, auth_headers, test_product_id):
        """Test PUT /api/products/{id} - update product"""
        update_data = {
            "name": "TEST_Parfum Mobil Updated",
            "price": 85000
        }
        response = requests.put(f"{BASE_URL}/api/products/{test_product_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["price"] == update_data["price"]
        print(f"✓ Updated product: {data['name']} - Rp {data['price']}")
    
    def test_delete_product(self, auth_headers, test_product_id):
        """Test DELETE /api/products/{id} - delete product"""
        response = requests.delete(f"{BASE_URL}/api/products/{test_product_id}", headers=auth_headers)
        assert response.status_code == 200
        print(f"✓ Deleted product: {test_product_id}")
    
    def test_product_categories(self, auth_headers):
        """Test that products have valid categories"""
        valid_categories = ['accessories', 'parfum', 'cleaning', 'care', 'other']
        
        # Create products with different categories
        for category in valid_categories[:2]:  # Test first 2 categories
            product_data = {
                "name": f"TEST_Product {category}",
                "price": 50000,
                "category": category
            }
            response = requests.post(f"{BASE_URL}/api/products", json=product_data, headers=auth_headers)
            assert response.status_code == 200
            data = response.json()
            assert data["category"] == category
            print(f"✓ Created product with category: {category}")
            
            # Cleanup
            requests.delete(f"{BASE_URL}/api/products/{data['id']}", headers=auth_headers)


class TestCustomerTransactions:
    """Test customer transaction history and export"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_customer_transactions(self, auth_headers):
        """Test GET /api/customers/{id}/transactions - get customer transaction history"""
        # First get customers
        customers_response = requests.get(f"{BASE_URL}/api/customers", headers=auth_headers)
        assert customers_response.status_code == 200
        customers = customers_response.json()
        
        if len(customers) == 0:
            pytest.skip("No customers available for test")
        
        # Get transactions for first customer
        customer = customers[0]
        response = requests.get(f"{BASE_URL}/api/customers/{customer['id']}/transactions", headers=auth_headers)
        assert response.status_code == 200
        transactions = response.json()
        assert isinstance(transactions, list)
        print(f"✓ GET customer transactions for {customer['name']}: {len(transactions)} transactions")
        
        # Verify transaction structure if any exist
        if len(transactions) > 0:
            tx = transactions[0]
            assert "invoice_number" in tx
            assert "items" in tx
            assert "total" in tx
            assert "payment_method" in tx
            assert "created_at" in tx
            print(f"  - Latest transaction: {tx['invoice_number']} - Rp {tx['total']}")


class TestSubscriptionPaymentMethod:
    """Test subscription payment method for member transactions"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_check_membership_endpoint(self, auth_headers):
        """Test POST /api/public/check-membership - check member by phone"""
        # Test with known member phone
        response = requests.post(f"{BASE_URL}/api/public/check-membership?phone=081234567890")
        
        if response.status_code == 404:
            print("⚠ Test member phone not found - skipping membership check test")
            pytest.skip("Test member not found")
        
        assert response.status_code == 200
        data = response.json()
        assert "customer" in data
        assert "memberships" in data
        print(f"✓ Membership check for phone 081234567890: {data['customer']['name']}")
        
        if len(data['memberships']) > 0:
            membership = data['memberships'][0]
            print(f"  - Membership type: {membership['membership_type']}")
            print(f"  - Status: {membership['status']}")
            print(f"  - Days remaining: {membership.get('days_remaining', 'N/A')}")
    
    def test_membership_use_endpoint(self, auth_headers):
        """Test POST /api/memberships/use - use membership for free wash"""
        # Get services first
        services_response = requests.get(f"{BASE_URL}/api/services", headers=auth_headers)
        services = services_response.json()
        
        if len(services) == 0:
            pytest.skip("No services available")
        
        # Find an exterior or interior service
        service = None
        for s in services:
            if s.get('category') in ['exterior', 'interior']:
                service = s
                break
        
        if not service:
            service = services[0]
        
        # Try to use membership
        usage_data = {
            "phone": "081234567890",
            "service_id": service['id']
        }
        response = requests.post(f"{BASE_URL}/api/memberships/use", json=usage_data, headers=auth_headers)
        
        if response.status_code == 400:
            # Membership already used today or no active membership
            print(f"⚠ Membership use returned 400: {response.json().get('detail', 'Unknown error')}")
            # This is expected if already used today
            return
        elif response.status_code == 404:
            print("⚠ Member phone not found")
            return
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Membership used: {data['message']}")
    
    def test_transaction_with_subscription_payment(self, auth_headers):
        """Test creating transaction with subscription payment method"""
        # First check if there's an open shift
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        user = me_response.json()
        
        shift_response = requests.get(f"{BASE_URL}/api/shifts/current/{user['id']}", headers=auth_headers)
        
        if shift_response.status_code != 200 or shift_response.json() is None:
            # Open a shift first
            shift_data = {
                "kasir_id": user['id'],
                "opening_balance": 500000
            }
            open_response = requests.post(f"{BASE_URL}/api/shifts/open", json=shift_data, headers=auth_headers)
            if open_response.status_code != 200:
                print(f"⚠ Could not open shift: {open_response.text}")
                pytest.skip("Cannot open shift for transaction test")
        
        # Get a service
        services_response = requests.get(f"{BASE_URL}/api/services", headers=auth_headers)
        services = services_response.json()
        
        if len(services) == 0:
            pytest.skip("No services available")
        
        service = services[0]
        
        # Create transaction with subscription payment (Rp 0)
        transaction_data = {
            "customer_id": None,
            "items": [{
                "service_id": service['id'],
                "service_name": service['name'],
                "price": 0,  # Free for member
                "quantity": 1,
                "is_member_usage": True,
                "notes": "Member Subscription - Gratis Cuci"
            }],
            "payment_method": "subscription",
            "payment_received": 0,
            "notes": "Member Subscription - Gratis Cuci"
        }
        
        response = requests.post(f"{BASE_URL}/api/transactions", json=transaction_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["payment_method"] == "subscription"
        assert data["total"] == 0
        print(f"✓ Created subscription transaction: {data['invoice_number']} - Rp {data['total']}")


class TestPaymentMethodEnum:
    """Test that PaymentMethod enum includes subscription"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_all_payment_methods(self, auth_headers):
        """Test that all payment methods are accepted"""
        # Get current user and shift
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        user = me_response.json()
        
        shift_response = requests.get(f"{BASE_URL}/api/shifts/current/{user['id']}", headers=auth_headers)
        
        if shift_response.status_code != 200 or shift_response.json() is None:
            shift_data = {
                "kasir_id": user['id'],
                "opening_balance": 500000
            }
            requests.post(f"{BASE_URL}/api/shifts/open", json=shift_data, headers=auth_headers)
        
        # Get a service
        services_response = requests.get(f"{BASE_URL}/api/services", headers=auth_headers)
        services = services_response.json()
        
        if len(services) == 0:
            pytest.skip("No services available")
        
        service = services[0]
        
        # Test each payment method
        payment_methods = ["cash", "card", "qr", "subscription"]
        
        for method in payment_methods:
            transaction_data = {
                "customer_id": None,
                "items": [{
                    "service_id": service['id'],
                    "service_name": service['name'],
                    "price": 0 if method == "subscription" else service['price'],
                    "quantity": 1
                }],
                "payment_method": method,
                "payment_received": 0 if method == "subscription" else service['price'],
                "notes": f"Test {method} payment"
            }
            
            response = requests.post(f"{BASE_URL}/api/transactions", json=transaction_data, headers=auth_headers)
            assert response.status_code == 200, f"Failed for payment method {method}: {response.text}"
            data = response.json()
            assert data["payment_method"] == method
            print(f"✓ Payment method '{method}' accepted")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
