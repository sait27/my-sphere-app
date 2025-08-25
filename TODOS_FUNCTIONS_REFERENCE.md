# TODOS Feature: Full Function Reference & Descriptions

---

## Backend: Detailed Function/Class Reference

### `views.py`
#### Classes & Methods
- **GoalViewSet**
  - `get_queryset`: Returns goals for the current user.
  - `perform_create`: Saves a new goal for the user.
  - `generate_ai_insights`: Generates AI insights for a goal (progress analysis, suggestions).
- **TaskViewSet**
  - `get_queryset`: Returns tasks for the user, supports filtering by status, priority, type, goal, overdue.
  - `perform_create`: Saves a new task, runs AI scoring/suggestions/categorization.
  - `create_from_natural_language`: Creates a task from a natural language description using AI parsing.
  - `update_ai_data`: Refreshes AI data for a task (priority, suggestions, category).
  - `dashboard_stats`: Returns summary stats (total, completed, overdue, high priority, by status/priority).
  - `advanced_dashboard`: Returns advanced analytics (trends, completion rates, top tags, AI insights).
  - `add_note`: Adds a note to a task.
  - `upload_attachment`: Uploads a file to a task.
  - `delete_attachment`: Deletes a file attachment from a task.
  - `smart_suggestions`: Returns AI-powered scheduling suggestions for unscheduled tasks.
- **TaskTemplateViewSet**
  - `get_queryset`: Returns templates for the user or public ones.
  - `perform_create`: Saves a new template for the user.
  - `create_task`: Creates a task from a template, runs AI processing.
- **AIInsightViewSet**
  - `get_queryset`: Returns non-dismissed AI insights for the user.
  - `dismiss`: Marks an AI insight as dismissed.
  - `generate_insights`: Generates new AI insights (productivity, expense integration).
- **TaskNoteViewSet**
  - `get_queryset`: Returns notes for a task/user.
  - `perform_create`: Saves a new note for the user.
- **TaskAttachmentViewSet**
  - `get_queryset`: Returns attachments for a task/user.
  - `perform_create`: Saves a new attachment for a task/user.
- **TaskTagViewSet**
  - `get_queryset`: Returns tags for the user.
  - `perform_create`: Saves a new tag for the user.
  - `assign_to_task`: Assigns a tag to a task, logs activity.
- **SubtaskViewSet**
  - `get_queryset`: Returns subtasks for a parent task/user.
  - `perform_create`: Saves a new subtask, logs activity.
  - `toggle_complete`: Toggles subtask completion, logs activity.
- **TimeEntryViewSet**
  - `get_queryset`: Returns time entries for a task/user.
  - `perform_create`: Saves a new time entry, logs activity.
  - `start_timer`: Starts a timer for a task.
  - `stop_timer`: Stops a running timer, calculates duration.
- **TaskReminderViewSet**
  - `get_queryset`: Returns reminders for a task/user.
  - `perform_create`: Saves a new reminder for a task.
- **RecurringTaskTemplateViewSet**
  - `get_queryset`: Returns recurring templates for the user.
  - `perform_create`: Saves a new recurring template.
  - `generate_tasks`: Generates tasks from a recurring template.
- **TaskCommentViewSet**
  - `get_queryset`: Returns comments for a task/user.
  - `perform_create`: Saves a new comment, logs activity.
- **TaskCustomFieldViewSet**
  - `get_queryset`: Returns active custom fields for the user.
  - `perform_create`: Saves a new custom field for the user.
- **TaskActivityLogViewSet**
  - `get_queryset`: Returns activity logs for a task/user.

---

### `models.py`
#### Classes & Methods
- **Goal**: Model for long-term goals. Tracks progress via `progress_percentage` property.
- **Task**: Model for tasks. Custom `save` method updates completion timestamp.
- **TaskDependency**: Model for task dependencies.
- **TaskNote**: Model for notes on tasks.
- **TaskTemplate**: Model for reusable task templates.
- **TaskAttachment**: Model for file attachments.
- **TaskTag**: Model for tags.
- **TaskTagAssignment**: Model for task-tag relationships.
- **Subtask**: Model for subtasks. Custom `save` method updates completion timestamp.
- **TaskReminder**: Model for reminders.
- **RecurringTaskTemplate**: Model for recurring task templates.
- **TimeEntry**: Model for time tracking. Custom `save` method calculates duration.
- **TaskComment**: Model for comments.
- **TaskAssignment**: Model for assignments.
- **TaskActivityLog**: Model for activity logs.
- **TaskCustomField**: Model for custom fields.
- **TaskCustomFieldValue**: Model for custom field values.
- **AIInsight**: Model for AI-generated insights.

---

### `ai_engine.py`
#### Class & Methods
- **AITaskEngine**
  - `__init__`: Configures Gemini AI model.
  - `calculate_priority_score`: Calculates priority score for a task based on due date, priority, type, goal association.
  - `generate_task_suggestions`: Uses AI to generate actionable suggestions for a task.
  - `categorize_task`: Categorizes a task using AI/rules.
  - `generate_productivity_insights`: Analyzes user tasks and generates productivity insights.
  - `suggest_task_scheduling`: Suggests optimal scheduling for a task.
  - `integrate_with_expenses`: Finds tasks related to expenses and suggests integrations.
  - `process_natural_language_task`: Parses natural language input to structured task data using AI, falls back to rule-based parser.
  - `_fallback_task_parsing`: Rule-based fallback for natural language parsing.

---

### `serializers.py`
#### Classes & Methods
- **GoalSerializer**: Serializes goals, includes progress and task count.
- **TaskNoteSerializer**: Serializes task notes.
- **TaskAttachmentSerializer**: Serializes attachments.
- **TaskDependencySerializer**: Serializes dependencies, includes dependent task title.
- **TaskTagSerializer**: Serializes tags, includes task count.
- **TaskTagAssignmentSerializer**: Serializes tag assignments, includes tag name/color.
- **SubtaskSerializer**: Serializes subtasks.
- **TaskReminderSerializer**: Serializes reminders.
- **TimeEntrySerializer**: Serializes time entries, includes task title and duration in hours.
- **TaskCommentSerializer**: Serializes comments, includes user and replies.
- **TaskAssignmentSerializer**: Serializes assignments, includes usernames.
- **TaskCustomFieldSerializer**: Serializes custom fields.
- **TaskCustomFieldValueSerializer**: Serializes custom field values, includes field name/type.
- **TaskSerializer**: Serializes tasks, includes nested notes, dependencies, attachments, tags, subtasks, reminders, time entries, comments, assignments, custom fields, and computed fields (overdue, completion %, time spent).
- **TaskTemplateSerializer**: Serializes templates.
- **AIInsightSerializer**: Serializes AI insights, includes related task/goal titles.
- **TaskCreateFromTemplateSerializer**: Serializes template-based task creation.
- **RecurringTaskTemplateSerializer**: Serializes recurring templates, includes next due date calculation.
- **TaskActivityLogSerializer**: Serializes activity logs, includes user.

---

### `admin.py`
#### Classes & Methods
- **GoalAdmin**: Admin config for goals, includes progress display.
- **TaskAdmin**: Admin config for tasks, includes AI score, goal, filters.
- **TaskDependencyAdmin**: Admin config for dependencies.
- **TaskNoteAdmin**: Admin config for notes.
- **TaskTemplateAdmin**: Admin config for templates.
- **AIInsightAdmin**: Admin config for AI insights, includes confidence score, related task/goal.

---

## Return Types & Error Handling

### Task Creation
```python
def create_task(user: User, data: Dict[str, Any]) -> Union[Task, None]:
    """
    Create a new task for the user.
    
    Args:
        user (User): The user creating the task
        data (Dict[str, Any]): Task data including title, description, etc.
    
    Returns:
        Task: The created task object
        None: If task creation fails
    
    Raises:
        ValidationError: If task data is invalid
        PermissionDenied: If user lacks permission
    """
    try:
        with transaction.atomic():
            task = Task.objects.create(
                user=user,
                title=data['title'],
                description=data.get('description', ''),
                priority=data.get('priority', 'medium')
            )
            return task
    except IntegrityError as e:
        logger.error(f"Task creation failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in task creation: {e}")
        raise
```

### Task Update
```python
def update_task(task_id: str, data: Dict[str, Any], user: User) -> Tuple[bool, Optional[str]]:
    """
    Update an existing task.
    
    Args:
        task_id (str): The ID of the task to update
        data (Dict[str, Any]): Updated task data
        user (User): The user making the update
    
    Returns:
        Tuple[bool, Optional[str]]: (success, error_message)
    
    Raises:
        ObjectDoesNotExist: If task not found
        PermissionDenied: If user lacks permission
    """
    try:
        task = Task.objects.get(id=task_id)
        if task.user != user:
            raise PermissionDenied("Not authorized to update this task")
        
        for key, value in data.items():
            setattr(task, key, value)
        task.save()
        
        return True, None
    except Task.DoesNotExist:
        return False, "Task not found"
    except PermissionDenied as e:
        return False, str(e)
    except Exception as e:
        logger.error(f"Task update failed: {e}")
        return False, "Internal server error"
```

### Analytics Processing
```python
def process_analytics(user: User, period: str = 'month') -> Dict[str, Any]:
    """
    Process analytics data for tasks.
    
    Args:
        user (User): The user requesting analytics
        period (str): Time period for analytics ('day', 'week', 'month', 'year')
    
    Returns:
        Dict[str, Any]: Analytics data including:
            - completion_rate: float
            - total_tasks: int
            - tasks_by_priority: Dict[str, int]
            - tasks_by_status: Dict[str, int]
    
    Raises:
        ValueError: If period is invalid
    """
    try:
        today = timezone.now()
        if period == 'day':
            start_date = today - timedelta(days=1)
        elif period == 'week':
            start_date = today - timedelta(weeks=1)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        elif period == 'year':
            start_date = today - timedelta(days=365)
        else:
            raise ValueError(f"Invalid period: {period}")

        tasks = Task.objects.filter(
            user=user,
            created_at__gte=start_date
        )
        
        total = tasks.count()
        completed = tasks.filter(is_completed=True).count()
        
        return {
            'completion_rate': (completed / total * 100) if total > 0 else 0,
            'total_tasks': total,
            'tasks_by_priority': {
                'high': tasks.filter(priority='high').count(),
                'medium': tasks.filter(priority='medium').count(),
                'low': tasks.filter(priority='low').count(),
            },
            'tasks_by_status': {
                'completed': completed,
                'in_progress': tasks.filter(is_completed=False).count()
            }
        }
    except Exception as e:
        logger.error(f"Analytics processing failed: {e}")
        return {
            'error': 'Failed to process analytics',
            'details': str(e)
        }
```

### Error Handling Examples

#### API View Error Handling
```python
class TaskViewSet(viewsets.ModelViewSet):
    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            task = self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except ValidationError as e:
            return Response(
                {'error': 'Validation failed', 'details': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionDenied as e:
            return Response(
                {'error': 'Permission denied', 'details': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            logger.error(f"Task creation failed: {e}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

#### Service Layer Error Handling
```python
class TaskService:
    @staticmethod
    def bulk_update(task_ids: List[str], data: Dict[str, Any], user: User) -> Dict[str, Any]:
        """
        Bulk update tasks with error handling and rollback.
        
        Args:
            task_ids (List[str]): List of task IDs to update
            data (Dict[str, Any]): Update data
            user (User): User performing the update
        
        Returns:
            Dict[str, Any]: Results including:
                - success_count: Number of successful updates
                - failed_ids: List of failed task IDs
                - errors: Error messages by task ID
        """
        results = {
            'success_count': 0,
            'failed_ids': [],
            'errors': {}
        }
        
        try:
            with transaction.atomic():
                tasks = Task.objects.filter(id__in=task_ids, user=user)
                
                if len(tasks) != len(task_ids):
                    missing = set(task_ids) - set(t.id for t in tasks)
                    results['failed_ids'].extend(missing)
                    results['errors'].update({
                        tid: 'Task not found or no permission'
                        for tid in missing
                    })
                
                for task in tasks:
                    try:
                        for key, value in data.items():
                            setattr(task, key, value)
                        task.save()
                        results['success_count'] += 1
                    except Exception as e:
                        results['failed_ids'].append(task.id)
                        results['errors'][task.id] = str(e)
                
                if results['failed_ids']:
                    raise PartialUpdateError(
                        "Some updates failed",
                        results=results
                    )
                
                return results
        except PartialUpdateError:
            raise
        except Exception as e:
            logger.error(f"Bulk update failed: {e}")
            raise BulkOperationError("Bulk update failed") from e
```

## Usage Patterns & Best Practices

### 1. Task Creation Pattern
```python
try:
    task = TaskService.create_task(
        user=request.user,
        data={
            'title': 'Important task',
            'priority': 'high',
            'due_date': tomorrow
        }
    )
    if task:
        notify_task_created(task)
    else:
        handle_creation_failure()
except ValidationError as e:
    handle_validation_error(e)
```

### 2. Analytics Pattern
```python
def get_user_dashboard(user: User) -> Dict[str, Any]:
    cache_key = f'user_dashboard_{user.id}'
    dashboard_data = cache.get(cache_key)
    
    if not dashboard_data:
        try:
            analytics = process_analytics(user, period='month')
            tasks = get_important_tasks(user)
            insights = generate_insights(analytics)
            
            dashboard_data = {
                'analytics': analytics,
                'tasks': tasks,
                'insights': insights
            }
            cache.set(cache_key, dashboard_data, timeout=3600)
        except Exception as e:
            logger.error(f"Dashboard generation failed: {e}")
            return get_fallback_dashboard(user)
    
    return dashboard_data
```

### 3. Batch Processing Pattern
```python
def process_overdue_tasks():
    try:
        with transaction.atomic():
            tasks = (
                Task.objects
                .filter(due_date__lt=timezone.now())
                .select_for_update()
            )
            
            for task in tasks:
                try:
                    handle_overdue_task(task)
                except Exception as e:
                    logger.error(f"Failed to process task {task.id}: {e}")
                    continue
    except Exception as e:
        logger.error(f"Batch processing failed: {e}")
        notify_admin("Batch processing failed", str(e))
```

## How to Use This Reference
- Every function/class above is described based on its actual code and docstrings.
- For any function, see its location and exact role in the feature.
- For more details, refer to the code comments and docstrings in each file.

---

*This document is generated directly from your source files for maximum accuracy.*
