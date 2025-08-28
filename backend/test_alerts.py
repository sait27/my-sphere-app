import os
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysphere_core.settings')
django.setup()

from django.contrib.auth.models import User
from subscriptions.models import Subscription, SubscriptionAlert
from django.utils import timezone

def create_test_alerts():
    # Get or create a test user
    user, created = User.objects.get_or_create(
        username='teja',
        defaults={'email': 'teja+test@gmail.com'}
    )
    
    # Create test subscription with near renewal
    subscription, created = Subscription.objects.get_or_create(
        name='Test Netflix',
        user=user,
        defaults={
            'provider': 'Netflix',
            'amount': 15.99,
            'billing_cycle': 'monthly',
            'start_date': timezone.now().date(),
            'next_billing_date': timezone.now().date() + timedelta(days=2),
            'payment_method': 'card'
        }
    )
    
    # Create test alerts
    alerts = [
        {
            'alert_type': 'renewal_reminder',
            'title': 'Netflix renews in 2 days',
            'message': 'Your Netflix subscription (₹15.99) will renew on January 15, 2024.'
        },
        {
            'alert_type': 'payment_due',
            'title': 'Payment due for Spotify',
            'message': 'Your Spotify payment of ₹9.99 is due tomorrow.'
        },
        {
            'alert_type': 'price_increase',
            'title': 'YouTube Premium price increase',
            'message': 'YouTube Premium will increase from ₹129 to ₹149 next month.'
        }
    ]
    
    for alert_data in alerts:
        SubscriptionAlert.objects.create(
            subscription=subscription,
            alert_date=timezone.now(),
            **alert_data
        )
    
    print(f"Created {len(alerts)} test alerts for user: {user.username}")
    print("You can now test the alert system in the frontend!")

if __name__ == '__main__':
    create_test_alerts()