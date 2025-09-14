from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import json

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    shop_name = db.Column(db.String(200))
    shop_address = db.Column(db.String(500))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    min_stock_alert_threshold = db.Column(db.Integer, default=5) # New field
    
    # Security settings
    session_timeout = db.Column(db.Integer, default=60)
    two_factor_auth = db.Column(db.Boolean, default=False)
    
    # Appearance settings
    theme = db.Column(db.String(20), default='light')
    accent_color = db.Column(db.String(20), default='blue')
    items_per_page = db.Column(db.Integer, default=25)
    compact_mode = db.Column(db.Boolean, default=False)
    
    # Backup settings
    auto_backup = db.Column(db.Boolean, default=False)
    backup_retention = db.Column(db.Integer, default=30)
    
    # Additional profile fields
    gst_number = db.Column(db.String(20))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    pincode = db.Column(db.String(10))
    
    # Stock settings
    auto_reorder_level = db.Column(db.Integer, default=5)
    default_tax_rate = db.Column(db.Float, default=18.0)
    currency = db.Column(db.String(10), default='INR')
    enable_barcode_scanning = db.Column(db.Boolean, default=True)
    enable_stock_alerts = db.Column(db.Boolean, default=True)
    
    # Notification settings
    email_low_stock = db.Column(db.Boolean, default=False)
    email_daily_summary = db.Column(db.Boolean, default=False)
    email_weekly_report = db.Column(db.Boolean, default=False)
    browser_notifications = db.Column(db.Boolean, default=True)
    sound_alerts = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    products = db.relationship('Product', backref='owner', lazy=True, cascade='all, delete-orphan')
    bills = db.relationship('Bill', backref='created_by', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    barcode = db.Column(db.String(100), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(100))
    brand = db.Column(db.String(100))
    purchase_price = db.Column(db.Float, nullable=False)
    selling_price = db.Column(db.Float, nullable=False)
    current_stock = db.Column(db.Integer, default=0)
    min_stock_level = db.Column(db.Integer, default=5)
    unit = db.Column(db.String(50), default='piece')  # piece, kg, liter, etc.
    image_url = db.Column(db.String(500))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    stock_movements = db.relationship('StockMovement', backref='product', lazy=True, cascade='all, delete-orphan')
    bill_items = db.relationship('BillItem', backref='product', lazy=True)
    
    @property
    def profit_margin(self):
        if self.purchase_price > 0:
            return ((self.selling_price - self.purchase_price) / self.purchase_price) * 100
        return 0
    
    @property
    def stock_value(self):
        return self.current_stock * self.purchase_price
    
    @property
    def is_low_stock(self):
        return self.current_stock <= self.min_stock_level
    
    def __repr__(self):
        return f'<Product {self.name} - {self.barcode}>'

class StockMovement(db.Model):
    __tablename__ = 'stock_movements'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    movement_type = db.Column(db.String(20), nullable=False)  # 'IN' or 'OUT'
    quantity = db.Column(db.Integer, nullable=False)
    previous_stock = db.Column(db.Integer, default=0)
    new_stock = db.Column(db.Integer, default=0)
    price = db.Column(db.Float)  # Purchase price for IN, selling price for OUT
    reference_type = db.Column(db.String(50))  # 'PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN'
    reference_id = db.Column(db.String(100))  # Bill ID or other reference
    reason = db.Column(db.String(200))  # Reason for the movement
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='stock_movements', lazy=True)
    
    def __repr__(self):
        return f'<StockMovement {self.movement_type} - {self.quantity}>'

class Bill(db.Model):
    __tablename__ = 'bills'
    
    id = db.Column(db.Integer, primary_key=True)
    bill_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_name = db.Column(db.String(200))
    customer_phone = db.Column(db.String(20))
    status = db.Column(db.String(20), default='COMPLETED')  # DRAFT, HOLD, COMPLETED, CANCELLED
    subtotal = db.Column(db.Float, default=0)
    tax_amount = db.Column(db.Float, default=0)
    discount_amount = db.Column(db.Float, default=0)
    total_amount = db.Column(db.Float, default=0)
    amount_paid = db.Column(db.Float, default=0)
    payment_method = db.Column(db.String(50))  # CASH, CARD, UPI, CREDIT
    notes = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    items = db.relationship('BillItem', backref='bill', lazy=True, cascade='all, delete-orphan')
    
    @property
    def total_items(self):
        return sum(item.quantity for item in self.items)
    
    @property
    def total_profit(self):
        return sum((item.selling_price - item.product.purchase_price) * item.quantity for item in self.items if item.product)
    
    def calculate_totals(self):
        self.subtotal = sum(item.total_price for item in self.items)
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
        return self.total_amount
    
    def __repr__(self):
        return f'<Bill {self.bill_number} - {self.total_amount}>'

class BillItem(db.Model):
    __tablename__ = 'bill_items'
    
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey('bills.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    selling_price = db.Column(db.Float, nullable=False)
    discount = db.Column(db.Float, default=0)
    total_price = db.Column(db.Float, nullable=False)
    
    def calculate_total(self):
        self.total_price = (self.selling_price * self.quantity) - self.discount
        return self.total_price
    
    def __repr__(self):
        return f'<BillItem {self.product_id} - Qty: {self.quantity}>'

class DailySummary(db.Model):
    __tablename__ = 'daily_summaries'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    total_sales = db.Column(db.Float, default=0)
    total_profit = db.Column(db.Float, default=0)
    total_bills = db.Column(db.Integer, default=0)
    total_items_sold = db.Column(db.Integer, default=0)
    top_selling_products = db.Column(db.Text)  # JSON string
    payment_summary = db.Column(db.Text)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_top_selling_products(self, products_list):
        self.top_selling_products = json.dumps(products_list)
    
    def get_top_selling_products(self):
        if self.top_selling_products:
            return json.loads(self.top_selling_products)
        return []
    
    def set_payment_summary(self, payment_dict):
        self.payment_summary = json.dumps(payment_dict)
    
    def get_payment_summary(self):
        if self.payment_summary:
            return json.loads(self.payment_summary)
        return {}
    
    def __repr__(self):
        return f'<DailySummary {self.date} - Sales: {self.total_sales}>'
