from locust import HttpUser, task, between
from locust.contrib.fasthttp import FastHttpUser
import random
import json

class MobileShopUser(FastHttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Called when a user starts"""
        self.token = None
        self.user_id = None
        self.cart_items = []
        
    @task(3)
    def view_products(self):
        """Browse products - most common action"""
        self.client.get("/api/v1/products", name="/api/v1/products")
        
    @task(2)
    def get_product_details(self):
        """View individual product details"""
        # Random product ID between 1 and 100
        product_id = random.randint(1, 100)
        self.client.get(f"/api/v1/products/{product_id}", 
                      name="/api/v1/products/[id]")
    
    @task(1)
    def search_products(self):
        """Search products"""
        search_terms = ["iPhone", "Samsung", "Google", "phone", "mobile"]
        search_term = random.choice(search_terms)
        self.client.get(f"/api/v1/products?search={search_term}", 
                      name="/api/v1/products?search")
    
    @task(2)
    def register_user(self):
        """Register new user"""
        if self.token is None:  # Only register if not logged in
            random_id = random.randint(10000, 99999)
            user_data = {
                "name": f"LoadTest User {random_id}",
                "email": f"loadtest{random_id}@example.com",
                "password": "password123"
            }
            
            with self.client.post("/api/v1/auth/register", 
                               json=user_data,
                               name="/api/v1/auth/register",
                               catch_response=True) as response:
                if response.status_code == 201:
                    self.token = response.js["token"]
                    self.user_id = response.js["user"]["id"]
                else:
                    response.failure(f"Registration failed: {response.text}")
    
    @task(3)
    def login_user(self):
        """Login user"""
        if self.token is None:
            # Use existing test user or create new one
            user_id = random.randint(1, 1000)
            login_data = {
                "email": f"testuser{user_id}@example.com",
                "password": "password123"
            }
            
            with self.client.post("/api/v1/auth/login",
                               json=login_data,
                               name="/api/v1/auth/login",
                               catch_response=True) as response:
                if response.status_code == 200:
                    self.token = response.js["token"]
                    self.user_id = response.js["user"]["id"]
                else:
                    # Try to register new user
                    self.register_user()
    
    @task(2)
    def view_orders(self):
        """View user orders"""
        if self.token:
            headers = {"Authorization": f"Bearer {self.token}"}
            self.client.get("/api/v1/orders/my",
                          headers=headers,
                          name="/api/v1/orders/my")
    
    @task(1)
    def create_order(self):
        """Create an order (checkout)"""
        if self.token:
            # First add items to cart logic (simplified)
            product_id = random.randint(1, 10)
            quantity = random.randint(1, 3)
            
            order_data = {
                "items": [
                    {
                        "product_id": product_id,
                        "quantity": quantity
                    }
                ]
            }
            
            headers = {"Authorization": f"Bearer {self.token}"}
            
            with self.client.post("/api/v1/orders/checkout",
                               json=order_data,
                               headers=headers,
                               name="/api/v1/orders/checkout",
                               catch_response=True) as response:
                if response.status_code == 200:
                    self.cart_items = []  # Clear cart after successful order
                else:
                    response.failure(f"Order creation failed: {response.text}")
    
    @task(1)
    def refresh_token(self):
        """Refresh authentication token"""
        if self.token:
            # This would need refresh token implementation
            pass
    
    @task(1)
    def logout_user(self):
        """Logout user"""
        if self.token:
            headers = {"Authorization": f"Bearer {self.token}"}
            self.client.post("/api/v1/auth/logout",
                          headers=headers,
                          name="/api/v1/auth/logout")
            self.token = None
            self.user_id = None


class AdminUser(MobileShopUser):
    """Admin user with additional tasks"""
    
    def on_start(self):
        super().on_start()
        # Login as admin
        login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        
        with self.client.post("/api/v1/auth/login",
                           json=login_data,
                           name="/api/v1/auth/login [admin]",
                           catch_response=True) as response:
            if response.status_code == 200:
                self.token = response.js["token"]
                self.user_id = response.js["user"]["id"]
    
    @task(2)
    def create_product(self):
        """Create new product (admin only)"""
        if self.token:
            random_id = random.randint(10000, 99999)
            product_data = {
                "name": f"Load Test Product {random_id}",
                "description": "Product created during load testing",
                "price": round(random.uniform(50, 1000), 2),
                "stock": random.randint(10, 100)
            }
            
            headers = {"Authorization": f"Bearer {self.token}"}
            
            with self.client.post("/api/v1/products",
                               json=product_data,
                               headers=headers,
                               name="/api/v1/products [POST]",
                               catch_response=True) as response:
                if response.status_code != 201:
                    response.failure(f"Product creation failed: {response.text}")
    
    @task(1)
    def update_product(self):
        """Update existing product (admin only)"""
        if self.token:
            product_id = random.randint(1, 100)
            update_data = {
                "name": f"Updated Product {product_id}",
                "price": round(random.uniform(50, 1000), 2),
                "stock": random.randint(10, 100)
            }
            
            headers = {"Authorization": f"Bearer {self.token}"}
            
            self.client.put(f"/api/v1/products/{product_id}",
                          json=update_data,
                          headers=headers,
                          name="/api/v1/products/[id] [PUT]")
    
    @task(1)
    def view_all_orders(self):
        """View all orders (admin only)"""
        if self.token:
            headers = {"Authorization": f"Bearer {self.token}"}
            self.client.get("/api/v1/orders",
                          headers=headers,
                          name="/api/v1/orders [admin]")


# Website user class for testing frontend
class WebsiteUser(HttpUser):
    wait_time = between(2, 5)
    host = "http://localhost:3000"
    
    @task(3)
    def browse_homepage(self):
        """Browse homepage"""
        self.client.get("/", name="Homepage")
    
    @task(2)
    def browse_products(self):
        """Browse products page"""
        self.client.get("/#catalog", name="Products Page")
    
    @task(1)
    def view_login_page(self):
        """View login page"""
        self.client.get("/login", name="Login Page")
    
    @task(1)
    def view_signup_page(self):
        """View signup page"""
        self.client.get("/signup", name="Signup Page")
