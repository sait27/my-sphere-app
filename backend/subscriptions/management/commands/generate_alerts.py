from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from subscriptions.models import Subscription, SubscriptionAlert

class Command(BaseCommand):
    help = 'Generate subscription alerts for upcoming renewals and payments'

    def handle(self, *args, **options):
        today = timezone.now().date()
        
        # Get subscriptions with upcoming renewals (next 7 days)
        upcoming_renewals = Subscription.objects.filter(
            status='active',
            next_billing_date__lte=today + timedelta(days=7),
            next_billing_date__gte=today
        )
        
        alerts_created = 0
        
        for subscription in upcoming_renewals:
            days_until = (subscription.next_billing_date - today).days
            
            # Check if alert already exists
            existing_alert = SubscriptionAlert.objects.filter(
                subscription=subscription,
                alert_type='renewal_reminder',
                alert_date__date=today
            ).exists()
            
            if not existing_alert:
                if days_until <= 1:
                    title = f"{subscription.name} renews tomorrow"
                    message = f"Your {subscription.name} subscription (₹{subscription.amount}) will renew on {subscription.next_billing_date.strftime('%B %d, %Y')}."
                else:
                    title = f"{subscription.name} renews in {days_until} days"
                    message = f"Your {subscription.name} subscription (₹{subscription.amount}) will renew on {subscription.next_billing_date.strftime('%B %d, %Y')}."
                
                SubscriptionAlert.objects.create(
                    subscription=subscription,
                    alert_type='renewal_reminder',
                    title=title,
                    message=message,
                    alert_date=timezone.now()
                )
                alerts_created += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {alerts_created} renewal alerts')
        )