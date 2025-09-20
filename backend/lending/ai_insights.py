import google.generativeai as genai
from django.conf import settings
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from django.core.cache import cache
from datetime import datetime, timedelta
from decimal import Decimal
import json
import logging
from .models import LendingTransaction, LendingAIInsight

logger = logging.getLogger(__name__)

class LendingAIInsightsEngine:
    """Advanced AI insights engine for lending behavior analysis"""
    
    def __init__(self, user):
        self.user = user
        self.model = None
        self._configure_ai()
    
    def _configure_ai(self):
        """Configure Gemini AI model"""
        try:
            api_key = getattr(settings, 'GEMINI_API_KEY', None) or getattr(settings, 'GOOGLE_API_KEY', None)
            if api_key:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-1.5-flash')
                logger.info("Gemini AI configured for lending insights")
            else:
                logger.warning("No AI API key configured")
        except Exception as e:
            logger.error(f"Failed to configure AI: {e}")
    
    def generate_comprehensive_insights(self, force_refresh=False):
        """Generate comprehensive AI insights for lending behavior with caching"""
        try:
            # Check cache first unless force refresh
            cache_key = f'lending_ai_insights_{self.user.id}'
            if not force_refresh:
                cached_insights = cache.get(cache_key)
                if cached_insights:
                    logger.info(f"Returning cached lending insights for user {self.user.id}")
                    return cached_insights
            
            # Get user data
            transactions = LendingTransaction.objects.filter(user=self.user)
            
            if not transactions.exists():
                empty_insights = {
                    "insights": ["Start tracking your lending and borrowing to get personalized insights"],
                    "risk_score": 0,
                    "recommendations": ["Add your first transaction to begin analysis"],
                    "patterns": [],
                    "predictions": [],
                    "key_metrics": {
                        "total_exposure": 0,
                        "active_contacts": 0,
                        "avg_duration": 0,
                        "success_rate": 0
                    },
                    "risk_factors": {
                        "overdue_risk": 0,
                        "concentration_risk": 0,
                        "exposure_risk": 0,
                        "completion_risk": 0
                    }
                }
                # Cache empty insights for 1 hour
                cache.set(cache_key, empty_insights, 3600)
                return empty_insights
            
            # Calculate comprehensive statistics
            stats = self._calculate_comprehensive_stats(transactions)
            
            # Generate AI insights if model is available
            if self.model:
                ai_insights = self._generate_ai_insights(stats)
            else:
                ai_insights = self._generate_fallback_insights(stats)
            
            # Calculate risk score
            risk_score = self._calculate_advanced_risk_score(transactions, stats)
            
            # Generate recommendations
            recommendations = self._generate_smart_recommendations(transactions, stats)
            
            # Identify patterns
            patterns = self._identify_patterns(transactions)
            
            # Generate predictions
            predictions = self._generate_predictions(transactions, stats)
            
            insights_data = {
                "insights": ai_insights,
                "risk_score": risk_score,
                "recommendations": recommendations,
                "patterns": patterns,
                "predictions": predictions,
                "statistics": stats,
                "key_metrics": {
                    "total_exposure": stats['total_lent'],
                    "active_contacts": len(set(t.person_name for t in transactions if t.status == 'active')),
                    "avg_duration": self._calculate_avg_duration(transactions),
                    "success_rate": stats['completion_rate']
                },
                "risk_factors": {
                    "overdue_risk": min(100, stats['overdue_count'] * 10),
                    "concentration_risk": min(100, self._calculate_person_concentration(transactions) * 100),
                    "exposure_risk": min(100, (stats['total_lent'] / 10000) * 20) if stats['total_lent'] > 0 else 0,
                    "completion_risk": max(0, 100 - stats['completion_rate'])
                },
                "generated_at": timezone.now().isoformat(),
            }
            
            # Cache insights for 4.5 hours (same as subscription insights)
            cache.set(cache_key, insights_data, 16200)  # 4.5 hours in seconds
            logger.info(f"Generated and cached new lending insights for user {self.user.id}")
            
            return insights_data
            
        except Exception as e:
            logger.error(f"Error generating lending insights: {e}")
            error_insights = {
                "error": f"Failed to generate insights: {str(e)}",
                "insights": ["Unable to generate insights at this time"],
                "risk_score": 0,
                "recommendations": ["Add more transaction data for better analysis"],
                "patterns": [],
                "predictions": [],
                "key_metrics": {
                    "total_exposure": 0,
                    "active_contacts": 0,
                    "avg_duration": 0,
                    "success_rate": 0
                },
                "risk_factors": {
                    "overdue_risk": 0,
                    "concentration_risk": 0,
                    "exposure_risk": 0,
                    "completion_risk": 0
                },
                "generated_at": timezone.now().isoformat(),
            }
            # Cache error for shorter time (30 minutes)
            cache_key = f'lending_ai_insights_{self.user.id}'
            cache.set(cache_key, error_insights, 1800)
            return error_insights
    
    def _calculate_comprehensive_stats(self, transactions):
        """Calculate comprehensive statistics"""
        now = timezone.now().date()
        
        # Basic totals
        active_lends = transactions.filter(transaction_type='lend', status='active')
        active_borrows = transactions.filter(transaction_type='borrow', status='active')
        
        total_lent = active_lends.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        total_borrowed = active_borrows.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Convert to Decimal if they're floats
        if isinstance(total_lent, float):
            total_lent = Decimal(str(total_lent))
        if isinstance(total_borrowed, float):
            total_borrowed = Decimal(str(total_borrowed))
        
        # Overdue analysis
        overdue_transactions = transactions.filter(due_date__lt=now, status='active')
        overdue_count = overdue_transactions.count()
        overdue_amount = overdue_transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        if isinstance(overdue_amount, float):
            overdue_amount = Decimal(str(overdue_amount))
        
        # Completion rates
        completed_transactions = transactions.filter(status='completed')
        completion_rate = (completed_transactions.count() / max(transactions.count(), 1)) * 100
        
        # Average amounts and durations
        avg_lend_amount = active_lends.aggregate(avg=Avg('amount'))['avg'] or Decimal('0')
        avg_borrow_amount = active_borrows.aggregate(avg=Avg('amount'))['avg'] or Decimal('0')
        
        # Convert to Decimal if they're floats
        if isinstance(avg_lend_amount, float):
            avg_lend_amount = Decimal(str(avg_lend_amount))
        if isinstance(avg_borrow_amount, float):
            avg_borrow_amount = Decimal(str(avg_borrow_amount))
        
        # Recent activity (30 days)
        recent_date = now - timedelta(days=30)
        recent_activity = transactions.filter(transaction_date__gte=recent_date).count()
        
        # Interest analysis
        interest_bearing = transactions.filter(interest_rate__gt=0)
        avg_interest_rate = interest_bearing.aggregate(avg=Avg('interest_rate'))['avg'] or Decimal('0')
        if isinstance(avg_interest_rate, float):
            avg_interest_rate = Decimal(str(avg_interest_rate))
        
        return {
            'total_lent': float(total_lent),
            'total_borrowed': float(total_borrowed),
            'net_position': float(total_lent - total_borrowed),
            'active_lends_count': active_lends.count(),
            'active_borrows_count': active_borrows.count(),
            'overdue_count': overdue_count,
            'overdue_amount': float(overdue_amount),
            'completion_rate': round(completion_rate, 2),
            'avg_lend_amount': float(avg_lend_amount),
            'avg_borrow_amount': float(avg_borrow_amount),
            'recent_activity': recent_activity,
            'avg_interest_rate': float(avg_interest_rate),
            'total_transactions': transactions.count()
        }
    
    def _generate_ai_insights(self, stats):
        """Generate AI-powered insights with rate limiting awareness"""
        try:
            # Check if we're in night pause period (12 AM to 9 AM)
            current_hour = timezone.now().hour
            if 0 <= current_hour < 9:
                logger.info("AI insights paused during night hours")
                return self._generate_fallback_insights(stats)
            
            prompt = f"""
            Analyze this lending and borrowing profile and provide 4-5 key insights:
            
            Financial Profile:
            - Total Active Lends: ${stats['total_lent']}
            - Total Active Borrows: ${stats['total_borrowed']}
            - Net Position: ${stats['net_position']}
            - Completion Rate: {stats['completion_rate']}%
            - Overdue Transactions: {stats['overdue_count']} (${stats['overdue_amount']})
            - Average Interest Rate: {stats['avg_interest_rate']}%
            - Recent Activity: {stats['recent_activity']} transactions in 30 days
            
            Provide insights on:
            1. Financial health assessment
            2. Risk patterns and concerns
            3. Lending/borrowing behavior analysis
            4. Opportunities for improvement
            5. Relationship management insights
            
            Keep each insight concise (1-2 sentences) and actionable.
            Return as a JSON array of strings.
            """
            
            response = self.model.generate_content(prompt)
            insights_text = response.text.strip()
            
            # Try to parse as JSON, fallback to splitting by lines
            try:
                insights = json.loads(insights_text)
                if isinstance(insights, list):
                    return insights
            except:
                pass
            
            # Fallback: split by lines and clean
            insights = [line.strip() for line in insights_text.split('\n') if line.strip() and not line.strip().startswith('```')]
            return insights[:5]  # Limit to 5 insights
            
        except Exception as e:
            logger.error(f"AI insight generation failed: {e}")
            return self._generate_fallback_insights(stats)
    
    def _generate_fallback_insights(self, stats):
        """Generate rule-based insights when AI is unavailable"""
        insights = []
        
        # Net position analysis
        if stats['net_position'] > 1000:
            insights.append(f"You're in a strong lending position with ${stats['net_position']:.2f} net lent out")
        elif stats['net_position'] < -1000:
            insights.append(f"You have a net borrowing position of ${abs(stats['net_position']):.2f} - consider balancing")
        
        # Overdue analysis
        if stats['overdue_count'] > 0:
            insights.append(f"You have {stats['overdue_count']} overdue transactions worth ${stats['overdue_amount']:.2f}")
        
        # Completion rate
        if stats['completion_rate'] < 70:
            insights.append(f"Your completion rate is {stats['completion_rate']:.1f}% - focus on following up")
        elif stats['completion_rate'] > 90:
            insights.append(f"Excellent completion rate of {stats['completion_rate']:.1f}% - great relationship management!")
        
        # Activity level
        if stats['recent_activity'] > 5:
            insights.append(f"High activity with {stats['recent_activity']} transactions in the last 30 days")
        
        return insights[:4]
    
    def _calculate_avg_duration(self, transactions):
        """Calculate average transaction duration"""
        durations = []
        for t in transactions:
            if t.due_date and t.transaction_date:
                duration = (t.due_date - t.transaction_date).days
                durations.append(duration)
        return round(sum(durations) / len(durations)) if durations else 0
    
    def _calculate_advanced_risk_score(self, transactions, stats):
        """Calculate comprehensive risk score (0-100)"""
        if not transactions.exists():
            return 0
        
        risk_factors = []
        
        # Overdue ratio (0-30 points)
        overdue_ratio = stats['overdue_count'] / max(stats['total_transactions'], 1)
        risk_factors.append(min(30, overdue_ratio * 100))
        
        # Exposure ratio (0-25 points)
        exposure_ratio = stats['total_lent'] / max(stats['total_lent'] + stats['total_borrowed'], 1)
        if exposure_ratio > 0.8:  # High lending exposure
            risk_factors.append(25)
        elif exposure_ratio > 0.6:
            risk_factors.append(15)
        else:
            risk_factors.append(5)
        
        # Completion rate (0-20 points, inverse)
        completion_risk = max(0, (100 - stats['completion_rate']) / 5)
        risk_factors.append(min(20, completion_risk))
        
        # Concentration risk (0-15 points)
        # Check if too much money is with few people
        person_concentration = self._calculate_person_concentration(transactions)
        risk_factors.append(min(15, person_concentration * 15))
        
        # Recent activity volatility (0-10 points)
        activity_risk = min(10, max(0, (stats['recent_activity'] - 10) / 2))
        risk_factors.append(activity_risk)
        
        total_risk = sum(risk_factors)
        return round(min(100, total_risk), 1)
    
    def _calculate_person_concentration(self, transactions):
        """Calculate concentration risk (0-1)"""
        person_totals = transactions.filter(status='active').values('person_name').annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        if not person_totals:
            return 0
        
        total_amount = sum(p['total'] for p in person_totals)
        if total_amount == 0:
            return 0
        
        # Check if top person has more than 50% of total
        top_person_ratio = person_totals[0]['total'] / total_amount
        return min(1, max(0, (top_person_ratio - 0.3) / 0.4))
    
    def _generate_smart_recommendations(self, transactions, stats):
        """Generate smart recommendations based on analysis"""
        recommendations = []
        
        # Overdue recommendations
        if stats['overdue_count'] > 0:
            recommendations.append(f"Follow up on {stats['overdue_count']} overdue transactions immediately")
        
        # Balance recommendations
        if stats['net_position'] < -stats['total_borrowed'] * 0.5:
            recommendations.append("Consider reducing borrowing to improve financial independence")
        
        # Diversification
        concentration = self._calculate_person_concentration(transactions)
        if concentration > 0.6:
            recommendations.append("Diversify your lending across more people to reduce risk")
        
        # Interest optimization
        if stats['avg_interest_rate'] == 0 and stats['total_lent'] > 1000:
            recommendations.append("Consider charging reasonable interest on larger loans")
        
        # Documentation
        undocumented = transactions.filter(description='').count()
        if undocumented > transactions.count() * 0.3:
            recommendations.append("Add descriptions to transactions for better tracking")
        
        # Default recommendation
        if not recommendations:
            recommendations.append("Your lending practices look healthy! Keep monitoring regularly")
        
        return recommendations[:5]
    
    def _identify_patterns(self, transactions):
        """Identify behavioral patterns"""
        patterns = []
        
        # Seasonal patterns
        monthly_activity = transactions.values('transaction_date__month').annotate(
            count=Count('lending_id')
        ).order_by('-count')
        
        if monthly_activity:
            peak_month = monthly_activity[0]
            month_names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            patterns.append(f"Peak activity in {month_names[peak_month['transaction_date__month']]} with {peak_month['count']} transactions")
        
        # Amount patterns
        avg_amount = transactions.aggregate(avg=Avg('amount'))['avg'] or 0
        large_transactions = transactions.filter(amount__gt=avg_amount * 2).count()
        if large_transactions > 0:
            patterns.append(f"{large_transactions} transactions are significantly above average amount")
        
        return patterns[:3]
    
    def _generate_predictions(self, transactions, stats):
        """Generate simple predictions based on trends"""
        predictions = []
        
        # Completion prediction
        if stats['completion_rate'] > 80:
            predictions.append("High likelihood of successful transaction completion")
        elif stats['completion_rate'] < 60:
            predictions.append("Monitor closely - completion rate suggests potential issues")
        
        # Cash flow prediction
        if stats['net_position'] > 0:
            predictions.append(f"Expected to receive ${stats['net_position']:.2f} when all loans are repaid")
        
        return predictions[:2]

def get_lending_ai_insights(user, force_refresh=False):
    """Main function to get AI insights for a user with caching support"""
    engine = LendingAIInsightsEngine(user)
    return engine.generate_comprehensive_insights(force_refresh=force_refresh)

def clear_lending_insights_cache(user):
    """Clear cached insights for a user"""
    cache_key = f'lending_ai_insights_{user.id}'
    cache.delete(cache_key)
    logger.info(f"Cleared lending insights cache for user {user.id}")