# Vercel API endpoint for Flask app
import sys
import os

# Add the parent directory to the Python path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set environment variable to indicate we're running on Vercel
os.environ['VERCEL'] = '1'

# Create a simple test app first
from flask import Flask
test_app = Flask(__name__)

@test_app.route('/')
def health_check():
    return "Flask app is running on Vercel!", 200

@test_app.route('/test')
def test():
    return {"status": "ok", "message": "Test endpoint working"}, 200

try:
    from app import app
    # If import succeeds, use the main app
    application = app
except Exception as e:
    print(f"Error importing main app: {e}")
    # Use test app as fallback
    application = test_app
    
    @test_app.route('/error')
    def error():
        return f"Import Error: {str(e)}", 500

# For Vercel compatibility
app = application
