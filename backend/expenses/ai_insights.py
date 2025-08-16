import json
from datetime import datetime, timedelta
from decimal import Decimal
from django.db.models import Sum, Avg, Count, Q
from django.utils import timezone
from .models import Expense
from budgets.models import Budget
from lists.models import List, ListItem


class AIInsightsEngine:
    """AI-powered insights engine for financial data analysis"""
    
    def __init__(self, user):
        self.user = user
        self.today = timezone.now().date()
        self.current_month = self.today.replace(day=1)
        self.last_month = (self.current_month - timedelta(days=1)).replace(day=1)
        
    def generate_insights(self):
        """Generate comprehensive AI insights for the user"""
        insights = []
        
        # Get spending insights
        insights.extend(self._get_spending_insights())
        
        # Get budget insights
        insights.extend(self._get_budget_insights())
        
        # Get trend insights
        insights.extend(self._get_trend_insights())
        
        # Get predictive insights
        insights.extend(self._get_predictive_insights())
        
        # Get behavioral insights
        insights.extend(self._get_behavioral_insights())
        
        # Generate summary
        summary = self._generate_summary(insights)
        
        return {
            'insights': insights[:8],  # Limit to top 8 insights
            'summary': summary,
            'generated_at': timezone.now().isoformat(),
            'total_insights': len(insights)
        }
    
    def _get_spending_insights(self):
        """Analyze spending patterns"""
        insights = []
        
        # Current month spending
        current_spending = self._get_monthly_spending(self.current_month)
        last_spending = self._get_monthly_spending(self.last_month)
        
        if current_spending and last_spending:
            change_pct = ((current_spending - last_spending) / last_spending) * 100
            
            if abs(change_pct) > 15:
                sentiment = 'negative' if change_pct > 0 else 'positive'
                insights.append({
                    'type': 'spending',
                    'sentiment': sentiment,
                    'title': f'Spending {"Increased" if change_pct > 0 else "Decreased"} by {abs(change_pct):.1f}%',
                    'description': f'Your spending this month is ${current_spending:.0f} compared to ${last_spending:.0f} last month.',
                    'impact': -abs(current_spending - last_spending) if change_pct > 0 else abs(current_spending - last_spending),
                    'action': 'Review your recent expenses to identify the main drivers of this change.'
                })
        
        # Top spending categories
        top_categories = self._get_top_spending_categories()
        if top_categories:
            top_cat = top_categories[0]
            insights.append({
                'type': 'spending',
                'sentiment': 'neutral',
                'title': f'Top Spending: {top_cat["category"]}',
                'description': f'You\'ve spent ${top_cat["total"]:.0f} on {top_cat["category"]} this month ({top_cat["count"]} transactions).',
                'action': f'Consider setting a budget limit for {top_cat["category"]} expenses.'
            })
        
        return insights
    
    def _get_budget_insights(self):
        """Analyze budget performance"""
        insights = []
        
        try:
            budget = Budget.objects.get(
                user=self.user,
                year=self.today.year,
                month=self.today.month
            )
            
            current_spending = self._get_monthly_spending(self.current_month)
            if current_spending:
                budget_used_pct = (current_spending / float(budget.amount)) * 100
                remaining = float(budget.amount) - current_spending
                
                if budget_used_pct > 90:
                    insights.append({
                        'type': 'budget',
                        'sentiment': 'warning',
                        'title': 'Budget Alert: 90% Used',
                        'description': f'You\'ve used {budget_used_pct:.1f}% of your ${budget.amount} monthly budget.',
                        'impact': -remaining,
                        'action': 'Consider reducing discretionary spending for the rest of the month.'
                    })
                elif budget_used_pct > 75:
                    insights.append({
                        'type': 'budget',
                        'sentiment': 'warning',
                        'title': f'Budget Watch: {budget_used_pct:.1f}% Used',
                        'description': f'You have ${remaining:.0f} remaining in your monthly budget.',
                        'action': 'Monitor your spending closely to stay within budget.'
                    })
                elif budget_used_pct < 50:
                    days_left = (self.current_month.replace(month=self.current_month.month+1) - timedelta(days=1) - self.today).days
                    if days_left > 10:
                        insights.append({
                            'type': 'budget',
                            'sentiment': 'positive',
                            'title': 'Budget on Track',
                            'description': f'You\'re doing great! Only {budget_used_pct:.1f}% of budget used with {days_left} days remaining.',
                            'impact': remaining,
                            'action': 'Consider allocating some remaining budget to savings or investments.'
                        })
                        
        except Budget.DoesNotExist:
            current_spending = self._get_monthly_spending(self.current_month)
            if current_spending > 0:
                insights.append({
                    'type': 'budget',
                    'sentiment': 'neutral',
                    'title': 'No Budget Set',
                    'description': f'You\'ve spent ${current_spending:.0f} this month without a set budget.',
                    'action': 'Consider setting a monthly budget to better track your spending.'
                })
        
        return insights
    
    def _get_trend_insights(self):
        """Analyze spending trends"""
        insights = []
        
        # Weekly spending trend
        weekly_data = self._get_weekly_spending_trend()
        if len(weekly_data) >= 2:
            recent_avg = sum(weekly_data[-2:]) / 2
            earlier_avg = sum(weekly_data[:-2]) / len(weekly_data[:-2]) if len(weekly_data) > 2 else weekly_data[0]
            
            if recent_avg > earlier_avg * 1.2:
                insights.append({
                    'type': 'trend',
                    'sentiment': 'warning',
                    'title': 'Spending Trend Increasing',
                    'description': f'Your weekly spending has increased to ${recent_avg:.0f} on average.',
                    'action': 'Review recent purchases and consider if this trend is sustainable.'
                })
            elif recent_avg < earlier_avg * 0.8:
                insights.append({
                    'type': 'trend',
                    'sentiment': 'positive',
                    'title': 'Spending Trend Decreasing',
                    'description': f'Great job! Your weekly spending has decreased to ${recent_avg:.0f} on average.',
                    'impact': (earlier_avg - recent_avg) * 4,  # Monthly impact
                    'action': 'Keep up the good work with mindful spending.'
                })
        
        return insights
    
    def _get_predictive_insights(self):
        """Generate predictive insights"""
        insights = []
        
        # Predict end-of-month spending
        days_passed = self.today.day
        days_in_month = (self.current_month.replace(month=self.current_month.month+1) - timedelta(days=1)).day
        current_spending = self._get_monthly_spending(self.current_month)
        
        if current_spending and days_passed > 5:
            daily_avg = current_spending / days_passed
            predicted_total = daily_avg * days_in_month
            
            try:
                budget = Budget.objects.get(
                    user=self.user,
                    year=self.today.year,
                    month=self.today.month
                )
                
                if predicted_total > float(budget.amount):
                    overage = predicted_total - float(budget.amount)
                    insights.append({
                        'type': 'prediction',
                        'sentiment': 'warning',
                        'title': f'Budget Overage Predicted',
                        'description': f'At current spending rate, you may exceed budget by ${overage:.0f}.',
                        'impact': -overage,
                        'action': f'Reduce daily spending to ${(float(budget.amount) - current_spending) / (days_in_month - days_passed):.0f} to stay on budget.'
                    })
                    
            except Budget.DoesNotExist:
                pass
        
        return insights
    
    def _get_behavioral_insights(self):
        """Analyze spending behavior patterns"""
        insights = []
        
        # Weekend vs weekday spending
        weekend_avg = self._get_weekend_spending_avg()
        weekday_avg = self._get_weekday_spending_avg()
        
        if weekend_avg and weekday_avg and weekend_avg > weekday_avg * 1.5:
            insights.append({
                'type': 'suggestion',
                'sentiment': 'neutral',
                'title': 'Weekend Spending Pattern',
                'description': f'You spend ${weekend_avg:.0f} on average during weekends vs ${weekday_avg:.0f} on weekdays.',
                'action': 'Consider planning weekend activities with a set budget to control spending.'
            })
        
        # Frequent small purchases
        small_purchases = Expense.objects.filter(
            user=self.user,
            transaction_date__gte=self.current_month,
            amount__lt=10
        ).count()
        
        if small_purchases > 20:
            total_small = Expense.objects.filter(
                user=self.user,
                transaction_date__gte=self.current_month,
                amount__lt=10
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            insights.append({
                'type': 'suggestion',
                'sentiment': 'neutral',
                'title': 'Many Small Purchases',
                'description': f'You\'ve made {small_purchases} purchases under $10, totaling ${total_small:.0f}.',
                'action': 'Consider consolidating small purchases or setting a daily spending limit.'
            })
        
        return insights
    
    def _generate_summary(self, insights):
        """Generate a summary of all insights"""
        if not insights:
            return "Keep using the app to generate personalized insights based on your spending patterns."
        
        positive_count = len([i for i in insights if i.get('sentiment') == 'positive'])
        warning_count = len([i for i in insights if i.get('sentiment') == 'warning'])
        
        if warning_count > positive_count:
            return f"Found {len(insights)} insights with {warning_count} areas for improvement. Focus on budget management and spending control."
        elif positive_count > warning_count:
            return f"Great financial habits! Found {positive_count} positive trends. Keep up the good work and consider optimizing further."
        else:
            return f"Analyzed {len(insights)} insights about your spending. Mix of good habits and areas for improvement."
    
    # Helper methods
    def _get_monthly_spending(self, month_start):
        """Get total spending for a specific month"""
        month_end = (month_start.replace(month=month_start.month+1) - timedelta(days=1)) if month_start.month < 12 else month_start.replace(year=month_start.year+1, month=1) - timedelta(days=1)
        
        total = Expense.objects.filter(
            user=self.user,
            transaction_date__gte=month_start,
            transaction_date__lte=month_end
        ).aggregate(total=Sum('amount'))['total']
        
        return float(total) if total else 0
    
    def _get_top_spending_categories(self):
        """Get top spending categories for current month"""
        return list(Expense.objects.filter(
            user=self.user,
            transaction_date__gte=self.current_month
        ).values('category').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')[:5])
    
    def _get_weekly_spending_trend(self):
        """Get weekly spending for the last 4 weeks"""
        weeks = []
        for i in range(4):
            week_start = self.today - timedelta(weeks=i+1)
            week_end = week_start + timedelta(days=6)
            
            total = Expense.objects.filter(
                user=self.user,
                transaction_date__gte=week_start,
                transaction_date__lte=week_end
            ).aggregate(total=Sum('amount'))['total']
            
            weeks.append(float(total) if total else 0)
        
        return list(reversed(weeks))
    
    def _get_weekend_spending_avg(self):
        """Get average weekend spending"""
        weekend_expenses = Expense.objects.filter(
            user=self.user,
            transaction_date__gte=self.current_month,
            transaction_date__week_day__in=[1, 7]  # Sunday=1, Saturday=7
        )
        
        if weekend_expenses.exists():
            return float(weekend_expenses.aggregate(avg=Avg('amount'))['avg'] or 0)
        return 0
    
    def _get_weekday_spending_avg(self):
        """Get average weekday spending"""
        weekday_expenses = Expense.objects.filter(
            user=self.user,
            transaction_date__gte=self.current_month,
            transaction_date__week_day__in=[2, 3, 4, 5, 6]  # Monday=2 to Friday=6
        )
        
        if weekday_expenses.exists():
            return float(weekday_expenses.aggregate(avg=Avg('amount'))['avg'] or 0)
        return 0
