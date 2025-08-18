from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from datetime import datetime, timedelta
from collections import defaultdict
import calendar
from .models import Expense
from budgets.models import Budget


class AdvancedExpenseAnalytics:
    """Advanced analytics engine for expenses with predictive insights"""

    def __init__(self, user):
        self.user = user
        self.expenses = Expense.objects.filter(user=user)
        self.budgets = Budget.objects.filter(user=user)

    def get_comprehensive_analytics(self, period='month'):
        """Get comprehensive analytics including predictions and trends"""
        now = timezone.now()

        if period == 'week':
            start_date = now - timedelta(days=7)
        elif period == 'month':
            start_date = now - timedelta(days=30)
        elif period == 'quarter':
            start_date = now - timedelta(days=90)
        else:  # year
            start_date = now - timedelta(days=365)

        period_expenses = self.expenses.filter(transaction_date__gte=start_date)

        # Calculate the summary statistics first
        total_amount = float(period_expenses.aggregate(Sum('amount'))['amount__sum'] or 0)
        expense_count = period_expenses.count()
        average_amount = float(period_expenses.aggregate(Avg('amount'))['amount__avg'] or 0)
        days_in_period = max((now.date() - start_date.date()).days, 1)
        daily_average = total_amount / days_in_period

        summary_data = {
            'total_amount': total_amount,
            'expense_count': expense_count,
            'average_amount': average_amount,
            'daily_average': daily_average
        }
        payment_method_breakdown = period_expenses.values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('expense_id')
        ).order_by('-total')
        return {
            'summary': summary_data,  
            'spending_trends': self._get_spending_trends(period_expenses, period),
            'category_insights': self._get_category_insights(period_expenses),
            'payment_method_breakdown': list(payment_method_breakdown),
            'budget_performance': self._get_budget_performance(period_expenses, period),
            'predictive_insights': self._get_predictive_insights(period_expenses, period),
            'savings_opportunities': self._get_savings_opportunities(period_expenses),
            'spending_patterns': self._get_spending_patterns(period_expenses),
            'financial_health_score': self._calculate_financial_health_score(period_expenses, period),
            'recommendations': self._generate_recommendations(period_expenses, period)
        }

    def _get_spending_trends(self, expenses, period):
        """Analyze spending trends over time"""
        daily_spending = defaultdict(float)

        for expense in expenses:
            date_key = expense.transaction_date.strftime('%Y-%m-%d')
            daily_spending[date_key] += float(expense.amount)

        values = list(daily_spending.values())
        if len(values) >= 2:
            recent_avg = sum(values[-7:]) / min(7, len(values))
            earlier_avg = sum(values[:-7]) / max(1, len(values) - 7)
            trend = 'increasing' if recent_avg > earlier_avg else 'decreasing'
            trend_percentage = abs((recent_avg - earlier_avg) / max(earlier_avg, 1)) * 100
        else:
            trend = 'stable'
            trend_percentage = 0

        return {
            'daily_spending': dict(daily_spending),
            'trend_direction': trend,
            'trend_percentage': round(trend_percentage, 1),
            'average_daily_spending': round(sum(values) / max(len(values), 1), 2),
            'highest_spending_day': max(daily_spending.items(), key=lambda x: x[1]) if daily_spending else None,
            'lowest_spending_day': min(daily_spending.items(), key=lambda x: x[1]) if daily_spending else None
        }

    def _get_category_insights(self, expenses):
        """Deep dive into category-based spending patterns"""
        category_data = expenses.values('category').annotate(
            total=Sum('amount'),
            count=Count('expense_id'),
            avg_amount=Avg('amount')
        ).order_by('-total')

        # FIX: Convert total_spending to float
        total_spending = float(sum(item['total'] for item in category_data if item['total']))

        insights = []
        for item in category_data:
            # FIX: Ensure item['total'] is treated as float
            item_total = float(item['total'] or 0)
            percentage = (item_total / total_spending * 100) if total_spending > 0 else 0
            insights.append({
                'category': item['category'],
                'total_spent': item_total,
                'transaction_count': item['count'],
                'average_amount': float(item['avg_amount'] or 0),
                'percentage_of_total': round(percentage, 1),
                'spending_frequency': 'high' if item['count'] > 10 else 'medium' if item['count'] > 5 else 'low'
            })

        return {
            'category_breakdown': insights,
            'top_category': insights[0] if insights else None,
            'most_frequent_category': max(insights, key=lambda x: x['transaction_count']) if insights else None,
            'category_diversity_score': len(insights)
        }

    def _get_budget_performance(self, expenses, period):
        """Analyze budget performance and adherence"""
        budget_performance = []

        for budget in self.budgets.filter(is_active=True):
            category_expenses = expenses.filter(category=budget.category)
            
            # FIX #2: Convert total_spent and budget_amount to floats for consistent math
            total_spent = float(category_expenses.aggregate(Sum('amount'))['amount__sum'] or 0)
            budget_amount = float(budget.amount)

            utilization = (total_spent / budget_amount * 100) if budget_amount > 0 else 0
            remaining = budget_amount - total_spent

            status = 'over_budget' if utilization > 100 else 'on_track' if utilization > 80 else 'under_budget'

            budget_performance.append({
                'category': budget.category,
                'budget_amount': budget_amount,
                'spent_amount': total_spent,
                'remaining_amount': remaining,
                'utilization_percentage': round(utilization, 1),
                'status': status,
                'days_left': (budget.end_date - timezone.now().date()).days if budget.end_date else None
            })

        return {
            'budget_performance': budget_performance,
            'over_budget_count': sum(1 for b in budget_performance if b['status'] == 'over_budget'),
            'average_utilization': round(sum(b['utilization_percentage'] for b in budget_performance) / max(len(budget_performance), 1), 1)
        }

    def _get_predictive_insights(self, expenses, period):
        """Generate predictive insights based on spending patterns"""
        if not expenses.exists():
            return {'predictions': [], 'confidence': 'low'}

        days_in_period = (timezone.now().date() - expenses.order_by('transaction_date').first().transaction_date).days or 1
        
        # FIX: Convert aggregated values to float
        total_spent = float(expenses.aggregate(Sum('amount'))['amount__sum'] or 0)
        daily_average = total_spent / days_in_period

        recent_expenses = expenses.filter(transaction_date__gte=timezone.now() - timedelta(days=7))
        recent_daily_avg = float(recent_expenses.aggregate(Sum('amount'))['amount__sum'] or 0) / 7

        velocity = 'accelerating' if recent_daily_avg > daily_average else 'decelerating'
        next_month_projection = daily_average * 30

        predictions = [
            {
                'type': 'monthly_projection',
                'description': f'Based on current spending patterns, you\'re projected to spend ₹{next_month_projection:.2f} next month',
                'amount': next_month_projection,
                'confidence': 'medium'
            },
            {
                'type': 'spending_velocity',
                'description': f'Your spending is currently {velocity}',
                'trend': velocity,
                'confidence': 'high'
            }
        ]

        return {
            'predictions': predictions,
            'daily_average': round(daily_average, 2),
            'spending_velocity': velocity
        }

    def _get_savings_opportunities(self, expenses):
        """Identify potential savings opportunities"""
        opportunities = []

        category_analysis = expenses.values('category').annotate(
            count=Count('expense_id'),
            avg_amount=Avg('amount'),
            total=Sum('amount')
        )

        for category in category_analysis:
            if category['count'] > 5 and float(category['avg_amount'] or 0) < 500:
                potential_savings = float(category['total'] or 0) * 0.1
                opportunities.append({
                    'category': category['category'],
                    'opportunity_type': 'subscription_optimization',
                    'description': f'Review recurring {category["category"]} expenses for potential savings',
                    'potential_savings': round(potential_savings, 2),
                    'priority': 'medium'
                })

        avg_expense = float(expenses.aggregate(Avg('amount'))['amount__avg'] or 0)
        if avg_expense > 0:
            high_expenses = expenses.filter(amount__gt=avg_expense * 2)
            if high_expenses.exists():
                opportunities.append({
                    'category': 'high_expenses',
                    'opportunity_type': 'expense_review',
                    'description': f'Review {high_expenses.count()} unusually high expenses',
                    'potential_savings': 0,
                    'priority': 'high'
                })
        return opportunities

    def _get_spending_patterns(self, expenses):
        """Analyze spending patterns by day of week, time, etc."""
        patterns = {
            'by_day_of_week': defaultdict(float),
            'by_hour': defaultdict(float),
            'weekend_vs_weekday': {'weekend': 0, 'weekday': 0}
        }

        for expense in expenses:
            day_name = expense.transaction_date.strftime('%A')
            patterns['by_day_of_week'][day_name] += float(expense.amount)
            if expense.transaction_date.weekday() >= 5:
                patterns['weekend_vs_weekday']['weekend'] += float(expense.amount)
            else:
                patterns['weekend_vs_weekday']['weekday'] += float(expense.amount)

        patterns['by_day_of_week'] = dict(patterns['by_day_of_week'])
        peak_day = max(patterns['by_day_of_week'].items(), key=lambda x: x[1]) if patterns['by_day_of_week'] else None
        
        total_spending = patterns['weekend_vs_weekday']['weekend'] + patterns['weekend_vs_weekday']['weekday']
        weekend_ratio = (patterns['weekend_vs_weekday']['weekend'] / max(total_spending, 1) * 100)

        return {
            **patterns,
            'peak_spending_day': peak_day[0] if peak_day else None,
            'weekend_spending_ratio': round(weekend_ratio, 1)
        }

    def _calculate_financial_health_score(self, expenses, period):
        """Calculate a financial health score (0-100)"""
        score = 100
        
        # Budget adherence (30 points)
        over_budget_penalties = 0
        for budget in self.budgets.filter(is_active=True):
            category_expenses = expenses.filter(category=budget.category)
            # FIX: Convert to float for comparison
            total_spent = float(category_expenses.aggregate(Sum('amount'))['amount__sum'] or 0)
            if total_spent > float(budget.amount):
                over_budget_penalties += 10
        score -= min(over_budget_penalties, 30)

        # Spending consistency (20 points)
        daily_amounts = list(expenses.values_list('amount', flat=True))
        if daily_amounts:
            # FIX #1: Convert all amounts to float for consistent calculation
            daily_amounts_float = [float(a) for a in daily_amounts]
            avg_amount = sum(daily_amounts_float) / len(daily_amounts_float)
            if avg_amount > 0:
                variance = sum((x - avg_amount) ** 2 for x in daily_amounts_float) / len(daily_amounts_float)
                consistency_penalty = (variance / avg_amount)
                score -= min(20, consistency_penalty)

        # Category diversification (20 points)
        unique_categories = expenses.values('category').distinct().count()
        diversification_score = min(20, unique_categories * 2)
        score -= (20 - diversification_score)

        # Spending trend (30 points)
        trends = self._get_spending_trends(expenses, period)
        if trends['trend_direction'] == 'increasing':
            score -= min(30, trends['trend_percentage'])

        return max(0, min(100, round(score)))

    def _generate_recommendations(self, expenses, period):
        """Generate personalized recommendations"""
        recommendations = []
        over_budget_categories = []
        
        for budget in self.budgets.filter(is_active=True):
            category_expenses = expenses.filter(category=budget.category)
            # FIX #3: Convert to float for comparison
            total_spent = float(category_expenses.aggregate(Sum('amount'))['amount__sum'] or 0)
            if total_spent > float(budget.amount):
                over_budget_categories.append(budget.category)

        if over_budget_categories:
            recommendations.append({
                'type': 'budget_alert', 'priority': 'high', 'title': 'Budget Exceeded',
                'description': f'You\'ve exceeded budgets in: {", ".join(over_budget_categories)}',
                'action': 'Review and adjust spending in these categories'
            })

        category_totals = expenses.values('category').annotate(total=Sum('amount')).order_by('-total')
        if category_totals:
            top_category = category_totals[0]
            recommendations.append({
                'type': 'savings_opportunity', 'priority': 'medium', 'title': 'Top Spending Category',
                'description': f'{top_category["category"]} is your highest expense category',
                'action': f'Look for ways to optimize {top_category["category"]} spending'
            })

        trends = self._get_spending_trends(expenses, period)
        if trends['trend_direction'] == 'increasing' and trends['trend_percentage'] > 20:
            recommendations.append({
                'type': 'trend_alert', 'priority': 'high', 'title': 'Spending Increase Detected',
                'description': f'Your spending has increased by {trends["trend_percentage"]:.1f}%',
                'action': 'Review recent expenses and identify areas to cut back'
            })

        return recommendations

    def get_budget_analysis(self):
        """Get detailed budget analysis"""
        try:
            budget_analysis_data = [] # We'll build a list directly
            active_budgets = self.budgets.filter(is_active=True)
            
            # Determine the current month's date range to filter expenses
            now = timezone.now()
            start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Pre-calculate total spending for this month for efficiency
            total_spent_this_month = self.expenses.filter(
                transaction_date__gte=start_of_month.date()
            ).aggregate(total=Sum('amount'))['total'] or 0

            for budget in active_budgets:
                budget_amount = float(budget.amount)
                total_spent_for_budget = 0
                expense_count = 0
                
                # --- THIS IS THE CRITICAL FIX ---
                # Check if the budget is a general, 'Overall' budget
                if budget.category and budget.category.lower() == 'overall':
                    # If it is, use the total spending for the entire month
                    total_spent_for_budget = float(total_spent_this_month)
                    # And count all expenses in the month
                    expense_count = self.expenses.filter(transaction_date__gte=start_of_month.date()).count()
                else:
                    # Otherwise, use the existing logic for specific category budgets
                    category_expenses = self.expenses.filter(
                        category=budget.category, 
                        transaction_date__gte=start_of_month.date()
                    )
                    total_spent_for_budget = float(category_expenses.aggregate(Sum('amount'))['amount__sum'] or 0)
                    expense_count = category_expenses.count()
                # --- END OF FIX ---
                
                percentage_used = round((total_spent_for_budget / budget_amount) * 100, 1) if budget_amount > 0 else 0
                
                budget_analysis_data.append({
                    'category': budget.category,
                    'budget_amount': budget_amount,
                    'spent_amount': total_spent_for_budget,
                    'remaining_amount': budget_amount - total_spent_for_budget,
                    'utilization_percentage': percentage_used,
                    'status': 'over_budget' if total_spent_for_budget > budget_amount else 'under_budget',
                    'expense_count': expense_count
                })
            
            # Build the final response structure
            return {
                'budget_analysis': budget_analysis_data,
                'overall_summary': {}, # Can be enhanced later if needed
                'recommendations': [] # Can be enhanced later if needed
            }
        except Exception as e:
            print(f"🔴 ERROR IN get_budget_analysis: {str(e)}")
            return { 'budget_analysis': [], 'overall_summary': {}, 'recommendations': [] }

    def get_trends_analysis(self, months=6):
        """Get spending trends analysis for the specified number of months"""
        try:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=months * 30)
            
            # Get monthly spending data
            monthly_data = {}
            current_date = start_date
            
            while current_date <= end_date:
                month_key = current_date.strftime('%Y-%m')
                month_start = current_date.replace(day=1)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
                
                month_expenses = self.expenses.filter(
                    transaction_date__gte=month_start,
                    transaction_date__lte=month_end
                )
                
                total_spent = month_expenses.aggregate(Sum('amount'))['amount__sum'] or 0
                expense_count = month_expenses.count()
                
                monthly_data[month_key] = {
                    'total_spent': float(total_spent),
                    'expense_count': expense_count,
                    'average_expense': float(total_spent / expense_count) if expense_count > 0 else 0,
                    'categories': month_expenses.values('category').annotate(
                        total=Sum('amount'),
                        count=Count('expense_id')
                    )
                }
                
                current_date = (month_start + timedelta(days=32)).replace(day=1)
            
            # Calculate trends
            months_list = list(monthly_data.keys())
            if len(months_list) >= 2:
                recent_avg = sum(monthly_data[month]['total_spent'] for month in months_list[-2:]) / 2
                earlier_avg = sum(monthly_data[month]['total_spent'] for month in months_list[:-2]) / max(1, len(months_list) - 2)
                trend_direction = 'increasing' if recent_avg > earlier_avg else 'decreasing'
                trend_percentage = abs((recent_avg - earlier_avg) / max(earlier_avg, 1)) * 100
            else:
                trend_direction = 'stable'
                trend_percentage = 0
            
            return {
                'monthly_data': monthly_data,
                'trend_analysis': {
                    'direction': trend_direction,
                    'percentage_change': round(trend_percentage, 1),
                    'recent_average': round(recent_avg, 2) if 'recent_avg' in locals() else 0,
                    'earlier_average': round(earlier_avg, 2) if 'earlier_avg' in locals() else 0
                },
                'insights': self._generate_trend_insights(monthly_data, trend_direction, trend_percentage)
            }
        except Exception as e:
            print(f"🔴 ERROR IN get_trends_analysis: {str(e)}") # Add this print
            raise e

    def _generate_budget_recommendations(self, budget_data):
        """Generate budget-specific recommendations"""
        recommendations = []
        
        for category, data in budget_data.items():
            if data['status'] == 'over_budget':
                recommendations.append({
                    'category': category,
                    'type': 'budget_exceeded',
                    'priority': 'high',
                    'message': f'You have exceeded your {category} budget by ₹{abs(data["remaining"]):.2f}',
                    'suggestion': 'Consider reducing spending in this category or increasing your budget'
                })
            elif data['status'] == 'near_limit':
                recommendations.append({
                    'category': category,
                    'type': 'budget_warning',
                    'priority': 'medium',
                    'message': f'You are approaching your {category} budget limit',
                    'suggestion': 'Monitor your spending to avoid exceeding the budget'
                })
        
        return recommendations

    def _generate_trend_insights(self, monthly_data, trend_direction, trend_percentage):
        """Generate insights based on spending trends"""
        insights = []
        
        if trend_direction == 'increasing' and trend_percentage > 20:
            insights.append({
                'type': 'spending_increase',
                'severity': 'high' if trend_percentage > 50 else 'medium',
                'message': f'Significant spending increase of {trend_percentage:.1f}% detected',
                'suggestion': 'Review your spending patterns and identify areas to reduce expenses'
            })
        elif trend_direction == 'decreasing':
            insights.append({
                'type': 'spending_decrease',
                'severity': 'positive',
                'message': f'Great job! Your spending has decreased by {trend_percentage:.1f}%',
                'suggestion': 'Maintain this positive trend and consider increasing your savings'
            })
        
        # Find peak spending month
        if monthly_data:
            peak_month = max(monthly_data.items(), key=lambda x: x[1]['total_spent'])
            insights.append({
                'type': 'peak_spending',
                'month': peak_month[0],
                'amount': peak_month[1]['total_spent'],
                'suggestion': 'Analyze what caused the high spending in this month'
            })
        
        return insights
