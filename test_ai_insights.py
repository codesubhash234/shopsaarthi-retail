#!/usr/bin/env python3
"""
Test script to verify AI insights functionality
"""
import os
import sys
import requests
import json
from datetime import datetime, date, timedelta

# Add the current directory to Python path
sys.path.insert(0, '/Users/subhashgupta/Downloads/sih-main 2 copy')

def test_ai_insights_generation():
    """Test the AI insights generation directly"""
    try:
        print("=== Testing AI Insights Generation ===")
        
        # Import Flask app components
        from app import app, db
        from models import Product, Bill, BillItem
        from dotenv import load_dotenv
        
        load_dotenv()
        
        with app.app_context():
            # Get product data like the actual endpoint does
            end_date = date.today()
            start_date = end_date - timedelta(days=90)
            
            print(f"Date range: {start_date} to {end_date}")
            
            # Query products with sales data
            products_with_sales = db.session.query(
                Product.id,
                Product.name,
                Product.current_stock,
                Product.selling_price,
                Product.purchase_price,
                Product.category,
                db.func.sum(BillItem.quantity).label('total_sold'),
                db.func.sum(BillItem.quantity * BillItem.selling_price).label('total_revenue'),
                db.func.count(BillItem.id).label('transaction_count')
            ).join(BillItem, Product.id == BillItem.product_id)\
             .join(Bill, BillItem.bill_id == Bill.id)\
             .filter(Bill.created_at >= start_date, Bill.created_at <= end_date)\
             .group_by(Product.id)\
             .order_by(db.func.sum(BillItem.quantity * BillItem.selling_price).desc())\
             .all()
            
            print(f"Found {len(products_with_sales)} products with sales data")
            
            if products_with_sales:
                # Build product data string
                product_data_lines = []
                for product in products_with_sales:
                    avg_qty_per_sale = product.total_sold / product.transaction_count if product.transaction_count > 0 else 0
                    line = f"- {product.name}: Current Stock={product.current_stock}, Sold Last 90 Days={product.total_sold}, Revenue=₹{product.total_revenue:.2f}, Selling Price=₹{product.selling_price}, Cost=₹{product.purchase_price}, Category={product.category or 'Uncategorized'}, Transactions={product.transaction_count}, Avg Qty/Sale={avg_qty_per_sale:.2f}"
                    product_data_lines.append(line)
                
                product_data_str = '\n'.join(product_data_lines)
                print(f"Product data length: {len(product_data_str)}")
                print("Sample product data:")
                print(product_data_str[:200] + "...")
                
                # Test API call
                GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
                api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
                
                prompt = f"""
Analyze this retail business data and provide comprehensive AI-powered insights in the following structured format:

## TOP PERFORMING PRODUCTS
[List top 3 products with sales figures and brief analysis]

## SLOW MOVING PRODUCTS  
[List products with low sales and recommendations]

## INVENTORY ANALYSIS
[Analyze stock levels and provide percentages for well-stocked, low-stock, out-of-stock]

## SALES TREND ANALYSIS
[Analyze sales patterns and trends]

## PURCHASE RECOMMENDATIONS
[Categorize into High Priority, Medium Priority, and Avoid Purchasing]

## PREDICTIVE INSIGHTS
[Provide forecasts and predictions]

## ACTIONABLE RECOMMENDATIONS
[Provide numbered actionable recommendations]

Product Data:
{product_data_str}

Please provide detailed, data-driven insights with specific numbers and actionable recommendations.
"""

                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.7,
                        "topP": 0.8,
                        "maxOutputTokens": 8192
                    }
                }
                
                print("Making API request...")
                response = requests.post(api_url, headers={'Content-Type': 'application/json'}, data=json.dumps(payload))
                
                print(f"API Response status: {response.status_code}")
                
                if response.ok:
                    api_response = response.json()
                    if 'candidates' in api_response and api_response['candidates']:
                        insights = api_response['candidates'][0]['content']['parts'][0]['text']
                        print(f"✓ AI insights generated successfully")
                        print(f"Response length: {len(insights)} characters")
                        print("\nFirst 500 characters of response:")
                        print(insights[:500])
                        print("\n" + "="*50)
                        
                        # Test section parsing
                        sections = insights.split('##')
                        print(f"Found {len(sections)} sections:")
                        for i, section in enumerate(sections):
                            if section.strip():
                                title = section.strip().split('\n')[0]
                                print(f"  {i}: {title}")
                        
                        return True
                    else:
                        print("✗ Invalid API response format")
                        return False
                else:
                    print(f"✗ API request failed: {response.status_code}")
                    print(response.text)
                    return False
            else:
                print("No products with sales data found")
                return False
                
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_ai_insights_generation()
    if success:
        print("\n✓ AI insights generation test passed")
    else:
        print("\n✗ AI insights generation test failed")
