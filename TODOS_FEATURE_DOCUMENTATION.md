# TODOS Feature Documentation

---

## 1. Overview

The TODOS feature in MY SPHERE is a comprehensive task management system that enables users to create, organize, track, and analyze their tasks, goals, subtasks, reminders, attachments, and more. It leverages AI for smart suggestions, natural language task creation, productivity insights, and advanced analytics. The feature is tightly integrated with other modules (lists, expenses) and supports collaboration, time tracking, and recurring tasks.

---

## 2. File Structure

### Backend (`backend/todos/`)
- `models.py`: Database models for tasks, goals, subtasks, reminders, attachments, tags, comments, time entries, activity logs, custom fields, AI insights, etc.
- `views.py`: DRF ViewSets for CRUD operations, analytics, AI actions, and advanced endpoints.
- `serializers.py`: DRF serializers for all models, including nested and computed fields.
- `urls.py`: Router and endpoint registration for all ViewSets.
- `ai_engine.py`: AI logic for task parsing, suggestions, insights, and integrations.
- `admin.py`: Django admin configuration for all models.
- `migrations/`: Database migrations.

### Frontend (`frontend/src/`)
- `hooks/useTodos.js`: Main React hook for all todos-related API calls and state management.
- `components/todos/`: UI components for todos (cards, modals, analytics, dashboards, templates, filters, etc.).
- `pages/TodosDashboard.jsx`, `AdvancedTodosPage.jsx`: Main pages for todos dashboard and analytics.

---

## 3. Functions & Descriptions (with Locations)

### Backend
#### `models.py`
- `Goal`: Long-term goals, tracks progress via associated tasks.
- `Task`: Core task model, supports priorities, status, types, AI fields, links to goals, lists, expenses.
- `Subtask`: Subtasks for tasks, supports completion and ordering.
- `TaskNote`: Notes for tasks, can be AI-generated.
- `TaskTemplate`: Reusable templates for tasks.
- `TaskAttachment`: File attachments for tasks.
- `TaskTag`, `TaskTagAssignment`: Tagging system for tasks.
- `TaskReminder`: Reminders for tasks (email, push, SMS, popup).
- `RecurringTaskTemplate`: Templates for recurring tasks.
- `TimeEntry`: Time tracking for tasks.
- `TaskComment`: Comments for collaboration.
- `TaskAssignment`: Assignments for collaboration.
- `TaskActivityLog`: Logs all task-related activities.
- `TaskCustomField`, `TaskCustomFieldValue`: Custom fields for tasks.
- `AIInsight`: Stores AI-generated insights and recommendations.

#### `views.py`
- `GoalViewSet`: CRUD for goals, AI insights for goals.
- `TaskViewSet`: CRUD for tasks, AI processing, natural language creation, dashboard stats, analytics, attachments, notes, suggestions.
- `TaskTemplateViewSet`: CRUD for templates, create tasks from templates.
- `AIInsightViewSet`: Read-only, dismiss/generate insights.
- `TaskNoteViewSet`: CRUD for notes.
- `TaskAttachmentViewSet`: CRUD for attachments.
- `TaskTagViewSet`: CRUD for tags, assign tags to tasks.
- `SubtaskViewSet`: CRUD for subtasks, toggle completion.
- `TimeEntryViewSet`: CRUD for time entries, start/stop timer.
- `TaskReminderViewSet`: CRUD for reminders.
- `RecurringTaskTemplateViewSet`: CRUD for recurring templates, generate tasks.
- `TaskCommentViewSet`: CRUD for comments.
- `TaskCustomFieldViewSet`: CRUD for custom fields.
- `TaskActivityLogViewSet`: Read-only activity logs.

#### `ai_engine.py`
- `AITaskEngine`: AI logic for priority scoring, suggestions, categorization, productivity insights, scheduling, expense integration, natural language parsing.

#### `serializers.py`
- Serializers for all models, including nested and computed fields (e.g., completion percentage, overdue status, time spent).

#### `urls.py`
- Registers all ViewSets with DRF router for RESTful API endpoints.

### Frontend
#### `hooks/useTodos.js`
- `fetchTodos`: Loads all todos, goals, tags, templates, recurring templates, custom fields.
- `createTodo`, `updateTodo`, `deleteTodo`, `toggleComplete`: CRUD for tasks.
- `createGoal`, `updateGoal`, `deleteGoal`: CRUD for goals.
- `getTasksByGoal`, `getCompletionStats`, `getPriorityStats`, `getOverdueTasks`, `getUpcomingTasks`: Analytics helpers.
- `createTag`, `updateTag`, `deleteTag`, `assignTagToTask`: Tag management.
- `createSubtask`, `updateSubtask`, `toggleSubtaskComplete`: Subtask management.
- `startTimer`, `stopTimer`, `addTimeEntry`: Time tracking.
- `addComment`: Add comments to tasks.
- `createReminder`: Add reminders to tasks.
- `createTemplate`, `createTaskFromTemplate`: Template management.
- `createRecurringTemplate`, `generateRecurringTasks`: Recurring tasks.
- `uploadAttachment`: File attachments.
- `createTaskFromNaturalLanguage`: Smart task creation from description.
- `getDashboardStats`, `getProductivityInsights`: Advanced analytics.

#### Components
- `TodoCard.jsx`, `CreateTodoModal.jsx`, `TodoFilters.jsx`, `TodosAnalytics.jsx`, `TodoTemplates.jsx`, `SmartAddTodo.jsx`, etc.: UI for displaying, creating, filtering, and analyzing todos.
- `Dashboard/`: Advanced analytics, AI assistant, heatmaps, trends.

---

## 4. Flow: Frontend to Backend

1. **User Action (Frontend)**: User interacts with UI (e.g., creates a task, marks complete, adds a subtask, uploads attachment).
2. **API Call (Frontend)**: `useTodos.js` sends HTTP request to backend endpoint (e.g., `/todos/tasks/`, `/todos/subtasks/`).
3. **Backend Processing**:
   - DRF ViewSet receives request, validates, processes, and interacts with models.
   - AI logic (if needed) is invoked via `ai_engine.py`.
   - Database is updated, related models (e.g., activity logs, tags, reminders) are updated.
4. **Response (Backend)**: Returns updated data (task, stats, analytics, errors) to frontend.
5. **State Update (Frontend)**: React hook updates local state/UI with new data.
6. **UI Feedback**: User sees changes reflected instantly (toast, dashboard, analytics).

---

## 5. Backend Functions/Views Not Executed by Frontend

- Some advanced analytics endpoints (e.g., `advanced_dashboard` in `TaskViewSet`) may not be called from frontend yet.
- AI integration endpoints (e.g., `AIInsightViewSet.generate_insights`, `GoalViewSet.generate_ai_insights`) may be admin/internal only.
- Some admin actions (e.g., direct model manipulation in `admin.py`) are not exposed to frontend.
- Certain custom field and activity log endpoints may be used only for internal tracking or admin dashboards.

---

## 6. Usage & Examples

### Creating a Task (Frontend)
```js
await createTodo({
  title: 'Finish documentation',
  description: 'Complete the todos feature docs',
  priority: 'high',
  due_date: '2025-08-30T17:00:00',
  task_type: 'work'
});
```

### Creating a Task from Natural Language
```js
await createTaskFromNaturalLanguage('Prepare slides for Monday meeting, urgent');
```

### Marking a Task Complete
```js
await toggleComplete(taskId);
```

### Adding a Subtask
```js
await createSubtask(parentTaskId, { title: 'Draft outline' });
```

### Assigning a Tag
```js
await assignTagToTask(tagId, taskId);
```

### Uploading an Attachment
```js
await uploadAttachment(taskId, file);
```

### Starting/Stopping Timer
```js
await startTimer(taskId);
await stopTimer(timeEntryId);
```

### Getting Analytics
```js
const stats = await getDashboardStats();
```

---

## 7. Known Bugs

- **AI Parsing Fallback**: If Gemini API fails, fallback parser may not extract all details accurately.
- **Attachment Uploads**: Large files or slow connections may cause upload failures.
- **Recurring Task Generation**: Edge cases in monthly/yearly recurrence may result in incorrect due dates.
- **Frontend State Sync**: Rapid actions (e.g., multiple quick edits) may cause temporary UI desync until next fetch.
- **Custom Fields**: Some custom field types may not render correctly in all UI components.
- **Time Tracking**: Timer may not stop if browser is closed unexpectedly.

---

## 8. Suggestions & Future Enhancements

- **Bulk Operations**: Add bulk edit/delete for tasks and subtasks.
- **Advanced AI**: Integrate more advanced AI models for task suggestions, prioritization, and productivity coaching.
- **Calendar Integration**: Sync tasks/reminders with external calendars (Google, Outlook).
- **Notifications**: Improve push/email/SMS notification reliability and customization.
- **Collaboration**: Add real-time collaboration, task assignment notifications, and team analytics.
- **Mobile Support**: Optimize UI and API for mobile devices and offline usage.
- **Custom Views**: Allow users to create custom dashboards and analytics views.
- **Bug Fixes**: Address known bugs, improve error handling and user feedback.

---

*Last updated: August 25, 2025*
