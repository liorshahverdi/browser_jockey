from flask import Flask, request
import logging
import requests
from datetime import datetime, timedelta
from threading import Lock

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# IP geolocation cache with thread safety
ip_cache = {}
cache_lock = Lock()
CACHE_DURATION = timedelta(hours=24)  # Cache entries for 24 hours
MAX_CACHE_SIZE = 1000  # Prevent unlimited memory growth

def get_client_ip():
    """Get the real client IP, considering proxy headers"""
    if request.headers.get('X-Forwarded-For'):
        # X-Forwarded-For can contain multiple IPs, get the first one
        ip = request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        ip = request.headers.get('X-Real-IP')
    else:
        ip = request.remote_addr
    return ip

def clean_old_cache_entries():
    """Remove expired cache entries to prevent memory bloat"""
    now = datetime.now()
    with cache_lock:
        expired_keys = [
            ip for ip, (data, timestamp) in ip_cache.items()
            if now - timestamp > CACHE_DURATION
        ]
        for key in expired_keys:
            del ip_cache[key]
        
        # If cache is still too large, remove oldest entries
        if len(ip_cache) > MAX_CACHE_SIZE:
            sorted_items = sorted(ip_cache.items(), key=lambda x: x[1][1])
            items_to_remove = len(ip_cache) - MAX_CACHE_SIZE
            for ip, _ in sorted_items[:items_to_remove]:
                del ip_cache[ip]

def geocode_ip(ip_address):
    """Get location information for an IP address using ip-api.com (free service) with caching"""
    if ip_address in ['127.0.0.1', 'localhost', '::1']:
        return {'city': 'Local', 'country': 'Local', 'region': 'Local'}
    
    # Check cache first
    now = datetime.now()
    with cache_lock:
        if ip_address in ip_cache:
            cached_data, timestamp = ip_cache[ip_address]
            if now - timestamp < CACHE_DURATION:
                logger.debug(f"Using cached location for IP: {ip_address}")
                return cached_data
            else:
                # Expired entry, will be removed
                del ip_cache[ip_address]
    
    # Not in cache or expired, fetch from API
    try:
        response = requests.get(
            f'http://ip-api.com/json/{ip_address}',
            timeout=2  # Don't wait too long
        )
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                location_data = {
                    'city': data.get('city', 'Unknown'),
                    'region': data.get('regionName', 'Unknown'),
                    'country': data.get('country', 'Unknown'),
                    'lat': data.get('lat'),
                    'lon': data.get('lon'),
                    'isp': data.get('isp', 'Unknown')
                }
                
                # Store in cache
                with cache_lock:
                    ip_cache[ip_address] = (location_data, now)
                    # Periodically clean cache (every 100 new entries)
                    if len(ip_cache) % 100 == 0:
                        clean_old_cache_entries()
                
                logger.info(f"Geocoded new IP: {ip_address} -> {location_data['city']}, {location_data['country']}")
                return location_data
    except Exception as e:
        logger.warning(f"Failed to geocode IP {ip_address}: {e}")
    
    return {'city': 'Unknown', 'country': 'Unknown', 'region': 'Unknown'}

def create_app():
    app = Flask(__name__)
    app.config.from_object('config')

    @app.before_request
    def log_request_info():
        """Log information about each request including geolocation"""
        ip_address = get_client_ip()
        location = geocode_ip(ip_address)
        
        logger.info(
            f"Request from IP: {ip_address} | "
            f"City: {location.get('city')} | "
            f"Region: {location.get('region')} | "
            f"Country: {location.get('country')} | "
            f"Path: {request.path} | "
            f"Method: {request.method} | "
            f"User-Agent: {request.headers.get('User-Agent', 'Unknown')}"
        )

    with app.app_context():
        from . import routes
        app.register_blueprint(routes.main)

    return app