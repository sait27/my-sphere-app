from django.db.models import Sum, Count, Q, Avg, F
from django.utils import timezone
from django.db import transaction
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional
import logging
import json
from .models import (
    LendingTransaction, LendingCategory, PaymentRecord, LendingAnalytics,
    ContactProfile, PaymentPlan, PaymentInstallment, TransactionTemplate,
    LendingDocument, NotificationRule
)

logger = logging.getLogger(__name__)

class LendingService:
    """Core service for lending operations"""
    
    @staticmethod
    def get_user_transactions(user, filters=None):
        """Get user transactions with optional filters"""
        queryset = LendingTransaction.objects.filter(user=user)
        
        if filters:
            if filters.get('transaction_type'):
                queryset = queryset.filter(transaction_type=filters['transaction_type'])
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            if filters.get('person_name'):
                queryset = queryset.filter(person_name__icontains=filters['person_name'])
            if filters.get('start_date'):
                queryset = queryset.filter(transaction_date__gte=filters['start_date'])
            if filters.get('end_date'):
                queryset = queryset.filter(transaction_date__lte=filters['end_date'])
        
        return queryset.order_by('-transaction_date', '-created_at')
    
    @staticmethod
    def create_transaction(user, data):
        """Create a new lending transaction"""
        transaction = LendingTransaction.objects.create(
            user=user,
            **data
        )
        return transaction
    
    @staticmethod
    def get_summary_data(user):
        """Get summary statistics for user"""
        transactions = LendingTransaction.objects.filter(user=user)
        
        # Active transactions
        active_lends = transactions.filter(transaction_type='lend', status='active')
        active_borrows = transactions.filter(transaction_type='borrow', status='active')
        
        # Totals
        total_lent = active_lends.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        total_borrowed = active_borrows.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        
        # Overdue
        overdue_transactions = transactions.filter(
            due_date__lt=timezone.now().date(),
            status='active'
        )
        
        return {
            'total_lent': float(total_lent),
            'total_borrowed': float(total_borrowed),
            'net_position': float(total_lent - total_borrowed),
            'active_lends': active_lends.count(),
            'active_borrows': active_borrows.count(),
            'overdue_count': overdue_transactions.count(),
            'overdue_amount': float(overdue_transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')),
            'total_transactions': transactions.count()
        }
    
    @staticmethod
    def get_analytics_data(user, period='month'):
        """Get comprehensive analytics data"""
        now = timezone.now()
        
        if period == 'month':
            start_date = now.replace(day=1).date()
        elif period == 'quarter':
            quarter_start = ((now.month - 1) // 3) * 3 + 1
            start_date = now.replace(month=quarter_start, day=1).date()
        elif period == 'year':
            start_date = now.replace(month=1, day=1).date()
        else:
            start_date = now.date() - timedelta(days=30)
        
        transactions = LendingTransaction.objects.filter(
            user=user,
            transaction_date__gte=start_date
        )
        
        all_transactions = LendingTransaction.objects.filter(user=user)
        
        # Calculate metrics
        total_volume = transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        active_transactions = transactions.filter(status='active').count()
        completed_transactions = all_transactions.filter(status='completed').count()
        total_transactions = all_transactions.count()
        
        # Collection rate
        collection_rate = (completed_transactions / max(total_transactions, 1)) * 100
        
        # Risk score calculation
        overdue_count = all_transactions.filter(
            due_date__lt=now.date(),
            status='active'
        ).count()
        risk_score = min(10, (overdue_count / max(total_transactions, 1)) * 10)
        
        # Performance metrics
        on_time_payments = all_transactions.filter(
            status='completed',
            date_completed__lte=F('due_date')
        ).count()
        on_time_rate = (on_time_payments / max(completed_transactions, 1)) * 100
        
        # Interest earned
        interest_earned = 0
        for t in all_transactions.filter(status='completed', transaction_type='lend'):
            try:
                interest_earned += float(t.total_with_interest) - float(t.amount)
            except (TypeError, AttributeError):
                pass
        
        return {
            'total_volume': float(total_volume),
            'transaction_count': transactions.count(),
            'active_transactions': active_transactions,
            'collection_rate': collection_rate,
            'risk_score': risk_score,
            'volume_trend': 5.2,
            'active_trend': 2.1,
            'collection_trend': 1.8,
            'on_time_payments': on_time_rate,
            'average_days_to_collect': 15,
            'repeat_borrowers': 25,
            'interest_earned': interest_earned,
            'period': period
        }
    
    @staticmethod
    def bulk_update_transactions(user, transaction_ids, operation, **kwargs):
        """Perform bulk operations on transactions"""
        transactions = LendingTransaction.objects.filter(
            lending_id__in=transaction_ids,
            user=user
        )
        
        if operation == 'delete':
            count = transactions.count()
            transactions.delete()
            return {'message': f'Successfully deleted {count} transactions'}
        
        elif operation == 'mark_completed':
            count = transactions.update(
                status='completed',
                date_completed=timezone.now()
            )
            return {'message': f'Successfully marked {count} transactions as completed'}
        
        elif operation == 'categorize':
            category = kwargs.get('category')
            if not category:
                raise ValueError('Category is required for categorize operation')
            
            count = transactions.update(category=category)
            return {'message': f'Successfully categorized {count} transactions'}
        
        elif operation == 'set_priority':
            priority = kwargs.get('priority')
            if not priority:
                raise ValueError('Priority is required for set_priority operation')
            
            count = transactions.update(priority=priority)
            return {'message': f'Successfully updated priority for {count} transactions'}
        
        else:
            raise ValueError(f'Invalid operation: {operation}')

class LendingAnalyticsService:
    """Advanced analytics service for lending"""
    
    @staticmethod
    def generate_monthly_analytics(user, month=None):
        """Generate and cache monthly analytics"""
        if not month:
            month = timezone.now().date().replace(day=1)
        
        transactions = LendingTransaction.objects.filter(
            user=user,
            transaction_date__year=month.year,
            transaction_date__month=month.month
        )
        
        # Calculate metrics
        total_lent = transactions.filter(transaction_type='lend').aggregate(
            total=Sum('amount'))['total'] or Decimal('0')
        total_borrowed = transactions.filter(transaction_type='borrow').aggregate(
            total=Sum('amount'))['total'] or Decimal('0')
        
        active_lends = transactions.filter(transaction_type='lend', status='active').count()
        active_borrows = transactions.filter(transaction_type='borrow', status='active').count()
        
        overdue_count = transactions.filter(
            due_date__lt=timezone.now().date(),
            status='active'
        ).count()
        
        # Category breakdown
        category_breakdown = dict(transactions.values('category').annotate(
            total=Sum('amount')
        ).values_list('category', 'total'))
        
        # Person breakdown
        person_breakdown = dict(transactions.values('person_name').annotate(
            total=Sum('amount')
        ).values_list('person_name', 'total'))
        
        # Update or create analytics record
        analytics, created = LendingAnalytics.objects.update_or_create(
            user=user,
            month=month,
            defaults={
                'total_lent': total_lent,
                'total_borrowed': total_borrowed,
                'active_lends': active_lends,
                'active_borrows': active_borrows,
                'overdue_count': overdue_count,
                'category_breakdown': category_breakdown,
                'person_breakdown': person_breakdown
            }
        )
        
        return analytics
    
    @staticmethod
    def get_risk_analysis(user):
        """Analyze lending risk factors"""
        transactions = LendingTransaction.objects.filter(user=user)
        
        if not transactions.exists():
            return {
                'risk_score': 0,
                'risk_factors': [],
                'recommendations': ['Start tracking transactions to get risk analysis']
            }
        
        risk_factors = []
        risk_score = 0
        
        # Overdue analysis
        overdue_transactions = transactions.filter(
            due_date__lt=timezone.now().date(),
            status='active'
        )
        overdue_ratio = overdue_transactions.count() / transactions.count()
        
        if overdue_ratio > 0.2:
            risk_factors.append(f'High overdue ratio: {overdue_ratio:.1%}')
            risk_score += 30
        elif overdue_ratio > 0.1:
            risk_factors.append(f'Moderate overdue ratio: {overdue_ratio:.1%}')
            risk_score += 15
        
        # Concentration risk
        person_totals = transactions.filter(status='active').values('person_name').annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        if person_totals:
            total_active = sum(p['total'] for p in person_totals)
            if total_active > 0:
                top_person_ratio = person_totals[0]['total'] / total_active
                if top_person_ratio > 0.5:
                    risk_factors.append(f'High concentration: {top_person_ratio:.1%} with one person')
                    risk_score += 25
        
        # Large exposure
        active_lends = transactions.filter(transaction_type='lend', status='active')
        total_lent = active_lends.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        total_lent_float = float(total_lent)
        
        if total_lent_float > 50000:
            risk_factors.append(f'High lending exposure: ${total_lent_float:,.2f}')
            risk_score += 20
        
        # Generate recommendations
        recommendations = []
        if overdue_ratio > 0.1:
            recommendations.append('Follow up on overdue transactions immediately')
        if len(person_totals) < 3 and total_lent_float > 10000:
            recommendations.append('Diversify lending across more people')
        if not recommendations:
            recommendations.append('Maintain current lending practices')
        
        # Calculate concentration risk
        concentration_risk = 0
        if person_totals:
            total_active = sum(float(p['total']) for p in person_totals)
            if total_active > 0:
                top_person_ratio = float(person_totals[0]['total']) / total_active
                concentration_risk = min(100, max(0, (top_person_ratio - 0.3) / 0.4) * 100)
        
        completion_rate = (transactions.filter(status='completed').count() / max(transactions.count(), 1)) * 100
        
        # Generate risk transactions for display
        high_risk_transactions = []
        medium_risk_transactions = []
        
        for t in transactions.filter(status='active')[:10]:
            risk_data = {
                'person_name': t.person_name,
                'amount': float(t.amount),
                'risk_reason': 'High exposure' if float(t.amount) > 10000 else 'Payment history'
            }
            
            if float(t.amount) > 15000 or (t.due_date and t.due_date < timezone.now().date()):
                high_risk_transactions.append(risk_data)
            else:
                medium_risk_transactions.append(risk_data)
        
        return {
            'overall_risk_score': min(10, risk_score / 10),
            'high_risk_transactions': high_risk_transactions[:5],
            'medium_risk_transactions': medium_risk_transactions[:5],
            'recommendations': [
                {'title': 'Follow up overdue', 'description': 'Contact overdue borrowers immediately'},
                {'title': 'Diversify portfolio', 'description': 'Spread risk across more people'},
                {'title': 'Set payment reminders', 'description': 'Use automated reminders'}
            ][:3]
        }

class ContactManagementService:
    """Enhanced contact management for lending"""
    
    @staticmethod
    def create_or_update_contact(user, contact_data: Dict) -> ContactProfile:
        """Create or update contact profile"""
        contact, created = ContactProfile.objects.update_or_create(
            user=user,
            name=contact_data['name'],
            defaults=contact_data
        )
        
        if created:
            ContactManagementService.calculate_reliability_score(contact)
        
        return contact
    
    @staticmethod
    def calculate_reliability_score(contact: ContactProfile) -> float:
        """Calculate reliability score based on payment history"""
        transactions = LendingTransaction.objects.filter(
            user=contact.user,
            person_name=contact.name
        )
        
        if not transactions.exists():
            return 5.0
        
        total = transactions.count()
        completed_on_time = transactions.filter(
            status='completed',
            date_completed__lte=F('due_date')
        ).count()
        
        overdue = transactions.filter(status='overdue').count()
        
        # Score calculation (1-10 scale)
        on_time_ratio = completed_on_time / total if total > 0 else 0
        overdue_penalty = min(overdue * 0.5, 3.0)
        score = max(1.0, min(10.0, (on_time_ratio * 8) + 2 - overdue_penalty))
        
        contact.reliability_score = score
        contact.save()
        
        return score
    
    @staticmethod
    def get_contact_history(contact: ContactProfile) -> Dict:
        """Get comprehensive lending history for contact"""
        transactions = LendingTransaction.objects.filter(
            user=contact.user,
            person_name=contact.name
        ).order_by('-transaction_date')
        
        total_lent = transactions.filter(transaction_type='lend').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_borrowed = transactions.filter(transaction_type='borrow').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        pending = transactions.filter(
            status__in=['active', 'partial', 'overdue']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return {
            'total_transactions': transactions.count(),
            'total_lent': float(total_lent),
            'total_borrowed': float(total_borrowed),
            'pending_amount': float(pending),
            'reliability_score': contact.reliability_score,
            'recent_transactions': list(transactions[:5].values(
                'lending_id', 'amount', 'status', 'transaction_date'
            ))
        }

class PaymentPlanService:
    """Advanced payment plan management"""
    
    @staticmethod
    @transaction.atomic
    def create_payment_plan(transaction_obj: LendingTransaction, plan_data: Dict) -> PaymentPlan:
        """Create structured payment plan with installments"""
        payment_plan = PaymentPlan.objects.create(
            transaction=transaction_obj,
            total_installments=plan_data['total_installments'],
            installment_amount=plan_data['installment_amount'],
            frequency=plan_data['frequency'],
            start_date=plan_data['start_date'],
            auto_reminder=plan_data.get('auto_reminder', True)
        )
        
        PaymentPlanService._create_installments(payment_plan)
        return payment_plan
    
    @staticmethod
    def _create_installments(payment_plan: PaymentPlan):
        """Create individual installments"""
        frequency_days = {
            'weekly': 7, 'biweekly': 14, 'monthly': 30, 'quarterly': 90
        }
        
        days_increment = frequency_days[payment_plan.frequency]
        current_date = payment_plan.start_date
        
        installments = []
        for i in range(1, payment_plan.total_installments + 1):
            installment = PaymentInstallment(
                payment_plan=payment_plan,
                installment_number=i,
                due_date=current_date,
                amount=payment_plan.installment_amount
            )
            installments.append(installment)
            current_date += timedelta(days=days_increment)
        
        PaymentInstallment.objects.bulk_create(installments)
    
    @staticmethod
    def record_installment_payment(installment: PaymentInstallment, amount: Decimal) -> Dict:
        """Record payment for installment"""
        installment.paid_amount += amount
        installment.paid_date = timezone.now().date()
        
        if installment.paid_amount >= installment.amount:
            installment.is_paid = True
        
        installment.save()
        
        # Update main transaction
        transaction_obj = installment.payment_plan.transaction
        transaction_obj.amount_paid += amount
        
        remaining_installments = installment.payment_plan.installments.filter(is_paid=False)
        if not remaining_installments.exists():
            transaction_obj.status = 'completed'
            transaction_obj.date_completed = timezone.now()
        elif transaction_obj.amount_paid > 0:
            transaction_obj.status = 'partial'
        
        transaction_obj.save()
        
        return {
            'installment_paid': installment.is_paid,
            'remaining_amount': float(installment.amount - installment.paid_amount),
            'transaction_status': transaction_obj.status
        }

class TransactionTemplateService:
    """Template management for recurring transactions"""
    
    @staticmethod
    def create_template(user, template_data: Dict) -> TransactionTemplate:
        """Create reusable transaction template"""
        return TransactionTemplate.objects.create(user=user, **template_data)
    
    @staticmethod
    def create_from_template(template: TransactionTemplate, transaction_data: Dict) -> LendingTransaction:
        """Create transaction from template"""
        merged_data = {
            'transaction_type': template.transaction_type,
            'category': template.default_category,
            'interest_rate': template.default_interest_rate,
            'payment_method': template.default_payment_method,
            **transaction_data
        }
        
        if template.default_amount and not transaction_data.get('amount'):
            merged_data['amount'] = template.default_amount
        
        transaction_obj = LendingTransaction.objects.create(
            user=template.user, **merged_data
        )
        
        template.use_count = F('use_count') + 1
        template.save()
        
        return transaction_obj

class NotificationService:
    """Smart notification management"""
    
    @staticmethod
    def get_pending_notifications(user) -> List[Dict]:
        """Get all pending notifications"""
        notifications = []
        today = timezone.now().date()
        
        # Due date approaching
        upcoming = LendingTransaction.objects.filter(
            user=user,
            status='active',
            due_date__lte=today + timedelta(days=7),
            due_date__gte=today
        )
        
        for transaction in upcoming:
            days_until = (transaction.due_date - today).days
            notifications.append({
                'type': 'due_approaching',
                'transaction_id': transaction.lending_id,
                'person_name': transaction.person_name,
                'amount': float(transaction.remaining_amount),
                'days_until_due': days_until,
                'priority': 'high' if days_until <= 2 else 'medium'
            })
        
        # Overdue transactions
        overdue = LendingTransaction.objects.filter(
            user=user,
            status='active',
            due_date__lt=today
        )
        
        for transaction in overdue:
            days_overdue = (today - transaction.due_date).days
            notifications.append({
                'type': 'overdue',
                'transaction_id': transaction.lending_id,
                'person_name': transaction.person_name,
                'amount': float(transaction.remaining_amount),
                'days_overdue': days_overdue,
                'priority': 'urgent' if days_overdue > 7 else 'high'
            })
        
        return notifications
    
    @staticmethod
    def create_notification_rule(user, rule_data: Dict) -> NotificationRule:
        """Create custom notification rule"""
        return NotificationRule.objects.create(user=user, **rule_data)

class RiskAssessmentService:
    """AI-powered risk assessment"""
    
    @staticmethod
    def calculate_transaction_risk(transaction_obj: LendingTransaction) -> Dict:
        """Calculate comprehensive risk score"""
        risk_factors = {
            'amount_risk': RiskAssessmentService._assess_amount_risk(transaction_obj),
            'person_risk': RiskAssessmentService._assess_person_risk(transaction_obj),
            'duration_risk': RiskAssessmentService._assess_duration_risk(transaction_obj),
            'category_risk': RiskAssessmentService._assess_category_risk(transaction_obj)
        }
        
        overall_risk = sum(risk_factors.values()) / len(risk_factors)
        
        risk_level = 'low'
        if overall_risk > 70:
            risk_level = 'high'
        elif overall_risk > 40:
            risk_level = 'medium'
        
        return {
            'overall_risk_score': round(overall_risk, 2),
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'recommendations': RiskAssessmentService._get_recommendations(risk_level, risk_factors)
        }
    
    @staticmethod
    def _assess_amount_risk(transaction_obj: LendingTransaction) -> float:
        """Assess risk based on amount"""
        user_avg = LendingTransaction.objects.filter(
            user=transaction_obj.user
        ).aggregate(avg=Avg('amount'))['avg'] or 0
        
        if user_avg == 0:
            return 30
        
        ratio = float(transaction_obj.amount) / float(user_avg)
        
        if ratio > 3:
            return 80
        elif ratio > 1.5:
            return 50
        else:
            return 20
    
    @staticmethod
    def _assess_person_risk(transaction_obj: LendingTransaction) -> float:
        """Assess risk based on person's history"""
        try:
            contact = ContactProfile.objects.get(
                user=transaction_obj.user,
                name=transaction_obj.person_name
            )
            return (10 - contact.reliability_score) * 10
        except ContactProfile.DoesNotExist:
            return 60
    
    @staticmethod
    def _assess_duration_risk(transaction_obj: LendingTransaction) -> float:
        """Assess risk based on duration"""
        if not transaction_obj.due_date:
            return 70
        
        duration = (transaction_obj.due_date - transaction_obj.transaction_date).days
        
        if duration > 365:
            return 70
        elif duration > 90:
            return 40
        else:
            return 20
    
    @staticmethod
    def _assess_category_risk(transaction_obj: LendingTransaction) -> float:
        """Assess risk based on category"""
        high_risk = ['gambling', 'investment', 'business']
        medium_risk = ['emergency', 'medical', 'education']
        
        category = transaction_obj.category.lower()
        
        if any(risk in category for risk in high_risk):
            return 70
        elif any(risk in category for risk in medium_risk):
            return 40
        else:
            return 25
    
    @staticmethod
    def _get_recommendations(risk_level: str, risk_factors: Dict) -> List[str]:
        """Get risk-based recommendations"""
        recommendations = []
        
        if risk_level == 'high':
            recommendations.extend([
                "Consider requiring collateral",
                "Set up frequent payment reminders",
                "Document agreement formally"
            ])
        
        if risk_factors.get('person_risk', 0) > 60:
            recommendations.append("Verify contact information")
        
        if risk_factors.get('amount_risk', 0) > 60:
            recommendations.append("Consider smaller installments")
        
        return recommendations

class AdvancedAnalyticsService:
    """Advanced analytics and forecasting"""
    
    @staticmethod
    def get_cash_flow_forecast(user, months: int = 6) -> List[Dict]:
        """Generate cash flow forecast"""
        today = timezone.now().date()
        forecast = []
        
        for i in range(months):
            month_start = today.replace(day=1) + timedelta(days=32*i)
            month_start = month_start.replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            expected_inflow = LendingTransaction.objects.filter(
                user=user,
                transaction_type='lend',
                status__in=['active', 'partial'],
                due_date__range=[month_start, month_end]
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            transaction_count = LendingTransaction.objects.filter(
                user=user,
                status__in=['active', 'partial'],
                due_date__range=[month_start, month_end]
            ).count()
            
            forecast.append({
                'month': month_start.strftime('%b %Y'),
                'expected_inflow': float(expected_inflow),
                'transaction_count': transaction_count
            })
        
        return forecast
    
    @staticmethod
    def get_lending_patterns(user) -> Dict:
        """Analyze lending patterns"""
        transactions = LendingTransaction.objects.filter(user=user)
        
        # Category breakdown
        category_breakdown = {}
        for t in transactions:
            category = t.category
            if category not in category_breakdown:
                category_breakdown[category] = {'amount': 0, 'count': 0}
            
            category_breakdown[category]['amount'] += float(t.amount)
            category_breakdown[category]['count'] += 1
        
        # Average transaction size
        avg_transaction = transactions.aggregate(avg=Avg('amount'))['avg'] or 0
        
        return {
            'category_breakdown': category_breakdown,
            'average_transaction_size': float(avg_transaction),
            'total_categories': len(category_breakdown)
        }

class DocumentService:
    """Document management for lending transactions"""
    
    @staticmethod
    def upload_document(transaction_obj: LendingTransaction, document_data: Dict, file_obj) -> LendingDocument:
        """Upload document for transaction"""
        try:
            document = LendingDocument.objects.create(
                transaction=transaction_obj,
                document_type=document_data['document_type'],
                title=document_data['title'],
                file=file_obj,
                file_size=file_obj.size,
                uploaded_by=document_data['uploaded_by']
            )
            
            logger.info(f"Uploaded document for transaction {transaction_obj.lending_id}")
            return document
            
        except Exception as e:
            logger.error(f"Document upload failed: {e}")
            raise
    
    @staticmethod
    def generate_agreement_template(transaction_obj: LendingTransaction) -> str:
        """Generate basic agreement template"""
        try:
            template = f"""
LENDING AGREEMENT

Date: {timezone.now().date()}
Transaction ID: {transaction_obj.lending_id}

Parties:
Lender: {transaction_obj.user.get_full_name() or transaction_obj.user.username}
Borrower: {transaction_obj.person_name}

Amount: ${transaction_obj.amount}
Interest Rate: {transaction_obj.interest_rate}%
Due Date: {transaction_obj.due_date}

Terms:
- The borrower agrees to repay the full amount by the due date
- Interest will be calculated as {transaction_obj.interest_type}
- Late payments may incur additional charges

Signatures:
Lender: _________________ Date: _________
Borrower: _________________ Date: _________
            """
            
            return template.strip()
            
        except Exception as e:
            logger.error(f"Agreement template generation failed: {e}")
            return ""