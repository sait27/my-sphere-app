from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LendingTransactionViewSet, LendingCategoryViewSet, LendingDashboardView,
    ContactProfileViewSet, TransactionTemplateViewSet, PaymentPlanViewSet,
    NotificationRuleViewSet
)

router = DefaultRouter()
router.register(r'transactions', LendingTransactionViewSet, basename='lending-transactions')
router.register(r'categories', LendingCategoryViewSet, basename='lending-categories')
router.register(r'contacts', ContactProfileViewSet, basename='lending-contacts')
router.register(r'templates', TransactionTemplateViewSet, basename='lending-templates')
router.register(r'payment-plans', PaymentPlanViewSet, basename='lending-payment-plans')
router.register(r'notification-rules', NotificationRuleViewSet, basename='lending-notification-rules')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', LendingDashboardView.as_view(), name='lending-dashboard'),
]