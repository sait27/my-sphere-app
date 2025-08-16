# expenses/middleware.py
"""
Custom middleware for security and rate limiting
"""

import time
import logging
from django.http import JsonResponse
from django.core.cache import cache
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

logger = logging.getLogger(__name__)

class RateLimitMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware for API endpoints
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        if not getattr(settings, 'RATELIMIT_ENABLE', True):
            return None
        
        # Skip rate limiting for admin and static files
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return None
        
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Different limits for different endpoints
        if request.path.startswith('/api/v1/expenses/') and request.method == 'POST':
            return self.check_rate_limit(client_ip, 'expense_create', 60, 3600)  # 60 per hour
        elif request.path.startswith('/api/v1/auth/login/'):
            return self.check_rate_limit(client_ip, 'login', 5, 300)  # 5 per 5 minutes
        elif request.path.startswith('/api/v1/'):
            return self.check_rate_limit(client_ip, 'api', 1000, 3600)  # 1000 per hour
        
        return None
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def check_rate_limit(self, client_ip, endpoint, limit, window):
        """Check if request exceeds rate limit"""
        cache_key = f"rate_limit:{endpoint}:{client_ip}"
        
        # Get current count
        current_count = cache.get(cache_key, 0)
        
        if current_count >= limit:
            logger.warning(f"Rate limit exceeded for {client_ip} on {endpoint}")
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'retry_after': window
            }, status=429)
        
        # Increment count
        cache.set(cache_key, current_count + 1, window)
        return None


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Add security headers to responses
    """
    
    def process_response(self, request, response):
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https://api.gemini.com; "
            "frame-ancestors 'none';"
        )
        response['Content-Security-Policy'] = csp
        
        return response


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Log API requests for monitoring and debugging
    """
    
    def process_request(self, request):
        # Log API requests
        if request.path.startswith('/api/'):
            logger.info(f"API Request: {request.method} {request.path} from {request.META.get('REMOTE_ADDR')}")
        
        # Store start time for response time calculation
        request._start_time = time.time()
    
    def process_response(self, request, response):
        # Calculate response time
        if hasattr(request, '_start_time'):
            response_time = time.time() - request._start_time
            
            # Log slow requests
            if response_time > 1.0:  # Log requests taking more than 1 second
                logger.warning(f"Slow request: {request.method} {request.path} took {response_time:.2f}s")
            
            # Add response time header for debugging
            response['X-Response-Time'] = f"{response_time:.3f}s"
        
        return response
