import os
import json
import requests
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
from datetime import datetime, date, timedelta
from sqlalchemy import func, desc, text, distinct
from sqlalchemy.exc import IntegrityError
import traceback
import sys
import io

# Load environment variables
load_dotenv()

# Import models
from models import db, User, Product, Bill, BillItem, StockMovement, DailySummary

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Database configuration - using SQLite for both local and Vercel
if os.environ.get('VERCEL'):
    # For Vercel, use /tmp directory (note: data will be lost on function restart)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/retail_manager.db'
else:
    # Local development
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///retail_manager.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Performance optimizations
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
    'connect_args': {
        'timeout': 20,
        'check_same_thread': False
    }
}

# Enable compression for responses
from flask import g
import gzip
import io
import time

# Performance monitoring
request_times = []

@app.before_request
def before_request():
    g.start_time = time.time()

@app.after_request
def compress_response(response):
    """Compress responses and monitor performance"""
    # Record request time
    if hasattr(g, 'start_time'):
        request_time = time.time() - g.start_time
        request_times.append(request_time)
        # Keep only last 100 requests
        if len(request_times) > 100:
            request_times.pop(0)
    
    # Add cache headers for static assets
    if request.endpoint and 'static' in request.endpoint:
        response.headers['Cache-Control'] = 'public, max-age=31536000'  # 1 year
        response.headers['Expires'] = 'Thu, 31 Dec 2025 23:59:59 GMT'
    
    # Skip compression for static files to avoid passthrough mode issues
    if (response.status_code < 200 or 
        response.status_code >= 300 or 
        'Content-Encoding' in response.headers or
        request.path.startswith('/static/')):
        return response
    
    # Compress responses
    try:
        response_data = response.get_data()
        if len(response_data) < 500:
            return response
    except RuntimeError:
        # Skip compression if response is in passthrough mode
        return response
    
    if 'gzip' in request.headers.get('Accept-Encoding', ''):
        response.direct_passthrough = False
        
        gzip_buffer = io.BytesIO()
        with gzip.GzipFile(fileobj=gzip_buffer, mode='wb') as gz_file:
            gz_file.write(response.get_data())
        
        response.set_data(gzip_buffer.getvalue())
        response.headers['Content-Encoding'] = 'gzip'
        response.headers['Content-Length'] = len(response.get_data())
    
    return response

# Initialize extensions
db.init_app(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'info'

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# Create database tables and handle migrations
def migrate_database():
    """Handle database migrations for schema changes"""
    try:
        # Check if user_id column exists in stock_movements table
        with db.engine.connect() as connection:
            result = connection.execute(text("PRAGMA table_info(stock_movements)"))
            columns = [row[1] for row in result]
            
            if 'user_id' not in columns:
                print("Adding user_id column to stock_movements table...")
                connection.execute(text("ALTER TABLE stock_movements ADD COLUMN user_id INTEGER"))
                connection.execute(text("UPDATE stock_movements SET user_id = 1 WHERE user_id IS NULL"))
                connection.commit()
                print("User_id migration completed successfully.")
            
            # Check if reason column exists in stock_movements table
            if 'reason' not in columns:
                print("Adding reason column to stock_movements table...")
                connection.execute(text("ALTER TABLE stock_movements ADD COLUMN reason VARCHAR(200)"))
                connection.execute(text("UPDATE stock_movements SET reason = 'Legacy entry' WHERE reason IS NULL"))
                connection.commit()
                print("Reason column migration completed successfully.")
            
            # Check if min_stock_alert_threshold column exists in users table
            result = connection.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result]
            
            if 'min_stock_alert_threshold' not in columns:
                print("Adding min_stock_alert_threshold column to users table...")
                connection.execute(text("ALTER TABLE users ADD COLUMN min_stock_alert_threshold INTEGER DEFAULT 5"))
                connection.commit()
                print("min_stock_alert_threshold migration completed successfully.")
            
            # Create comprehensive indexes for better performance
            try:
                # Existing indexes
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id)"))
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id)"))
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_products_barcode_user ON products(barcode, user_id)"))
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id)"))
                
                # Additional performance indexes
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_bills_user_status_date ON bills(user_id, status, created_at)"))
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_products_user_stock ON products(user_id, current_stock, min_stock_level)"))
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_bill_items_bill_product ON bill_items(bill_id, product_id)"))
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_products_user_category ON products(user_id, category)"))
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at)"))
                connection.execute(text("CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at)"))
                
                connection.commit()
                print("Performance indexes created successfully")
            except Exception as e:
                if "already exists" not in str(e):
                    print(f"Index creation failed (may already exist): {e}")
                    
    except Exception as e:
        print(f"Migration error: {e}")

# Initialize database only if not in Vercel environment
# Vercel functions are stateless, so we handle DB initialization differently
def init_database():
    """Initialize database tables and run migrations"""
    try:
        db.create_all()
        migrate_database()
    except Exception as e:
        print(f"Database initialization error: {e}")

if not os.environ.get('VERCEL'):
    with app.app_context():
        init_database()
else:
    # For Vercel, initialize on first request
    @app.before_first_request
    def initialize_db():
        init_database()

# Authentication Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and bcrypt.check_password_hash(user.password_hash, password):
            login_user(user, remember=True)
            next_page = request.args.get('next')
            flash('Login successful!', 'success')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password.', 'danger')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        shop_name = request.form.get('shop_name')
        shop_address = request.form.get('shop_address')
        phone = request.form.get('phone')
        email = request.form.get('email')
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists. Please choose a different one.', 'danger')
            return redirect(url_for('register'))
        
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(
            username=username,
            password_hash=hashed_password,
            shop_name=shop_name,
            shop_address=shop_address,
            phone=phone,
            email=email
        )
        db.session.add(new_user)
        db.session.commit()
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

# Dashboard Routes
@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    if request.method == 'POST':
        try:
            # Handle shop information updates
            if 'shop_name' in request.form:
                current_user.shop_name = request.form.get('shop_name')
                current_user.shop_address = request.form.get('shop_address')
                current_user.email = request.form.get('email')
                current_user.phone = request.form.get('phone')
                current_user.gst_number = request.form.get('gst_number')
                current_user.city = request.form.get('city')
                current_user.state = request.form.get('state')
                current_user.pincode = request.form.get('pincode')
                flash('Shop information updated successfully!', 'success')
            
            # Handle stock settings updates
            elif 'min_stock_alert_threshold' in request.form:
                current_user.min_stock_alert_threshold = int(request.form.get('min_stock_alert_threshold', 10))
                current_user.auto_reorder_level = int(request.form.get('auto_reorder_level', 5))
                current_user.default_tax_rate = float(request.form.get('default_tax_rate', 18))
                current_user.currency = request.form.get('currency', 'INR')
                current_user.enable_barcode_scanning = 'enable_barcode_scanning' in request.form
                current_user.enable_stock_alerts = 'enable_stock_alerts' in request.form
                flash('Stock settings updated successfully!', 'success')
            
            # Handle notification settings updates
            elif 'email_low_stock' in request.form or 'browser_notifications' in request.form:
                current_user.email_low_stock = 'email_low_stock' in request.form
                current_user.email_daily_summary = 'email_daily_summary' in request.form
                current_user.email_weekly_report = 'email_weekly_report' in request.form
                current_user.browser_notifications = 'browser_notifications' in request.form
                current_user.sound_alerts = 'sound_alerts' in request.form
                flash('Notification settings updated successfully!', 'success')
            
            # Handle security settings updates
            elif 'current_password' in request.form:
                current_password = request.form.get('current_password')
                new_password = request.form.get('new_password')
                confirm_password = request.form.get('confirm_password')
                
                if current_password and new_password and confirm_password:
                    if bcrypt.check_password_hash(current_user.password_hash, current_password):
                        if new_password == confirm_password:
                            if len(new_password) >= 6:
                                current_user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
                                flash('Password updated successfully!', 'success')
                            else:
                                flash('New password must be at least 6 characters long.', 'danger')
                        else:
                            flash('New passwords do not match.', 'danger')
                    else:
                        flash('Current password is incorrect.', 'danger')
                
                current_user.session_timeout = int(request.form.get('session_timeout', 60))
                current_user.two_factor_auth = 'two_factor_auth' in request.form
                if 'current_password' not in request.form or not current_password:
                    flash('Security settings updated successfully!', 'success')
            
            # Handle appearance settings updates
            elif 'theme' in request.form:
                current_user.theme = request.form.get('theme', 'light')
                current_user.accent_color = request.form.get('accent_color', 'blue')
                current_user.items_per_page = int(request.form.get('items_per_page', 25))
                current_user.compact_mode = 'compact_mode' in request.form
                flash('Appearance settings updated successfully!', 'success')
            
            # Handle backup settings updates
            elif 'auto_backup' in request.form or 'backup_retention' in request.form:
                current_user.auto_backup = 'auto_backup' in request.form
                current_user.backup_retention = int(request.form.get('backup_retention', 30))
                flash('Backup settings updated successfully!', 'success')
            
            db.session.commit()
            
        except ValueError as e:
            flash('Invalid input value. Please check your entries.', 'danger')
        except Exception as e:
            flash('An error occurred while updating settings.', 'danger')
        
        return redirect(url_for('settings'))
    
    return render_template('settings.html')

# Export Routes
@app.route('/export/products')
@login_required
def export_products():
    import csv
    from io import StringIO
    from flask import make_response
    
    # Get all products for current user
    products = Product.query.filter_by(user_id=current_user.id).all()
    
    # Create CSV content
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['Name', 'Barcode', 'Price', 'Cost Price', 'Current Stock', 'Category', 'Description'])
    
    # Write product data
    for product in products:
        writer.writerow([
            product.name,
            product.barcode,
            product.selling_price,
            product.purchase_price,
            product.current_stock,
            product.category,
            product.description or ''
        ])
    
    # Create response
    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = f'attachment; filename=products_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    
    return response

@app.route('/export/sales')
@login_required
def export_sales():
    import csv
    from io import StringIO
    from flask import make_response
    
    # Get all bill items for current user (sales data)
    bills = Bill.query.filter_by(user_id=current_user.id).order_by(Bill.created_at.desc()).limit(1000).all()
    
    # Create CSV content
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['Date', 'Time', 'Product Name', 'Quantity', 'Unit Price', 'Total Amount', 'Payment Method'])
    
    # Write sales data
    for bill in bills:
        for item in bill.items:
            writer.writerow([
                bill.created_at.strftime('%Y-%m-%d'),
                bill.created_at.strftime('%H:%M:%S'),
                item.product.name if item.product else 'Unknown Product',
                item.quantity,
                item.selling_price,
                item.total_price,
                bill.payment_method or 'Cash'
            ])
    
    # Create response
    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = f'attachment; filename=sales_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    
    return response

@app.route('/backup/create')
@login_required
def create_backup():
    import json
    from io import StringIO
    from flask import make_response
    
    # Create comprehensive backup data
    backup_data = {
        'user_info': {
            'username': current_user.username,
            'shop_name': current_user.shop_name,
            'shop_address': current_user.shop_address,
            'email': current_user.email,
            'phone': current_user.phone,
            'created_at': current_user.created_at.isoformat() if current_user.created_at else None
        },
        'products': [],
        'sales': [],
        'backup_timestamp': datetime.now().isoformat()
    }
    
    # Add products
    products = Product.query.filter_by(user_id=current_user.id).all()
    for product in products:
        backup_data['products'].append({
            'name': product.name,
            'barcode': product.barcode,
            'selling_price': float(product.selling_price),
            'purchase_price': float(product.purchase_price) if product.purchase_price else None,
            'current_stock': product.current_stock,
            'category': product.category,
            'description': product.description,
            'created_at': product.created_at.isoformat() if product.created_at else None
        })
    
    # Add sales (last 1000 records from bills)
    bills = Bill.query.filter_by(user_id=current_user.id).order_by(Bill.created_at.desc()).limit(1000).all()
    for bill in bills:
        for item in bill.items:
            backup_data['sales'].append({
                'timestamp': bill.created_at.isoformat(),
                'bill_number': bill.bill_number,
                'product_name': item.product.name if item.product else 'Unknown Product',
                'quantity': item.quantity,
                'unit_price': float(item.selling_price),
                'total_amount': float(item.total_price),
                'payment_method': bill.payment_method
            })
    
    # Create JSON response
    response = make_response(json.dumps(backup_data, indent=2))
    response.headers['Content-Type'] = 'application/json'
    response.headers['Content-Disposition'] = f'attachment; filename=backup_{current_user.username}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    
    flash('Backup created successfully!', 'success')
    return response

@app.route('/dashboard')
@login_required
def dashboard():
    # Optimized dashboard with single query approach
    today = datetime.utcnow().date()
    
    # Single optimized query for today's statistics
    today_stats = db.session.query(
        func.count(Bill.id).label('bill_count'),
        func.sum(Bill.total_amount).label('total_sales')
    ).filter(
        Bill.user_id == current_user.id,
        func.date(Bill.created_at) == today,
        Bill.status == 'COMPLETED'
    ).first()
    
    # Calculate total items separately using proper SQL aggregation
    total_items_today = db.session.query(
        func.sum(BillItem.quantity)
    ).join(Bill).filter(
        Bill.user_id == current_user.id,
        func.date(Bill.created_at) == today,
        Bill.status == 'COMPLETED'
    ).scalar() or 0
    
    # Calculate profit in a separate optimized query
    today_profit = db.session.query(
        func.sum((BillItem.selling_price - Product.purchase_price) * BillItem.quantity)
    ).join(Product).join(Bill).filter(
        Bill.user_id == current_user.id,
        func.date(Bill.created_at) == today,
        Bill.status == 'COMPLETED'
    ).scalar() or 0
    
    # Optimized low stock count
    low_stock = db.session.query(func.count(Product.id)).filter(
        Product.user_id == current_user.id,
        Product.current_stock <= Product.min_stock_level
    ).scalar()
    
    # Get recent bills with limit
    recent_bills = Bill.query.filter_by(
        user_id=current_user.id
    ).order_by(Bill.created_at.desc()).limit(5).all()
    
    # Optimized top selling products query
    top_products = db.session.query(
        Product.name,
        func.sum(BillItem.quantity).label('total_sold')
    ).join(BillItem).join(Bill).filter(
        Product.user_id == current_user.id,
        Bill.status == 'COMPLETED'
    ).group_by(Product.id, Product.name).order_by(
        desc('total_sold')
    ).limit(5).all()
    
    return render_template('dashboard.html',
                         today_sales=today_stats.total_sales or 0,
                         today_profit=today_profit,
                         today_items=total_items_today,
                         today_bills=today_stats.bill_count or 0,
                         low_stock=low_stock,
                         recent_bills=recent_bills,
                         top_products=top_products)

# Product Management Routes
@app.route('/products')
@login_required
def products():
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    page = request.args.get('page', 1, type=int)
    per_page = 50  # Limit products per page for better performance
    
    query = Product.query.filter_by(user_id=current_user.id)
    
    if search:
        # Use LIKE for better performance with indexes
        search_term = f"%{search}%"
        query = query.filter(
            db.or_(
                Product.name.like(search_term),
                Product.barcode.like(search_term),
                Product.brand.like(search_term)
            )
        )
    
    if category:
        query = query.filter_by(category=category)
    
    # Use pagination for better performance
    products_pagination = query.order_by(Product.name).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Optimized categories query
    categories = db.session.query(Product.category).filter(
        Product.user_id == current_user.id,
        Product.category.isnot(None)
    ).distinct().all()
    
    return render_template('products.html', 
                         products=products_pagination.items, 
                         categories=categories,
                         pagination=products_pagination)

@app.route('/products/add', methods=['GET', 'POST'])
@login_required
def add_product():
    if request.method == 'POST':
        barcode = request.form.get('barcode')
        
        # Check if product already exists for this user
        existing = Product.query.filter_by(barcode=barcode, user_id=current_user.id).first()
        if existing:
            flash('Product with this barcode already exists!', 'warning')
            return redirect(url_for('edit_product', id=existing.id))
        
        product = Product(
            barcode=barcode,
            name=request.form.get('name'),
            description=request.form.get('description'),
            category=request.form.get('category'),
            brand=request.form.get('brand'),
            purchase_price=float(request.form.get('purchase_price', 0)),
            selling_price=float(request.form.get('selling_price', 0)),
            current_stock=int(request.form.get('current_stock', 0)),
            min_stock_level=int(request.form.get('min_stock_level', 5)),
            unit=request.form.get('unit', 'piece'),
            user_id=current_user.id
        )
        
        db.session.add(product)
        db.session.flush()  # This assigns the ID to the product without committing
        
        # Add stock movement for initial stock
        if product.current_stock > 0:
            movement = StockMovement(
                product_id=product.id,
                user_id=current_user.id,
                movement_type='IN',
                quantity=product.current_stock,
                previous_stock=0,
                new_stock=product.current_stock,
                price=product.purchase_price,
                reference_type='PURCHASE',
                reference_id=None,
                reason='Initial stock entry',
                notes='Initial stock'
            )
            db.session.add(movement)
        
        db.session.commit()
        flash('Product added successfully!', 'success')
        return redirect(url_for('products') + '?success=product_added')
    
    return render_template('add_product.html')

@app.route('/products/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_product(id):
    product = Product.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    
    if request.method == 'POST':
        product.name = request.form.get('name')
        product.description = request.form.get('description')
        product.category = request.form.get('category')
        product.brand = request.form.get('brand')
        product.purchase_price = float(request.form.get('purchase_price', 0))
        product.selling_price = float(request.form.get('selling_price', 0))
        product.min_stock_level = int(request.form.get('min_stock_level', 5))
        product.unit = request.form.get('unit', 'piece')
        
        # Handle stock adjustment
        new_stock = int(request.form.get('current_stock', 0))
        if new_stock != product.current_stock:
            diff = new_stock - product.current_stock
            movement = StockMovement(
                product_id=product.id,
                user_id=current_user.id,
                movement_type='IN' if diff > 0 else 'OUT',
                quantity=abs(diff),
                previous_stock=product.current_stock,
                new_stock=new_stock,
                price=product.purchase_price,
                reference_type='ADJUSTMENT',
                reference_id=None,
                reason='Manual stock adjustment',
                notes=f'Stock adjustment from {product.current_stock} to {new_stock}'
            )
            db.session.add(movement)
            product.current_stock = new_stock
        
        db.session.commit()
        flash('Product updated successfully!', 'success')
        return redirect(url_for('products'))
    
    return render_template('edit_product.html', product=product)

@app.route('/products/delete/<int:id>')
@login_required
def delete_product(id):
    product = Product.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    
    try:
        # Delete all related records first to avoid foreign key constraints
        # Delete stock movements
        StockMovement.query.filter_by(product_id=id).delete()
        
        # Delete bill items (this will remove the product from sales history)
        BillItem.query.filter_by(product_id=id).delete()
        
        # Now delete the product
        db.session.delete(product)
        db.session.commit()
        
        flash('Product deleted successfully!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash('An error occurred while deleting the product. Please try again.', 'error')
    
    return redirect(url_for('products'))

# Barcode Scanning API
@app.route('/api/product/barcode/<barcode>')
@login_required
def get_product_by_barcode(barcode):
    product = Product.query.filter_by(barcode=barcode, user_id=current_user.id).first()
    
    if product:
        return jsonify({
            'success': True,
            'product': {
                'id': product.id,
                'barcode': product.barcode,
                'name': product.name,
                'selling_price': product.selling_price,
                'current_stock': product.current_stock,
                'unit': product.unit
            }
        })
    else:
        return jsonify({'success': False, 'message': 'Product not found'}), 404

# Billing Routes
@app.route('/billing')
@login_required
def billing():
    # Get bills on hold
    held_bills = Bill.query.filter_by(user_id=current_user.id, status='HOLD').order_by(Bill.created_at.desc()).all()
    return render_template('billing.html', held_bills=held_bills)


@app.route('/api/billing/create', methods=['POST'])
@login_required
def create_bill():
    try:
        data = request.json
        if not isinstance(data, dict): # Ensure data is a dictionary
            data = {} # Default to empty dict if not valid JSON
            print("Warning: request.json was not a dictionary in create_bill. Defaulting to empty dict.")

        # Generate bill number
        today = datetime.utcnow().date() # Use UTC date for consistency
        
        # Ensure current_user is available and has an ID
        if not current_user or not current_user.is_authenticated or not current_user.id:
            print(f"Error: current_user not authenticated or ID missing in create_bill. current_user: {current_user}")
            return jsonify({'success': False, 'message': 'User not authenticated or ID missing'}), 401

        # Generate unique bill number with retry logic to handle race conditions
        max_attempts = 10
        bill_number = None
        
        for attempt in range(max_attempts):
            # Find the highest bill number for the current user and day
            last_bill = Bill.query.filter(
                Bill.user_id == current_user.id,
                Bill.bill_number.like(f"BILL-{today.strftime('%Y%m%d')}-%")
            ).order_by(Bill.bill_number.desc()).first()
            
            if last_bill and last_bill.bill_number:
                # Extract the sequential part (e.g., '0001' from 'BILL-20250907-0001')
                try:
                    last_seq_str = last_bill.bill_number.split('-')[-1]
                    last_seq_num = int(last_seq_str)
                    next_seq_num = last_seq_num + 1
                except (ValueError, IndexError):
                    # Fallback if parsing fails (e.g., malformed bill_number)
                    next_seq_num = 1
            else:
                next_seq_num = 1
                
            bill_number = f"BILL-{today.strftime('%Y%m%d')}-{next_seq_num:04d}"
            
            # Check if this bill number already exists
            existing_bill = Bill.query.filter_by(bill_number=bill_number).first()
            if not existing_bill:
                break  # Found a unique bill number
            
            # If we reach here, the bill number exists, so we'll try again
            bill_number = None
        
        if not bill_number:
            # If we couldn't generate a unique bill number after max attempts
            # Use timestamp as fallback to ensure uniqueness
            timestamp = datetime.utcnow().strftime('%H%M%S%f')[:9]  # HHMMSSMMM
            bill_number = f"BILL-{today.strftime('%Y%m%d')}-{timestamp}"
        
        bill = Bill(
            bill_number=bill_number,
            customer_name=data.get('customer_name', ''),
            customer_phone=data.get('customer_phone', ''),
            status='DRAFT',
            user_id=current_user.id
        )
        
        db.session.add(bill)
        
        # Try to commit with additional error handling for constraint violations
        try:
            db.session.commit()
        except Exception as commit_error:
            db.session.rollback()
            
            # If it's still a constraint error, try one more time with timestamp-based bill number
            if "UNIQUE constraint failed: bills.bill_number" in str(commit_error):
                timestamp = datetime.utcnow().strftime('%H%M%S%f')[:9]  # HHMMSSMMM
                bill.bill_number = f"BILL-{today.strftime('%Y%m%d')}-{timestamp}"
                
                try:
                    db.session.add(bill)
                    db.session.commit()
                except Exception as final_error:
                    db.session.rollback()
                    raise final_error
            else:
                raise commit_error
        
        return jsonify({
            'success': True,
            'bill_id': bill.id,
            'bill_number': bill.bill_number
        })

    except Exception as e:
        # Capture the traceback as a string
        sio = io.StringIO()
        traceback.print_exc(file=sio)
        error_traceback = sio.getvalue()
        
        # Define the log file path
        log_file_path = os.path.join(os.getcwd(), 'error_log.txt') # Log in current working directory

        # Write the traceback to the log file
        with open(log_file_path, 'a') as f: # 'a' for append mode
            f.write(f"[{datetime.now()}] An error occurred in create_bill: {e}\n")
            f.write(error_traceback)
            f.write("-" * 50 + "\n\n") # Separator for multiple errors

        print(f"An error occurred in create_bill. Traceback written to {log_file_path}", file=sys.stderr)
        sys.stderr.flush()

        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Internal server error during bill creation. Details logged to error_log.txt',
            'debug_info': error_traceback # Still include for immediate feedback if user can see it
        }), 500

@app.route('/api/billing/add-item', methods=['POST'])
@login_required
def add_bill_item():
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        bill_id = data.get('bill_id')
        product_id = data.get('product_id')
        
        try:
            quantity = int(data.get('quantity', 1))
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Invalid quantity'}), 400
        
        if quantity <= 0:
            return jsonify({'success': False, 'message': 'Quantity must be greater than 0'}), 400
        
        bill = Bill.query.filter_by(id=bill_id, user_id=current_user.id).first()
        product = Product.query.filter_by(id=product_id, user_id=current_user.id).first()
        
        if not bill or not product:
            return jsonify({'success': False, 'message': 'Invalid bill or product'}), 400
        
        # Check if item already in bill
        existing_item = BillItem.query.filter_by(bill_id=bill_id, product_id=product_id).first()
        
        if existing_item:
            new_quantity = existing_item.quantity + quantity
            if product.current_stock < new_quantity:
                return jsonify({'success': False, 'message': f'Insufficient stock. Available: {product.current_stock}'}), 400
            existing_item.quantity = new_quantity
            existing_item.calculate_total()
        else:
            if product.current_stock < quantity:
                return jsonify({'success': False, 'message': f'Insufficient stock. Available: {product.current_stock}'}), 400
            item = BillItem(
                bill_id=bill_id,
                product_id=product_id,
                quantity=quantity,
                selling_price=product.selling_price,
                discount=0
            )
            item.calculate_total()
            db.session.add(item)
        
        bill.calculate_totals()
        db.session.commit()
        
        return jsonify({'success': True, 'total': bill.total_amount})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error adding item to bill: {str(e)}'}), 500

@app.route('/api/billing/complete', methods=['POST'])
@login_required
def complete_bill():
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        bill_id = data.get('bill_id')
        payment_method = data.get('payment_method', 'CASH')
        
        try:
            amount_paid = float(data.get('amount_paid', 0))
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Invalid amount paid'}), 400
        
        if amount_paid < 0:
            return jsonify({'success': False, 'message': 'Amount paid cannot be negative'}), 400
        
        bill = Bill.query.filter_by(id=bill_id, user_id=current_user.id).first()
        
        if not bill:
            return jsonify({'success': False, 'message': 'Invalid bill'}), 400
        
        if bill.status == 'COMPLETED':
            return jsonify({'success': False, 'message': 'Bill is already completed'}), 400
        
        if not bill.items:
            return jsonify({'success': False, 'message': 'Cannot complete bill with no items'}), 400
        
        # Update stock and create movements
        for item in bill.items:
            product = item.product
            if not product:
                return jsonify({'success': False, 'message': f'Product not found for item {item.id}'}), 400
                
            if product.current_stock < item.quantity:
                return jsonify({'success': False, 'message': f'Insufficient stock for {product.name}. Available: {product.current_stock}'}), 400
            
            product.current_stock -= item.quantity
            
            movement = StockMovement(
                product_id=product.id,
                user_id=current_user.id,
                movement_type='OUT',
                quantity=item.quantity,
                previous_stock=product.current_stock + item.quantity,
                new_stock=product.current_stock,
                price=item.selling_price,
                reference_type='SALE',
                reference_id=str(bill.id),
                reason='Product sale',
                notes=f'Sale - Bill #{bill.bill_number}'
            )
            db.session.add(movement)
        
        bill.status = 'COMPLETED'
        bill.payment_method = payment_method
        bill.amount_paid = amount_paid
        
        db.session.commit()
        
        # Update daily summary
        try:
            update_daily_summary(current_user.id)
        except Exception as summary_error:
            # Log the error but don't fail the bill completion
            print(f"Warning: Failed to update daily summary: {summary_error}")
        
        return jsonify({
            'success': True,
            'bill_number': bill.bill_number,
            'total': bill.total_amount,
            'change': amount_paid - bill.total_amount
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error completing bill: {str(e)}'}), 500

@app.route('/api/billing/hold', methods=['POST'])
@login_required
def hold_bill():
    data = request.json
    bill_id = data.get('bill_id')
    
    bill = Bill.query.filter_by(id=bill_id, user_id=current_user.id).first()
    
    if not bill:
        return jsonify({'success': False, 'message': 'Invalid bill'}), 400
    
    bill.status = 'HOLD'
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/api/billing/resume/<int:bill_id>')
@login_required
def resume_bill(bill_id):
    bill = Bill.query.filter_by(id=bill_id, user_id=current_user.id, status='HOLD').first()
    
    if not bill:
        return jsonify({'success': False, 'message': 'Invalid bill'}), 400
    
    bill.status = 'DRAFT'
    db.session.commit()
    
    items = []
    for item in bill.items:
        items.append({
            'product_id': item.product_id,
            'product_name': item.product.name,
            'quantity': item.quantity,
            'price': item.selling_price,
            'total': item.total_price
        })
    
    return jsonify({
        'success': True,
        'bill': {
            'id': bill.id,
            'bill_number': bill.bill_number,
            'customer_name': bill.customer_name,
            'customer_phone': bill.customer_phone,
            'items': items,
            'total': bill.total_amount
        }
    })

# Analytics Routes
@app.route('/analytics')
@login_required
def analytics():
    # Get date range
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    # Daily sales for chart
    daily_sales = db.session.query(
        func.date(Bill.created_at).label('date'),
        func.sum(Bill.total_amount).label('sales'),
        func.count(Bill.id).label('bills')
    ).filter(
        Bill.user_id == current_user.id,
        Bill.status == 'COMPLETED',
        Bill.created_at >= start_date
    ).group_by(func.date(Bill.created_at)).all()
    
    # Category-wise sales
    category_sales = db.session.query(
        Product.category,
        func.sum(BillItem.total_price).label('sales')
    ).join(BillItem).join(Bill).filter(
        Product.user_id == current_user.id,
        Bill.status == 'COMPLETED',
        Bill.created_at >= start_date
    ).group_by(Product.category).all()
    
    # Payment method breakdown
    payment_methods = db.session.query(
        Bill.payment_method,
        func.count(Bill.id).label('count'),
        func.sum(Bill.total_amount).label('amount')
    ).filter(
        Bill.user_id == current_user.id,
        Bill.status == 'COMPLETED',
        Bill.created_at >= start_date
    ).group_by(Bill.payment_method).all()
    
    # Top products
    top_products = db.session.query(
        Product,
        func.sum(BillItem.quantity).label('quantity_sold'),
        func.sum(BillItem.total_price).label('revenue')
    ).join(BillItem).join(Bill).filter(
        Product.user_id == current_user.id,
        Bill.status == 'COMPLETED',
        Bill.created_at >= start_date
    ).group_by(Product.id).order_by(desc('revenue')).limit(10).all()
    
    return render_template('analytics.html',
                         daily_sales=daily_sales,
                         category_sales=category_sales,
                         payment_methods=payment_methods,
                         top_products=top_products)

@app.route('/api/analytics/realtime')
@login_required
def realtime_analytics():
    today = date.today()
    
    # Get today's stats
    today_bills = Bill.query.filter(
        Bill.user_id == current_user.id,
        func.date(Bill.created_at) == today,
        Bill.status == 'COMPLETED'
    ).all()
    
    # Calculate hourly sales
    hourly_sales = db.session.query(
        func.strftime('%H', Bill.created_at).label('hour'),
        func.sum(Bill.total_amount).label('sales')
    ).filter(
        Bill.user_id == current_user.id,
        func.date(Bill.created_at) == today,
        Bill.status == 'COMPLETED'
    ).group_by(func.strftime('%H', Bill.created_at)).all()
    
    return jsonify({
        'today_sales': sum(bill.total_amount for bill in today_bills),
        'today_bills': len(today_bills),
        'today_items': sum(bill.total_items for bill in today_bills),
        'today_profit': sum(bill.total_profit for bill in today_bills),
        'hourly_sales': [{'hour': h, 'sales': s} for h, s in hourly_sales]
    })

# Helper Functions
def update_daily_summary(user_id):
    today = date.today()
    
    summary = DailySummary.query.filter_by(date=today, user_id=user_id).first()
    
    if not summary:
        summary = DailySummary(date=today, user_id=user_id)
        db.session.add(summary)
    
    # Calculate today's stats
    today_bills = Bill.query.filter(
        Bill.user_id == user_id,
        func.date(Bill.created_at) == today,
        Bill.status == 'COMPLETED'
    ).all()
    
    summary.total_sales = sum(bill.total_amount for bill in today_bills)
    summary.total_profit = sum(bill.total_profit for bill in today_bills)
    summary.total_bills = len(today_bills)
    summary.total_items_sold = sum(bill.total_items for bill in today_bills)
    
    # Top selling products
    top_products = db.session.query(
        Product.name,
        func.sum(BillItem.quantity).label('quantity')
    ).join(BillItem).join(Bill).filter(
        Product.user_id == user_id,
        func.date(Bill.created_at) == today,
        Bill.status == 'COMPLETED'
    ).group_by(Product.id).order_by(desc('quantity')).limit(5).all()
    
    summary.set_top_selling_products([{'name': p[0], 'quantity': p[1]} for p in top_products])
    
    # Payment summary
    payment_summary = db.session.query(
        Bill.payment_method,
        func.count(Bill.id).label('count'),
        func.sum(Bill.total_amount).label('amount')
    ).filter(
        Bill.user_id == user_id,
        func.date(Bill.created_at) == today,
        Bill.status == 'COMPLETED'
    ).group_by(Bill.payment_method).all()
    
    summary.set_payment_summary({p[0]: {'count': p[1], 'amount': p[2]} for p in payment_summary})
    
    db.session.commit()

# Stock Management Routes
@app.route('/stock')
@login_required
def stock_management():
    products = Product.query.filter_by(user_id=current_user.id).order_by(Product.name).all()
    
    # Calculate stock statistics
    total_products = len(products)
    low_stock_count = sum(1 for p in products if p.is_low_stock and p.current_stock > 0)
    out_of_stock_count = sum(1 for p in products if p.current_stock == 0)
    total_stock_value = sum(p.stock_value for p in products)
    
    # Get recent stock movements
    stock_movements = StockMovement.query.filter(
        StockMovement.product_id.in_([p.id for p in products])
    ).order_by(StockMovement.created_at.desc()).limit(10).all()
    
    return render_template('stock.html', 
                         products=products,
                         total_products=total_products,
                         low_stock_count=low_stock_count,
                         out_of_stock_count=out_of_stock_count,
                         total_stock_value=total_stock_value,
                         stock_movements=stock_movements)

# API Routes for missing endpoints
@app.route('/api/products/search')
@login_required
def search_products():
    query = request.args.get('q', '').strip()
    if len(query) < 2:
        return jsonify([])
    
    products = Product.query.filter(
        Product.user_id == current_user.id,
        db.or_(
            Product.name.ilike(f'%{query}%'),
            Product.barcode.ilike(f'%{query}%'),
            Product.category.ilike(f'%{query}%')
        )
    ).limit(20).all()
    
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'barcode': p.barcode,
        'category': p.category,
        'selling_price': p.selling_price,
        'current_stock': p.current_stock,
        'unit': p.unit
    } for p in products])


@app.route('/api/billing/items/<int:bill_id>')
@login_required
def get_bill_items(bill_id):
    bill = Bill.query.filter_by(id=bill_id, user_id=current_user.id).first()
    
    if not bill:
        return jsonify({'success': False, 'message': 'Bill not found'}), 404
    
    items = []
    for item in bill.items:
        items.append({
            'id': item.id,
            'product_id': item.product_id,
            'product_name': item.product.name,
            'quantity': item.quantity,
            'price': item.selling_price,
            'total': item.total_price
        })
    
    return jsonify(items)

@app.route('/api/stock/adjust', methods=['POST'])
@login_required
def adjust_stock():
    data = request.json
    product_id = data.get('product_id')
    movement_type = data.get('movement_type')  # 'IN', 'OUT', or 'SET'
    quantity = data.get('quantity')
    reason = data.get('reason', 'Manual Adjustment')
    notes = data.get('notes', '')
    
    product = Product.query.filter_by(id=product_id, user_id=current_user.id).first()
    
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    
    if quantity <= 0:
        return jsonify({'success': False, 'message': 'Invalid quantity'}), 400
    
    old_stock = product.current_stock
    
    # Calculate new stock based on movement type
    if movement_type == 'IN':
        new_stock = old_stock + quantity
    elif movement_type == 'OUT':
        new_stock = max(0, old_stock - quantity)
    elif movement_type == 'SET':
        new_stock = quantity
    else:
        return jsonify({'success': False, 'message': 'Invalid movement type'}), 400
    
    # Update product stock
    product.current_stock = new_stock
    
    # Create stock movement record
    movement = StockMovement(
        product_id=product.id,
        user_id=current_user.id,
        movement_type=movement_type,
        quantity=abs(quantity),
        previous_stock=old_stock,
        new_stock=new_stock,
        price=product.purchase_price if movement_type == 'IN' else product.selling_price,
        reference_type='ADJUSTMENT',
        reference_id=None,
        reason=reason or 'Stock adjustment',
        notes=reason or 'Stock adjustment'
    )
    
    db.session.add(movement)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Stock updated from {old_stock} to {new_stock}',
        'new_stock': new_stock
    })

# Replace the existing analytics_api function with this fixed version

# Add caching for analytics
analytics_cache = {}
ANALYTICS_CACHE_DURATION = timedelta(minutes=15)

@app.route('/api/analytics')
@login_required
def analytics_api():
    from_date = request.args.get('from')
    to_date = request.args.get('to')
    
    if from_date:
        from_date = datetime.strptime(from_date, '%Y-%m-%d').date()
    else:
        from_date = date.today() - timedelta(days=7)
    
    if to_date:
        to_date = datetime.strptime(to_date, '%Y-%m-%d').date()
    else:
        to_date = date.today()
    
    # Check cache first
    cache_key = f"analytics_{current_user.id}_{from_date}_{to_date}"
    if cache_key in analytics_cache:
        cached_data, cached_time = analytics_cache[cache_key]
        if datetime.now() - cached_time < ANALYTICS_CACHE_DURATION:
            return jsonify(cached_data)
    
    # Optimized single query for basic metrics
    basic_stats = db.session.query(
        func.count(Bill.id).label('total_bills'),
        func.sum(Bill.total_amount).label('total_sales')
    ).filter(
        Bill.user_id == current_user.id,
        Bill.status == 'COMPLETED',
        func.date(Bill.created_at) >= from_date,
        func.date(Bill.created_at) <= to_date
    ).first()
    
    total_bills = basic_stats.total_bills or 0
    total_sales = basic_stats.total_sales or 0
    avg_bill_value = total_sales / total_bills if total_bills > 0 else 0
    
    # Optimized profit calculation
    total_profit = db.session.query(
        func.sum((BillItem.selling_price - Product.purchase_price) * BillItem.quantity)
    ).join(Product).join(Bill).filter(
        Bill.user_id == current_user.id,
        Bill.status == 'COMPLETED',
        func.date(Bill.created_at) >= from_date,
        func.date(Bill.created_at) <= to_date
    ).scalar() or 0
    
    # Optimized previous period calculation
    days_diff = (to_date - from_date).days + 1
    prev_from = from_date - timedelta(days=days_diff)
    prev_to = from_date - timedelta(days=1)
    
    prev_stats = db.session.query(
        func.count(Bill.id).label('prev_bills_count'),
        func.sum(Bill.total_amount).label('prev_sales')
    ).filter(
        Bill.user_id == current_user.id,
        Bill.status == 'COMPLETED',
        func.date(Bill.created_at) >= prev_from,
        func.date(Bill.created_at) <= prev_to
    ).first()
    
    prev_bills_count = prev_stats.prev_bills_count or 0
    prev_sales = prev_stats.prev_sales or 0
    prev_avg_bill = prev_sales / prev_bills_count if prev_bills_count > 0 else 0
    
    # Simplified profit calculation for previous period
    prev_profit = db.session.query(
        func.sum((BillItem.selling_price - Product.purchase_price) * BillItem.quantity)
    ).join(Product).join(Bill).filter(
        Bill.user_id == current_user.id,
        Bill.status == 'COMPLETED',
        func.date(Bill.created_at) >= prev_from,
        func.date(Bill.created_at) <= prev_to
    ).scalar() or 0
    
    # Calculate growth percentages
    sales_growth = ((total_sales - prev_sales) / prev_sales * 100) if prev_sales > 0 else 0
    profit_growth = ((total_profit - prev_profit) / prev_profit * 100) if prev_profit > 0 else 0
    bills_growth = ((total_bills - prev_bills_count) / prev_bills_count * 100) if prev_bills_count > 0 else 0
    avg_bill_growth = ((avg_bill_value - prev_avg_bill) / prev_avg_bill * 100) if prev_avg_bill > 0 else 0
    
    # Prepare chart data
    # Sales trend data (daily) - FIXED VERSION
    daily_sales_query = db.session.query(
        func.date(Bill.created_at).label('date'),
        func.sum(Bill.total_amount).label('sales'),
        func.sum(func.coalesce((BillItem.selling_price - Product.purchase_price) * BillItem.quantity, 0)).label('profit')
    ).join(BillItem).join(Product).filter(
        Bill.user_id == current_user.id,
        Bill.status == 'COMPLETED',
        func.date(Bill.created_at) >= from_date,
        func.date(Bill.created_at) <= to_date
    ).group_by(func.date(Bill.created_at)).order_by('date').all()
    
    # Convert string dates to date objects for formatting
    daily_sales = []
    for row in daily_sales_query:
        # Parse the date string back to a date object
        if isinstance(row.date, str):
            try:
                parsed_date = datetime.strptime(row.date, '%Y-%m-%d').date()
            except ValueError:
                # Try alternative date formats
                try:
                    parsed_date = datetime.strptime(row.date, '%Y-%m-%d %H:%M:%S').date()
                except ValueError:
                    parsed_date = date.today()  # fallback
        else:
            parsed_date = row.date
        
        daily_sales.append({
            'date': parsed_date,
            'sales': row.sales,
            'profit': row.profit
        })
    
    # Payment methods data
    payment_methods = db.session.query(
        Bill.payment_method,
        func.count(Bill.id).label('count')
    ).filter(
        Bill.user_id == current_user.id,
        Bill.status == 'COMPLETED',
        func.date(Bill.created_at) >= from_date,
        func.date(Bill.created_at) <= to_date
    ).group_by(Bill.payment_method).all()
    
    # Top products by revenue
    top_products = db.session.query(
        Product.name,
        func.sum(BillItem.quantity).label('quantity'),
        func.sum(BillItem.quantity * BillItem.selling_price).label('revenue'),
        func.sum(BillItem.quantity * (BillItem.selling_price - Product.purchase_price)).label('profit')
    ).join(BillItem).join(Bill).filter(
        Bill.user_id == current_user.id,
        Bill.status == 'COMPLETED',
        func.date(Bill.created_at) >= from_date,
        func.date(Bill.created_at) <= to_date
    ).group_by(Product.id).order_by(desc('revenue')).limit(10).all()
    
    # Category performance
    category_sales = db.session.query(
        Product.category,
        func.sum(BillItem.quantity * BillItem.selling_price).label('revenue')
    ).join(BillItem).join(Bill).filter(
        Bill.user_id == current_user.id,
        Bill.status == 'COMPLETED',
        func.date(Bill.created_at) >= from_date,
        func.date(Bill.created_at) <= to_date
    ).group_by(Product.category).all()
    
    # Hourly sales pattern - create array for all 24 hours
    hourly_query = db.session.query(
        func.extract('hour', Bill.created_at).label('hour'),
        func.sum(Bill.total_amount).label('sales')
    ).filter(
        Bill.user_id == current_user.id,
        Bill.status == 'COMPLETED',
        func.date(Bill.created_at) >= from_date,
        func.date(Bill.created_at) <= to_date
    ).group_by(func.extract('hour', Bill.created_at)).all()
    
    # Create array with all 24 hours initialized to 0
    hourly_sales_array = [0] * 24
    for row in hourly_query:
        hour_index = int(row.hour) if row.hour is not None else 0
        if 0 <= hour_index < 24:
            hourly_sales_array[hour_index] = float(row.sales or 0)
    
    # Low stock products
    low_stock_products = Product.query.filter(
        Product.user_id == current_user.id,
        Product.current_stock <= Product.min_stock_level
    ).limit(10).all()
    
    # Recent transactions
    recent_transactions = Bill.query.filter(
        Bill.user_id == current_user.id,
        Bill.status == 'COMPLETED'
    ).order_by(Bill.created_at.desc()).limit(10).all()
    
    # Format chart data - FIXED VERSION
    charts_data = {
        'salesTrend': {
            'labels': [sale['date'].strftime('%d/%m') for sale in daily_sales],
            'sales': [float(sale['sales'] or 0) for sale in daily_sales],
            'profit': [float(sale['profit'] or 0) for sale in daily_sales]
        },
        'paymentMethods': {
            'labels': [pm.payment_method or 'Cash' for pm in payment_methods],
            'data': [pm.count for pm in payment_methods]
        },
        'topProducts': {
            'labels': [tp.name for tp in top_products],
            'data': [float(tp.revenue or 0) for tp in top_products]
        },
        'categories': {
            'labels': [cs.category or 'General' for cs in category_sales],
            'data': [float(cs.revenue or 0) for cs in category_sales]
        },
        'hourlySales': hourly_sales_array
    }
    
    # Format table data
    tables_data = {
        'topProducts': [{
            'name': tp.name,
            'quantity': int(tp.quantity or 0),
            'revenue': float(tp.revenue or 0),
            'profit': float(tp.profit or 0)
        } for tp in top_products],
        'lowStock': [{
            'name': product.name,
            'currentStock': product.current_stock,
            'minLevel': product.min_stock_level,
            'status': 'Out' if product.current_stock == 0 else 'Low'
        } for product in low_stock_products],
        'recentTransactions': [{
            'billNumber': transaction.bill_number,
            'customer': transaction.customer_name or 'Walk-in',
            'items': len(transaction.items),
            'amount': float(transaction.total_amount),
            'payment': transaction.payment_method or 'Cash',
            'date': transaction.created_at.isoformat()
        } for transaction in recent_transactions]
    }
    
    result = {
        'success': True,
        'metrics': {
            'totalSales': float(total_sales),
            'totalProfit': float(total_profit),
            'totalBills': total_bills,
            'avgBillValue': float(avg_bill_value),
            'salesGrowth': float(sales_growth),
            'profitGrowth': float(profit_growth),
            'billsGrowth': float(bills_growth),
            'avgBillGrowth': float(avg_bill_growth)
        },
        'charts': charts_data,
        'tables': tables_data
    }
    
    # Cache the result
    analytics_cache[cache_key] = (result, datetime.now())
    
    return jsonify(result)
    
@app.route('/api/stock/movements/<int:product_id>')
@login_required
def get_stock_movements(product_id):
    movements = StockMovement.query.filter_by(product_id=product_id).order_by(StockMovement.created_at.desc()).limit(20).all()
    
    data = []
    for m in movements:
        data.append({
            'type': m.movement_type,
            'quantity': m.quantity,
            'price': m.price,
            'reference': m.reference_type,
            'notes': m.notes,
            'date': m.created_at.strftime('%Y-%m-%d %H:%M')
        })
    
    return jsonify(data)

# Additional missing API endpoints

@app.route('/api/billing/update-item', methods=['POST'])
@login_required
def update_bill_item():
    data = request.json
    item_id = data.get('item_id')
    quantity = data.get('quantity')
    
    item = BillItem.query.join(Bill).filter(
        BillItem.id == item_id,
        Bill.user_id == current_user.id
    ).first()
    
    if not item:
        return jsonify({'success': False, 'message': 'Item not found'}), 404
    
    if quantity <= 0:
        db.session.delete(item)
    else:
        if item.product.current_stock < quantity:
            return jsonify({'success': False, 'message': f'Insufficient stock. Available: {item.product.current_stock}'}), 400
        
        item.quantity = quantity
        item.calculate_total()
    
    bill = item.bill
    bill.calculate_totals()
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Item updated'})

@app.route('/api/billing/remove-item', methods=['POST'])
@login_required
def remove_bill_item():
    data = request.json
    item_id = data.get('item_id')
    
    item = BillItem.query.join(Bill).filter(
        BillItem.id == item_id,
        Bill.user_id == current_user.id
    ).first()
    
    if not item:
        return jsonify({'success': False, 'message': 'Item not found'}), 404
    
    bill = item.bill
    db.session.delete(item)
    
    bill.calculate_totals()
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Item removed'})

@app.route('/api/billing/update-bill-meta', methods=['POST'])
@login_required
def update_bill_meta():
    data = request.json
    bill_id = data.get('bill_id')
    
    bill = Bill.query.filter_by(id=bill_id, user_id=current_user.id).first()
    
    if not bill:
        return jsonify({'success': False, 'message': 'Bill not found'}), 404
        
    bill.customer_name = data.get('customer_name', bill.customer_name)
    bill.customer_phone = data.get('customer_phone', bill.customer_phone)
    bill.discount_amount = float(data.get('discount', bill.discount_amount))
    bill.tax_amount = float(data.get('tax', bill.tax_amount))
    
    bill.calculate_totals()
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Bill updated'})

# Database optimization - add indexes for better performance
with app.app_context():
    db.create_all()
    
    # Database indexes are now created in the migrate_database function
    pass

@app.route('/ai_insights')
@login_required
def ai_insights():
    return render_template('ai_insights.html')

@app.route('/api/low-stock-check')
@login_required
def low_stock_check():
    """API endpoint for checking low stock items"""
    try:
        low_stock_threshold = 10
        low_stock_items = Product.query.filter(
            Product.user_id == current_user.id,
            Product.current_stock <= low_stock_threshold
        ).all()
        
        items_data = []
        for item in low_stock_items:
            items_data.append({
                'id': item.id,
                'name': item.name,
                'current_stock': item.current_stock,
                'threshold': low_stock_threshold
            })
        
        return jsonify({
            'lowStockItems': items_data,
            'count': len(items_data)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add caching for AI insights
from functools import lru_cache
from datetime import timedelta

# Simple in-memory cache for AI insights
ai_insights_cache = {}
CACHE_DURATION = timedelta(hours=1)

@app.route('/get_ai_insights')
@login_required
def get_ai_insights():
    # Simple error logging
    def log_error(message):
        try:
            with open('ai_insights_error.log', 'a') as f:
                f.write(f"{datetime.now()}: {message}\n")
        except:
            pass
    
    try:
        log_error("=== AI Insights Request Started ===")
        
        # Check cache first
        cache_key = f"ai_insights_{current_user.id}"
        if cache_key in ai_insights_cache:
            cached_data, cached_time = ai_insights_cache[cache_key]
            if datetime.now() - cached_time < CACHE_DURATION:
                log_error("Returning cached AI insights")
                return jsonify({'insights': cached_data})
        
        GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
        log_error(f"API Key present: {bool(GEMINI_API_KEY)}")
        
        if not GEMINI_API_KEY:
            log_error("GEMINI_API_KEY not found in environment variables")
            return jsonify({'error': 'API key not configured.'}), 500

        end_date = date.today()
        start_date = end_date - timedelta(days=90)
        log_error(f"Date range: {start_date} to {end_date}")
        
        log_error("Starting database queries...")
        # 1. Comprehensive Product Sales Analysis (Last 90 days)
        product_sales_query = db.session.query(
            Product.id,
            Product.name,
            Product.current_stock,
            Product.selling_price,
            Product.purchase_price,
            Product.category,
            func.sum(BillItem.quantity).label('total_quantity_sold'),
            func.sum(BillItem.total_price).label('total_revenue'),
            func.count(distinct(Bill.id)).label('transaction_count'),
            func.avg(BillItem.quantity).label('avg_quantity_per_sale')
        ).join(BillItem, Product.id == BillItem.product_id)\
         .join(Bill, BillItem.bill_id == Bill.id)\
         .filter(Bill.user_id == current_user.id)\
         .filter(Bill.created_at >= start_date)\
         .filter(Bill.created_at <= end_date)\
         .group_by(Product.id, Product.name, Product.current_stock, Product.selling_price, Product.purchase_price, Product.category)\
         .order_by(func.sum(BillItem.total_price).desc())\
         .all()

        # 2. All Products (including those with no sales)
        all_products = Product.query.filter(Product.user_id == current_user.id).all()
        
        # 3. Daily Sales Pattern Analysis
        daily_sales_pattern = db.session.query(
            func.date(Bill.created_at).label('sale_date'),
            func.sum(Bill.total_amount).label('daily_sales'),
            func.count(Bill.id).label('daily_transactions')
        ).filter(Bill.user_id == current_user.id)\
         .filter(Bill.created_at >= start_date)\
         .group_by(func.date(Bill.created_at))\
         .order_by(func.date(Bill.created_at))\
         .all()

        # 4. Weekly Sales Pattern
        weekly_sales_pattern = db.session.query(
            func.extract('dow', Bill.created_at).label('day_of_week'),
            func.sum(Bill.total_amount).label('weekly_sales'),
            func.count(Bill.id).label('weekly_transactions')
        ).filter(Bill.user_id == current_user.id)\
         .filter(Bill.created_at >= start_date)\
         .group_by(func.extract('dow', Bill.created_at))\
         .order_by(func.extract('dow', Bill.created_at))\
         .all()

        # 5. Product-wise Daily Sales Velocity
        product_daily_velocity = db.session.query(
            Product.name,
            func.date(Bill.created_at).label('sale_date'),
            func.sum(BillItem.quantity).label('daily_quantity'),
            func.sum(BillItem.total_price).label('daily_revenue')
        ).join(BillItem, Product.id == BillItem.product_id)\
         .join(Bill, BillItem.bill_id == Bill.id)\
         .filter(Bill.user_id == current_user.id)\
         .filter(Bill.created_at >= start_date)\
         .group_by(Product.name, func.date(Bill.created_at))\
         .order_by(Product.name, func.date(Bill.created_at))\
         .all()

        # 6. Stock Movement Analysis
        stock_movements = StockMovement.query.join(Product)\
            .filter(Product.user_id == current_user.id)\
            .filter(StockMovement.created_at >= start_date)\
            .order_by(StockMovement.created_at.desc())\
            .all()

        # 7. Inventory Turnover Analysis
        inventory_turnover = db.session.query(
            Product.name,
            Product.current_stock,
            Product.purchase_price,
            Product.selling_price,
            func.sum(BillItem.quantity).label('total_sold'),
            func.count(distinct(func.date(Bill.created_at))).label('selling_days')
        ).join(BillItem, Product.id == BillItem.product_id)\
         .join(Bill, BillItem.bill_id == Bill.id)\
         .filter(Bill.user_id == current_user.id)\
         .filter(Bill.created_at >= start_date)\
         .group_by(Product.id, Product.name, Product.current_stock, Product.purchase_price, Product.selling_price)\
         .all()

        # 8. Customer Purchase Patterns
        customer_patterns = db.session.query(
            func.count(Bill.id).label('total_bills'),
            func.avg(Bill.total_amount).label('avg_bill_value'),
            func.sum(Bill.total_amount).label('total_revenue'),
            func.extract('hour', Bill.created_at).label('hour')
        ).filter(Bill.user_id == current_user.id)\
         .filter(Bill.created_at >= start_date)\
         .group_by(func.extract('hour', Bill.created_at))\
         .order_by(func.extract('hour', Bill.created_at))\
         .all()

        # Format comprehensive data for AI analysis
        product_data_str = "\n".join([
            f"- {p.name}: Current Stock={p.current_stock}, Sold Last 90 Days={p.total_quantity_sold or 0}, "
            f"Revenue=₹{p.total_revenue or 0:.2f}, Selling Price=₹{p.selling_price}, Cost=₹{p.purchase_price}, "
            f"Category={p.category or 'Uncategorized'}, Transactions={p.transaction_count or 0}, "
            f"Avg Qty/Sale={p.avg_quantity_per_sale or 0:.2f}"
            for p in product_sales_query
        ])
        
        products_with_sales = product_sales_query
        log_error(f"Found {len(products_with_sales)} products with sales data")
        print(f"DEBUG: Found {len(products_with_sales)} products with sales data")
        print(f"DEBUG: Product data string length: {len(product_data_str)}")
        if product_data_str:
            print(f"DEBUG: First product data: {product_data_str.split(chr(10))[0] if product_data_str else 'None'}")

        # Add products with no sales
        all_products = Product.query.filter_by(user_id=current_user.id).all()
        no_sales_products = [p for p in all_products if p.id not in [ps.id for ps in products_with_sales]]
        no_sales_str = "\n".join([
            f"- {p.name}: Current Stock={p.current_stock}, NO SALES in 90 days, "
            f"Selling Price=₹{p.selling_price}, Cost=₹{p.purchase_price}, Category={p.category or 'Uncategorized'}"
            for p in no_sales_products
        ])
        
        print(f"DEBUG: Found {len(no_sales_products)} products with no sales")
        print(f"DEBUG: Total products in database: {len(all_products)}")
        
        # If no sales data exists, create basic recommendations from all products
        if not product_data_str and all_products:
            print("DEBUG: No sales data found, creating basic product recommendations")
            product_data_str = "\n".join([
                f"- {p.name}: Current Stock={p.current_stock}, NO SALES DATA, "
                f"Selling Price=₹{p.selling_price}, Cost=₹{p.purchase_price}, Category={p.category or 'Uncategorized'}"
                for p in all_products[:10]  # Limit to first 10 products
            ])
        elif not product_data_str:
            print("DEBUG: No products found at all, creating sample data for testing")
            product_data_str = "- Sample Product 1: Current Stock=10, NO SALES DATA, Selling Price=₹100, Cost=₹80, Category=Test"
        
        # Additional debugging
        if all_products:
            print(f"DEBUG: Sample product names: {[p.name for p in all_products[:3]]}")
        else:
            print("DEBUG: ⚠️  NO PRODUCTS FOUND IN DATABASE!")
            
        print(f"DEBUG: Final product_data_str length: {len(product_data_str)}")
        if product_data_str:
            print(f"DEBUG: Sample product data: {product_data_str[:200]}...")

        daily_pattern_str = "\n".join([
            f"- {d.sale_date}: Sales=₹{d.daily_sales:.2f}, Transactions={d.daily_transactions}"
            for d in daily_sales_pattern[-30:]  # Last 30 days
        ])

        weekly_pattern_str = "\n".join([
            f"- Day {int(w.day_of_week)} (0=Sunday): Avg Sales=₹{w.weekly_sales:.2f}, Transactions={w.weekly_transactions}"
            for w in weekly_sales_pattern
        ])

        # Calculate velocity analysis
        velocity_analysis = {}
        for v in product_daily_velocity:
            if v.name not in velocity_analysis:
                velocity_analysis[v.name] = []
            velocity_analysis[v.name].append({
                'date': v.sale_date,
                'quantity': v.daily_quantity,
                'revenue': v.daily_revenue
            })

        velocity_str = ""
        for product, data in velocity_analysis.items():
            if len(data) >= 7:  # Only include products with at least 7 days of sales
                avg_daily = sum(d['quantity'] for d in data) / len(data)
                velocity_str += f"- {product}: Avg Daily Sales={avg_daily:.2f} units, Sales Days={len(data)}\n"

        turnover_str = "\n".join([
            f"- {t.name}: Stock={t.current_stock}, Sold={t.total_sold}, Days Active={t.selling_days}, "
            f"Daily Velocity={t.total_sold/max(t.selling_days, 1):.2f} units/day, "
            f"Stock Duration={t.current_stock/(t.total_sold/max(t.selling_days, 1)):.1f} days at current rate"
            for t in inventory_turnover if t.total_sold > 0
        ])

        stock_movement_str = "\n".join([
            f"- {m.product.name}: {m.movement_type} {m.quantity} on {m.created_at.strftime('%Y-%m-%d')} ({m.reason})"
            for m in stock_movements[-50:]  # Last 50 movements
        ])

        customer_pattern_str = "\n".join([
            f"- Hour {int(c.hour)}:00: Bills={c.total_bills}, Avg Value=₹{c.avg_bill_value:.2f}, Revenue=₹{c.total_revenue:.2f}"
            for c in customer_patterns
        ])

        prompt = f"""
        You are a professional retail business analyst with predictive analytics expertise. Analyze the following comprehensive 90-day business data and provide structured insights in the EXACT format requested below.

        **COMPREHENSIVE BUSINESS DATA:**
        
        **Products with Sales (Last 90 Days):**
        {product_data_str}
        
        **Products with NO Sales (Last 90 Days):**
        {no_sales_str}
        
        **Daily Sales Pattern (Last 30 Days):**
        {daily_pattern_str}
        
        **Weekly Sales Pattern:**
        {weekly_pattern_str}
        
        **Product Sales Velocity:**
        {velocity_str}
        
        **Inventory Turnover Analysis:**
        {turnover_str}
        
        **Stock Movements (Recent 50):**
        {stock_movement_str}
        
        **Customer Purchase Patterns by Hour:**
        {customer_pattern_str}

        **REQUIRED OUTPUT FORMAT:**

        ## TOP PERFORMING PRODUCTS
        List the top 3-5 products with highest revenue/sales from actual data above. Format as:
        - Product Name: Revenue amount, Sales volume, Performance insight

        ## SLOW MOVING PRODUCTS  
        Identify 2-3 underperforming products from actual data above. Format as:
        - Product Name: Low sales reason, Stock status, Suggested action

        ## INVENTORY ANALYSIS
        Provide inventory insights based on actual stock levels and turnover data:
        - Stock level assessment with actual percentages from data
        - Restocking patterns observed from stock movements
        - Products at risk of stockout based on velocity analysis
        - Overstocked items requiring attention

        ## SALES TREND ANALYSIS
        Analyze sales patterns using actual daily/weekly data:
        - Overall sales growth/decline percentage from daily data
        - Peak sales days/periods from weekly pattern data
        - Customer traffic patterns from hourly data
        - Revenue trends from actual sales data
        - Daily sales data for chart: Day1:Amount,Day2:Amount,Day3:Amount (use last 7 days from daily pattern)

        ## PURCHASE RECOMMENDATIONS
        CRITICAL: Use ONLY the actual product names from the data above. DO NOT use generic names like "Product A", "Product B", etc.
        
        **INTELLIGENT AI FORECASTING REQUIRED:**
        Analyze the sales patterns, seasonal trends, customer behavior, and inventory turnover data above to make intelligent predictions for each product. Consider:
        - Sales velocity trends (increasing/decreasing patterns)
        - Seasonal variations from monthly data
        - Customer purchase patterns by hour/day
        - Stock movement history and turnover rates
        - Market demand indicators from transaction frequency
        
        **HIGH PRIORITY PRODUCTS (Urgent restocking needed):**
        For each high-priority product, provide AI-calculated recommendations:
        - [ACTUAL PRODUCT NAME]: Daily=X units, Weekly=Y units, Monthly=Z units, Current Stock=A units, Reason: [AI analysis of why this product needs urgent restocking based on sales patterns, trends, and stock levels]
        
        **MEDIUM PRIORITY PRODUCTS (Moderate restocking):**
        For each medium-priority product, provide AI-calculated recommendations:
        - [ACTUAL PRODUCT NAME]: Daily=X units, Weekly=Y units, Monthly=Z units, Current Stock=A units, Reason: [AI analysis of sales trends and optimal stocking levels]
        
        **LOW PRIORITY/AVOID:**
        List products to avoid or reduce ordering:
        - [ACTUAL PRODUCT NAME]: Current Stock=X units, Reason: [AI analysis of why to avoid - overstocked, declining sales, seasonal factors, etc.]
        
        **RESTOCK URGENTLY (Critical stock levels):**
        Products that need immediate attention:
        - [ACTUAL PRODUCT NAME]: URGENT - Current Stock=X units, AI Predicted Daily Need=Y units, Reason: [AI analysis of stock-out risk and sales velocity]
        
        **AI FORECASTING INSTRUCTIONS:**
        - Use machine learning-like analysis of the sales patterns to predict future demand
        - Consider weekly patterns (which days sell more)
        - Factor in seasonal trends from monthly data
        - Analyze customer behavior patterns from hourly data
        - Account for inventory turnover rates and stock movement history
        - Provide intelligent quantity recommendations, not simple mathematical formulas
        - Explain your reasoning based on the data patterns you observe

        ## PREDICTIVE INSIGHTS
        **AI-POWERED FORECASTING REQUIRED:**
        Analyze all the data patterns above and provide intelligent predictions:
        - Next 30-day sales forecast: Use AI analysis of daily trends, seasonal patterns, and customer behavior to predict percentage change
        - Product trend predictions: Analyze velocity data, seasonal variations, and market indicators to predict which products will trend up/down
        - Inventory turnover forecasts: Use AI to predict optimal turnover rates based on historical patterns and market conditions
        - Cash flow optimization: Analyze purchase/selling price ratios, sales velocity, and stock levels to recommend cash flow strategies
        - Market opportunity identification: Use pattern recognition to identify emerging trends, peak selling periods, and untapped potential
        
        **INTELLIGENT ANALYSIS REQUIRED:**
        - Don't just calculate averages - use AI reasoning to identify patterns, anomalies, and trends
        - Consider external factors that might affect demand (seasonality, market trends, customer behavior changes)
        - Provide confidence levels for your predictions based on data quality and pattern strength
        - Suggest proactive strategies based on predicted trends

        ## AI MARKET ANALYSIS
        **ADVANCED AI INSIGHTS:**
        Provide intelligent market analysis using AI reasoning:
        - **Customer Segmentation**: Analyze purchase patterns to identify customer types (frequent buyers, bulk purchasers, seasonal customers)
        - **Price Elasticity Analysis**: Use AI to determine optimal pricing strategies for each product based on sales response to price changes
        - **Demand Forecasting**: Predict demand spikes and valleys using pattern recognition from historical data
        - **Competitive Analysis**: Analyze product performance to identify market positioning opportunities
        - **Risk Assessment**: Use AI to identify products at risk of obsolescence or declining demand

        ## AI CHART DATA GENERATION
        **REQUIRED CHART DATA OUTPUT:**
        Generate specific data for interactive charts. Format exactly as shown:
        
        **SALES FORECAST CHART:**
        CHART_DATA_FORECAST: Day1:1200,Day2:1350,Day3:1180,Day4:1420,Day5:1380,Day6:1500,Day7:1650
        
        **PRODUCT PERFORMANCE CHART:**
        CHART_DATA_PRODUCTS: ProductName1:85,ProductName2:72,ProductName3:91,ProductName4:68,ProductName5:79
        
        **CUSTOMER BEHAVIOR CHART:**
        CHART_DATA_BEHAVIOR: Hour8:15,Hour9:25,Hour10:45,Hour11:65,Hour12:85,Hour13:95,Hour14:120,Hour15:110,Hour16:90,Hour17:70,Hour18:45,Hour19:25
        
        **INVENTORY TURNOVER CHART:**
        CHART_DATA_TURNOVER: ProductName1:2.5,ProductName2:1.8,ProductName3:3.2,ProductName4:1.2,ProductName5:2.9
        
        **PROFIT MARGIN ANALYSIS CHART:**
        CHART_DATA_MARGINS: ProductName1:25.5,ProductName2:18.2,ProductName3:32.1,ProductName4:15.8,ProductName5:28.7
        
        Use actual product names and AI-calculated values based on the business data provided above.

        ## ACTIONABLE RECOMMENDATIONS
        Provide exactly 4 numbered recommendations based on actual data analysis:
        1. **Inventory Optimization:** Specific action using actual stock levels and velocity
        2. **Marketing Focus:** Strategy based on actual customer patterns and peak hours  
        3. **Pricing Strategy:** Recommendations using actual profit margins and sales data
        4. **Operational Efficiency:** Process improvements based on actual transaction patterns

        CRITICAL AI INSTRUCTIONS:
        1. Use ONLY actual product names from the business data above - NEVER use "Product A", "Product B", "Item X", etc.
        2. You MUST provide AI-powered recommendations for actual products listed in the data above
        3. Use INTELLIGENT ANALYSIS of sales patterns, trends, and customer behavior - NOT simple mathematical formulas
        4. Apply machine learning-like reasoning to predict future demand based on:
           - Historical sales velocity and trends
           - Seasonal patterns from monthly/weekly data
           - Customer behavior patterns from hourly data
           - Inventory turnover analysis and stock movement patterns
           - Market demand indicators and transaction frequency
        5. ALWAYS show at least 3-5 actual product names in each priority category with AI-calculated quantities
        6. Include current stock levels and AI-based reasoning for each product
        7. Provide confidence levels for your predictions (High/Medium/Low confidence)
        8. Consider market dynamics, seasonal factors, and demand elasticity in your analysis
        
        EXAMPLE FORMAT (use actual product names from data):
        **HIGH PRIORITY PRODUCTS:**
        - Coca Cola 500ml: Daily=8 units, Weekly=32 units, Monthly=96 units, Current Stock=5 units, Confidence: High, Reason: AI analysis shows strong upward trend in sales velocity (15% increase over last 30 days), peak demand during afternoon hours (2-6 PM), and critical stock level requiring immediate restocking
        
        FORBIDDEN: Simple mathematical calculations, empty sections, generic names, or "no data available" responses. Use AI intelligence for all predictions.
        """

        # Call Gemini API
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "topP": 0.8,
                "maxOutputTokens": 4000,
                "stopSequences": []
            },
            "safetySettings": [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH", 
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        }
        
        try:
            log_error("Making API request to Gemini...")
            log_error(f"API URL: {api_url[:50]}...")
            log_error(f"Payload size: {len(json.dumps(payload))} characters")
            
            response = requests.post(api_url, headers={'Content-Type': 'application/json'}, data=json.dumps(payload))
            
            log_error(f"API Response status code: {response.status_code}")
            
            # Check for HTTP errors first
            if not response.ok:
                error_msg = f"API request failed with status code {response.status_code}."
                log_error(error_msg)
                print(error_msg)
                try:
                    error_details = response.json()
                    error_message = error_details.get('error', {}).get('message', 'Unknown API error.')
                    log_error(f"API Error Details: {error_message}")
                    print(f"API Error Details: {error_message}")
                    return jsonify({'error': f'API request failed: {error_message}'}), response.status_code
                except json.JSONDecodeError:
                    log_error("Failed to decode JSON from error response.")
                    print("Failed to decode JSON from error response.")
                    return jsonify({'error': f'API request failed with status code {response.status_code}.'}), response.status_code

            # If response is OK, try to parse the JSON
            api_response = response.json()
            log_error(f"API Response structure: {list(api_response.keys())}")
            
            # Check for rate limit or other API errors
            if 'error' in api_response:
                error_msg = api_response['error'].get('message', 'Unknown API error')
                log_error(f"API Error in response: {error_msg}")
                if 'rate limit' in error_msg.lower() or 'quota' in error_msg.lower():
                    return jsonify({'error': 'API rate limit reached. Please wait a few minutes and try again, or upgrade to a pro account for priority access.'}), 429
                else:
                    return jsonify({'error': f'API Error: {error_msg}'}), 500
            
            # Check if the expected keys exist in the response
            if 'candidates' in api_response and api_response['candidates'] and \
               'content' in api_response['candidates'][0] and \
               'parts' in api_response['candidates'][0]['content'] and \
               api_response['candidates'][0]['content']['parts']:
                insights = api_response['candidates'][0]['content']['parts'][0]['text']
                
                # Debug: Log the AI response
                print("DEBUG: AI Response received successfully")
                print(f"DEBUG: Response length: {len(insights)}")
                print("DEBUG: First 500 characters of AI response:")
                print(insights[:500])
                log_error(f"AI Response successful, length: {len(insights)}")
                
                # Cache the response
                ai_insights_cache[cache_key] = (insights, datetime.now())
                
                return jsonify({'insights': insights})
            else:
                # Log the unexpected response for debugging purposes
                log_error(f"Invalid API response format: {json.dumps(api_response, indent=2)}")
                print("Invalid API response format. Unexpected JSON structure.")
                print("Full API Response:", json.dumps(api_response, indent=2))
                return jsonify({'error': 'Invalid API response format. Check server logs for details.'}), 500

        except requests.exceptions.RequestException as e:
            # This catches network-related or other request-related errors
            error_msg = f"An error occurred during API request: {e}"
            log_error(f"RequestException: {e}")
            print(error_msg)
            return jsonify({'error': error_msg}), 500
        except Exception as e:
            # Catch any other unexpected errors during JSON parsing
            sio = io.StringIO()
            traceback.print_exc(file=sio)
            error_traceback = sio.getvalue()
            error_msg = f"An unexpected error occurred during API processing: {e}"
            log_error(f"Exception: {e}\n{error_traceback}")
            print(error_msg)
            return jsonify({'error': 'An unexpected error occurred during API processing. Check server logs.'}), 500
    except Exception as e:
        error_msg = f"An error occurred: {str(e)}"
        log_error(f"Main Exception: {e}")
        sio = io.StringIO()
        traceback.print_exc(file=sio)
        error_traceback = sio.getvalue()
        log_error(f"Full traceback: {error_traceback}")
        return jsonify({'error': error_msg}), 500

# Performance monitoring endpoint
@app.route('/api/performance')
@login_required
def performance_stats():
    """Get application performance statistics"""
    if not request_times:
        return jsonify({
            'avg_response_time': 0,
            'min_response_time': 0,
            'max_response_time': 0,
            'total_requests': 0
        })
    
    return jsonify({
        'avg_response_time': round(sum(request_times) / len(request_times) * 1000, 2),  # ms
        'min_response_time': round(min(request_times) * 1000, 2),  # ms
        'max_response_time': round(max(request_times) * 1000, 2),  # ms
        'total_requests': len(request_times),
        'cache_stats': {
            'ai_insights_cached': len(ai_insights_cache),
            'analytics_cached': len(analytics_cache)
        }
    })

# Cache cleanup function
def cleanup_caches():
    """Clean up expired cache entries"""
    current_time = datetime.now()
    
    # Clean AI insights cache
    expired_keys = []
    for key, (data, timestamp) in ai_insights_cache.items():
        if current_time - timestamp > CACHE_DURATION:
            expired_keys.append(key)
    for key in expired_keys:
        del ai_insights_cache[key]
    
    # Clean analytics cache
    expired_keys = []
    for key, (data, timestamp) in analytics_cache.items():
        if current_time - timestamp > ANALYTICS_CACHE_DURATION:
            expired_keys.append(key)
    for key in expired_keys:
        del analytics_cache[key]

# Run cache cleanup periodically
import threading
def periodic_cleanup():
    while True:
        time.sleep(300)  # 5 minutes
        cleanup_caches()

cleanup_thread = threading.Thread(target=periodic_cleanup, daemon=True)
cleanup_thread.start()

# AI Chatbot API endpoint
@app.route('/api/chatbot', methods=['POST'])
@login_required
def chatbot_api():
    """AI Chatbot endpoint for retail assistance"""
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400
        
        GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
        if not GEMINI_API_KEY:
            return jsonify({'error': 'AI service not configured'}), 500
        
        # Get business context data
        business_context = get_business_context_for_chatbot()
        
        # Create retail-focused prompt
        system_prompt = f"""You are an AI assistant specialized in retail business management. You have access to the user's business data and should provide helpful, accurate advice.

Business Context:
{business_context}

Guidelines:
- Be helpful, professional, and concise
- Focus on retail business advice and insights
- Use the provided business data to give accurate information
- Suggest actionable improvements when relevant
- If asked about specific data, refer to the actual numbers provided
- Keep responses under 200 words unless detailed analysis is requested
- Use emojis sparingly for better readability

User Question: {user_message}

Provide a helpful response based on the business context and your retail expertise."""

        # Make API call to Gemini using requests (more reliable)
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        payload = {
            "contents": [{"parts": [{"text": system_prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "topP": 0.8,
                "maxOutputTokens": 1000
            }
        }
        
        response = requests.post(api_url, headers={'Content-Type': 'application/json'}, json=payload)
        
        if response.status_code == 200:
            api_response = response.json()
            if 'candidates' in api_response and api_response['candidates']:
                ai_response = api_response['candidates'][0]['content']['parts'][0]['text']
            else:
                ai_response = "I'm sorry, I couldn't process your request at the moment."
        else:
            ai_response = "I'm experiencing technical difficulties. Please try again later."
        
        return jsonify({'response': ai_response})
        
    except Exception as e:
        print(f"Chatbot error: {str(e)}")
        return jsonify({'error': 'Failed to process your request'}), 500

def get_business_context_for_chatbot():
    """Get relevant business data for chatbot context"""
    try:
        # Get recent sales data
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        # Total sales and revenue
        total_sales = db.session.query(func.sum(Bill.total_amount)).filter(
            Bill.user_id == current_user.id,
            Bill.created_at >= start_date
        ).scalar() or 0
        
        # Total products and low stock items
        total_products = Product.query.filter_by(user_id=current_user.id).count()
        low_stock_items = Product.query.filter(
            Product.user_id == current_user.id,
            Product.current_stock <= 10
        ).count()
        
        # Top selling products
        top_products = db.session.query(
            Product.name,
            func.sum(BillItem.quantity).label('total_sold')
        ).join(BillItem, Product.id == BillItem.product_id)\
         .join(Bill, BillItem.bill_id == Bill.id)\
         .filter(Bill.user_id == current_user.id)\
         .filter(Bill.created_at >= start_date)\
         .group_by(Product.id, Product.name)\
         .order_by(func.sum(BillItem.quantity).desc())\
         .limit(5).all()
        
        # Recent bills count
        recent_bills = Bill.query.filter(
            Bill.user_id == current_user.id,
            Bill.created_at >= start_date
        ).count()
        
        context = f"""
Shop Name: {current_user.shop_name or 'Your Business'}
Time Period: Last 30 days

Sales Summary:
- Total Revenue: ₹{total_sales:,.2f}
- Total Transactions: {recent_bills}
- Average Transaction: ₹{(total_sales/recent_bills if recent_bills > 0 else 0):,.2f}

Inventory:
- Total Products: {total_products}
- Low Stock Items: {low_stock_items}

Top Selling Products (Last 30 days):
"""
        
        for i, (product_name, quantity) in enumerate(top_products, 1):
            context += f"{i}. {product_name}: {quantity} units sold\n"
        
        if not top_products:
            context += "No sales data available for the selected period.\n"
            
        return context
        
    except Exception as e:
        return f"Business data temporarily unavailable. Error: {str(e)}"

# Admin utility function to reset password
def reset_user_password(username, new_password):
    """Reset a user's password - for admin use only"""
    with app.app_context():
        user = User.query.filter_by(username=username).first()
        if user:
            user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
            db.session.commit()
            print(f"Password reset for user '{username}' to '{new_password}'")
            return True
        else:
            print(f"User '{username}' not found")
            return False

# Vercel handler function
def handler(request):
    """Handler function for Vercel deployment"""
    return app(request.environ, request.start_response)

# For Vercel deployment, we need to expose the app
application = app

if __name__ == '__main__':
    # Uncomment the line below to reset Subhash's password to 'newpassword123'
    #reset_user_password('Subhash', 'Newpassword@123')
    app.run(debug=True, host='0.0.0.0', port=5004)
