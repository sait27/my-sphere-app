from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GoalViewSet, TaskViewSet, TaskTemplateViewSet, AIInsightViewSet, TaskNoteViewSet, TaskAttachmentViewSet,
    TaskTagViewSet, SubtaskViewSet, TimeEntryViewSet, TaskReminderViewSet, RecurringTaskTemplateViewSet,
    TaskCommentViewSet, TaskActivityLogViewSet, TaskCustomFieldViewSet
)

router = DefaultRouter()
router.register(r'goals', GoalViewSet, basename='goal')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'templates', TaskTemplateViewSet, basename='tasktemplate')
router.register(r'insights', AIInsightViewSet, basename='aiinsight')
router.register(r'notes', TaskNoteViewSet, basename='tasknote')
router.register(r'attachments', TaskAttachmentViewSet, basename='taskattachment')
router.register(r'tags', TaskTagViewSet, basename='tasktag')
router.register(r'subtasks', SubtaskViewSet, basename='subtask')
router.register(r'time-entries', TimeEntryViewSet, basename='timeentry')
router.register(r'reminders', TaskReminderViewSet, basename='taskreminder')
router.register(r'recurring-templates', RecurringTaskTemplateViewSet, basename='recurringtasktemplate')
router.register(r'comments', TaskCommentViewSet, basename='taskcomment')
router.register(r'activity-logs', TaskActivityLogViewSet, basename='taskactivitylog')
router.register(r'custom-fields', TaskCustomFieldViewSet, basename='taskcustomfield')

urlpatterns = [
    path('', include(router.urls)),
]
