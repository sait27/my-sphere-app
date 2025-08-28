from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubscriptionViewSet, SubscriptionCategoryViewSet, SubscriptionAlertViewSet

router = DefaultRouter()
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'categories', SubscriptionCategoryViewSet, basename='subscription-category')
router.register(r'alerts', SubscriptionAlertViewSet, basename='subscription-alert')

urlpatterns = [
    path('', include(router.urls)),
]