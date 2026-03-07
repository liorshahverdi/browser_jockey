from flask import Blueprint, render_template, send_from_directory
import os

main = Blueprint('main', __name__)

@main.route('/')
def home():
    return render_template('index.html')

@main.route('/tests/<path:filename>')
def serve_tests(filename):
    """Serve test HTML files from app/static/tests/ during development."""
    tests_dir = os.path.join(os.path.dirname(__file__), 'static', 'tests')
    return send_from_directory(tests_dir, filename)