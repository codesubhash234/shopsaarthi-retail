#!/usr/bin/env python3
"""
Simple debug script to test AI insights functionality
"""
import os
import sys
import traceback
from datetime import datetime

# Add the current directory to Python path
sys.path.insert(0, '/Users/subhashgupta/Downloads/sih-main 2 copy')

def debug_ai_insights():
    """Debug the AI insights functionality"""
    try:
        print("=== AI Insights Debug Started ===")
        
        # Test environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
        print(f"API Key present: {bool(GEMINI_API_KEY)}")
        if GEMINI_API_KEY:
            print(f"API Key length: {len(GEMINI_API_KEY)}")
            print(f"API Key starts with: {GEMINI_API_KEY[:10]}...")
        
        if not GEMINI_API_KEY:
            print("ERROR: GEMINI_API_KEY not found in environment variables")
            return False
        
        # Test database connection
        from models import db, Product, Bill, BillItem
        from flask import Flask
        
        app = Flask(__name__)
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///retail_manager.db'
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        
        db.init_app(app)
        
        with app.app_context():
            # Test database query
            products = Product.query.all()
            print(f"Found {len(products)} products in database")
            
            # Test API call
            import requests
            import json
            
            api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            
            test_payload = {
                "contents": [{"parts": [{"text": "Hello, this is a test. Please respond with 'Test successful'."}]}],
                "generationConfig": {
                    "temperature": 0.3,
                    "topP": 0.8,
                    "maxOutputTokens": 100
                }
            }
            
            print("Testing API connection...")
            response = requests.post(api_url, headers={'Content-Type': 'application/json'}, data=json.dumps(test_payload))
            
            print(f"API Response status: {response.status_code}")
            
            if response.ok:
                api_response = response.json()
                if 'candidates' in api_response and api_response['candidates']:
                    test_result = api_response['candidates'][0]['content']['parts'][0]['text']
                    print(f"API Test Result: {test_result}")
                    print("✓ API connection successful")
                    return True
                else:
                    print("✗ API response format unexpected")
                    print(f"Response: {api_response}")
                    return False
            else:
                print(f"✗ API request failed: {response.status_code}")
                try:
                    error_details = response.json()
                    print(f"Error details: {error_details}")
                except:
                    print(f"Response text: {response.text}")
                return False
                
    except Exception as e:
        print(f"ERROR: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = debug_ai_insights()
    if success:
        print("\n✓ All tests passed - AI insights should work")
    else:
        print("\n✗ Tests failed - check the errors above")
