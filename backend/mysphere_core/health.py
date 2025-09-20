from django.http import JsonResponse
from django.db import connection
from django.conf import settings
import time

def health_check(request):
    """System health check endpoint"""
    start_time = time.time()
    
    health_status = {
        'status': 'healthy',
        'timestamp': time.time(),
        'services': {}
    }
    
    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['services']['database'] = {
            'status': 'healthy',
            'response_time': round((time.time() - start_time) * 1000, 2)
        }
    except Exception as e:
        health_status['services']['database'] = {
            'status': 'unhealthy',
            'error': str(e)
        }
        health_status['status'] = 'unhealthy'
    
    # Check each app
    apps_to_check = ['expenses', 'subscriptions', 'todos', 'lists', 'lending', 'users']
    
    for app in apps_to_check:
        try:
            # Simple import check
            __import__(f'{app}.models')
            health_status['services'][app] = {
                'status': 'healthy',
                'response_time': round((time.time() - start_time) * 1000, 2)
            }
        except Exception as e:
            health_status['services'][app] = {
                'status': 'unhealthy',
                'error': str(e)
            }
            health_status['status'] = 'degraded'
    
    # Overall response time
    health_status['response_time'] = round((time.time() - start_time) * 1000, 2)
    
    return JsonResponse(health_status)