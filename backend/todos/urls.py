from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GoalViewSet, TaskViewSet, TaskTemplateViewSet, AIInsightViewSet, TaskNoteViewSet

router = DefaultRouter()
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'templates', TaskTemplateViewSet, basename='tasktemplate')
router.register(r'insights', AIInsightViewSet, basename='aiinsight')
router.register(r'notes', TaskNoteViewSet, basename='tasknote')

urlpatterns = [
    path('', include(router.urls)),
]
