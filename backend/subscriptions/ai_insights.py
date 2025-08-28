import json
from datetime import datetime, timedelta
from decimal import Decimal
from django.db.models import Sum, Avg, Count, Q
from django.utils import timezone
from .models import Subscription, SubscriptionPayment, SubscriptionUsage
import google.generativeai as genai
import os

GOOGLE_API_KEY = os.environ.get('GEMINI_API_KEY', '')
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

class SubscriptionAIEngine:
    """AI-powered insights for subscription management"""
    
    def __init__(self, user):
        self.user = user
        self.today = timezone.now().date()
    
    def generate_insights(self):
        """Generate AI insights for subscription management"""
        subscription_data = self._gather_subscription_data()
        prompt = self._generate_ai_prompt(subscription_data)
        
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            
            cleaned_response = response.text.strip().replace('`', '').replace('json', '')
            ai_insights = json.loads(cleaned_response)
            
            return {
                'insights': ai_insights.get('insights', []),
                'summary': ai_insights.get('summary', 'AI-powered subscription analysis.'),
                'recommendations': ai_insights.get('recommendations', []),
                'cost_optimization': ai_insights.get('cost_optimization', {}),
                'generated_at': timezone.now().isoformat(),
            }
        
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
            return self._fallback_insights()
    
    def _gather_subscription_data(self):
        """Collect comprehensive subscription data"""
        subscriptions = Subscription.objects.filter(user=self.user)
        
        return {
            'total_subscriptions': subscriptions.count(),
            'active_subscriptions': subscriptions.filter(status='active').count(),
            'monthly_cost': float(sum(sub.monthly_cost for sub in subscriptions.filter(status='active'))),
            'yearly_cost': float(sum(sub.yearly_cost for sub in subscriptions.filter(status='active'))),
            'categories': self._get_category_breakdown(),
            'upcoming_renewals': self._get_upcoming_renewals(),
            'cost_trends': self._get_cost_trends(),
            'usage_patterns': self._get_usage_patterns(),
            'payment_history': self._get_payment_history(),
            'underutilized': self._get_underutilized_subscriptions(),
        }
    
    def _generate_ai_prompt(self, data):
        """Generate detailed prompt for AI analysis"""
        data_str = json.dumps(data, indent=2, default=str)
        
        return f"""
        As a subscription management expert, analyze this user's subscription data and provide actionable insights.
        Focus on cost optimization, usage efficiency, and smart recommendations.
        
        User's subscription data:
        {data_str}
        
        Provide response in this JSON format:
        {{
          "summary": "Brief overview of subscription health",
          "insights": [
            {{
              "type": "cost_optimization|usage|renewal|category",
              "severity": "low|medium|high",
              "title": "Insight title",
              "description": "Detailed description",
              "action": "Recommended action",
              "potential_savings": 0
            }}
          ],
          "recommendations": [
            {{
              "title": "Recommendation title",
              "description": "What to do",
              "impact": "Expected benefit",
              "priority": "low|medium|high"
            }}
          ],
          "cost_optimization": {{
            "potential_monthly_savings": 0,
            "underutilized_services": [],
            "duplicate_services": [],
            "upgrade_opportunities": []
          }}
        }}
        """
    
    def _fallback_insights(self):
        """Fallback insights when AI is unavailable"""
        subscriptions = Subscription.objects.filter(user=self.user, status='active')
        total_monthly = sum(sub.monthly_cost for sub in subscriptions)
        
        insights = []
        
        # High cost alert
        if total_monthly > 200:
            insights.append({
                'type': 'cost_optimization',
                'severity': 'high',
                'title': 'High Monthly Subscription Cost',
                'description': f'Your monthly subscriptions total ${total_monthly:.2f}',
                'action': 'Review and cancel unused subscriptions',
                'potential_savings': 0
            })
        
        # Upcoming renewals
        upcoming = self._get_upcoming_renewals()
        if len(upcoming) > 3:
            insights.append({
                'type': 'renewal',
                'severity': 'medium',
                'title': f'{len(upcoming)} Renewals This Month',
                'description': 'Multiple subscriptions renewing soon',
                'action': 'Review renewal dates and consider timing',
                'potential_savings': 0
            })
        
        return {
            'insights': insights,
            'summary': f'Managing {subscriptions.count()} active subscriptions costing ${total_monthly:.2f}/month',
            'recommendations': [],
            'cost_optimization': {},
            'generated_at': timezone.now().isoformat(),
        }
    
    def _get_category_breakdown(self):
        """Get spending by category"""
        subscriptions = Subscription.objects.filter(user=self.user, status='active')
        categories = {}
        
        for sub in subscriptions:
            cat_name = sub.category.name if sub.category else 'Uncategorized'
            if cat_name not in categories:
                categories[cat_name] = {'count': 0, 'monthly_cost': 0}
            categories[cat_name]['count'] += 1
            categories[cat_name]['monthly_cost'] += float(sub.monthly_cost)
        
        return categories
    
    def _get_upcoming_renewals(self):
        """Get subscriptions renewing in next 30 days"""
        next_month = self.today + timedelta(days=30)
        return list(Subscription.objects.filter(
            user=self.user,
            status='active',
            next_billing_date__lte=next_month
        ).values('name', 'amount', 'next_billing_date', 'billing_cycle'))
    
    def _get_cost_trends(self):
        """Analyze cost trends over time"""
        # This would analyze historical payment data
        payments = SubscriptionPayment.objects.filter(
            subscription__user=self.user,
            payment_date__gte=self.today - timedelta(days=90)
        )
        
        monthly_costs = {}
        for payment in payments:
            month_key = payment.payment_date.strftime('%Y-%m')
            if month_key not in monthly_costs:
                monthly_costs[month_key] = 0
            monthly_costs[month_key] += float(payment.amount)
        
        return monthly_costs
    
    def _get_usage_patterns(self):
        """Analyze usage patterns"""
        usage_data = SubscriptionUsage.objects.filter(
            subscription__user=self.user,
            usage_date__gte=self.today - timedelta(days=30)
        )
        
        patterns = {}
        for usage in usage_data:
            sub_name = usage.subscription.name
            if sub_name not in patterns:
                patterns[sub_name] = {'total_usage': 0, 'days_used': 0}
            patterns[sub_name]['total_usage'] += usage.usage_count
            patterns[sub_name]['days_used'] += 1
        
        return patterns
    
    def _get_payment_history(self):
        """Get recent payment history"""
        return list(SubscriptionPayment.objects.filter(
            subscription__user=self.user,
            payment_date__gte=self.today - timedelta(days=90)
        ).values('amount', 'payment_date', 'status'))
    
    def _get_underutilized_subscriptions(self):
        """Identify potentially underutilized subscriptions"""
        underutilized = []
        
        for sub in Subscription.objects.filter(user=self.user, status='active'):
            recent_usage = SubscriptionUsage.objects.filter(
                subscription=sub,
                usage_date__gte=self.today - timedelta(days=30)
            ).count()
            
            if recent_usage < 5:  # Less than 5 usage days in last month
                underutilized.append({
                    'name': sub.name,
                    'monthly_cost': float(sub.monthly_cost),
                    'usage_days': recent_usage
                })
        
        return underutilized

class SubscriptionOptimizer:
    """Optimize subscription costs and usage"""
    
    def __init__(self, user):
        self.user = user
    
    def find_duplicates(self):
        """Find potentially duplicate services"""
        subscriptions = Subscription.objects.filter(user=self.user, status='active')
        categories = {}
        
        for sub in subscriptions:
            cat_name = sub.category.name if sub.category else 'Uncategorized'
            if cat_name not in categories:
                categories[cat_name] = []
            categories[cat_name].append(sub)
        
        duplicates = []
        for cat, subs in categories.items():
            if len(subs) > 1:
                duplicates.append({
                    'category': cat,
                    'subscriptions': [{'name': s.name, 'cost': float(s.monthly_cost)} for s in subs],
                    'potential_savings': float(sum(s.monthly_cost for s in subs[1:]))
                })
        
        return duplicates
    
    def suggest_downgrades(self):
        """Suggest potential downgrades based on usage"""
        suggestions = []
        
        for sub in Subscription.objects.filter(user=self.user, status='active'):
            usage_count = SubscriptionUsage.objects.filter(
                subscription=sub,
                usage_date__gte=timezone.now().date() - timedelta(days=30)
            ).count()
            
            if usage_count < 10 and sub.monthly_cost > 20:
                suggestions.append({
                    'subscription': sub.name,
                    'current_cost': float(sub.monthly_cost),
                    'usage_days': usage_count,
                    'suggestion': 'Consider downgrading to a lower tier'
                })
        
        return suggestions