# integrations/calendar_service.py
import os
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from django.utils import timezone
from .models import GoogleCalendarToken
from todos.models import Task, Goal
import logging

logger = logging.getLogger(__name__)

class GoogleCalendarService:
    def __init__(self, user):
        self.user = user
        self.service = None
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialize Google Calendar service with user credentials"""
        try:
            token = GoogleCalendarToken.objects.get(user=self.user)
            credentials = Credentials(
                token=token.access_token,
                refresh_token=token.refresh_token,
                token_uri='https://oauth2.googleapis.com/token',
                client_id=os.environ.get('GOOGLE_CLIENT_ID'),
                client_secret=os.environ.get('GOOGLE_CLIENT_SECRET')
            )
            
            # Refresh token if expired
            if credentials.expired:
                credentials.refresh(Request())
                token.access_token = credentials.token
                token.expires_at = credentials.expiry
                token.save()
            
            self.service = build('calendar', 'v3', credentials=credentials)
            
        except GoogleCalendarToken.DoesNotExist:
            logger.error(f"No Google Calendar token found for user {self.user.id}")
        except Exception as e:
            logger.error(f"Error initializing Google Calendar service: {e}")
    
    def get_calendars(self):
        """Get list of user's calendars"""
        if not self.service:
            return []
        
        try:
            calendar_list = self.service.calendarList().list().execute()
            return calendar_list.get('items', [])
        except HttpError as e:
            logger.error(f"Error fetching calendars: {e}")
            return []
    
    def create_task_event(self, task, calendar_id='primary'):
        """Create a calendar event for a task"""
        if not self.service:
            return None
        
        try:
            # Prepare event data
            event_data = {
                'summary': f"📋 {task.title}",
                'description': self._format_task_description(task),
                'colorId': self._get_priority_color(task.priority),
            }
            
            # Set event time based on task due date or scheduled time
            if task.scheduled_for:
                start_time = task.scheduled_for
                end_time = start_time + timedelta(minutes=task.estimated_duration or 60)
                event_data.update({
                    'start': {'dateTime': start_time.isoformat(), 'timeZone': 'UTC'},
                    'end': {'dateTime': end_time.isoformat(), 'timeZone': 'UTC'},
                })
            elif task.due_date:
                # All-day event for due date
                due_date = task.due_date.date()
                event_data.update({
                    'start': {'date': due_date.isoformat()},
                    'end': {'date': (due_date + timedelta(days=1)).isoformat()},
                })
            else:
                return None
            
            # Add reminders
            event_data['reminders'] = {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 30},
                    {'method': 'email', 'minutes': 60}
                ]
            }
            
            # Create the event
            event = self.service.events().insert(
                calendarId=calendar_id,
                body=event_data
            ).execute()
            
            return event
            
        except HttpError as e:
            logger.error(f"Error creating calendar event for task {task.id}: {e}")
            return None
    
    def update_task_event(self, task, event_id, calendar_id='primary'):
        """Update existing calendar event for a task"""
        if not self.service:
            return None
        
        try:
            # Get existing event
            event = self.service.events().get(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            
            # Update event data
            event['summary'] = f"📋 {task.title}"
            event['description'] = self._format_task_description(task)
            event['colorId'] = self._get_priority_color(task.priority)
            
            # Update timing if changed
            if task.scheduled_for:
                start_time = task.scheduled_for
                end_time = start_time + timedelta(minutes=task.estimated_duration or 60)
                event['start'] = {'dateTime': start_time.isoformat(), 'timeZone': 'UTC'}
                event['end'] = {'dateTime': end_time.isoformat(), 'timeZone': 'UTC'}
            elif task.due_date:
                due_date = task.due_date.date()
                event['start'] = {'date': due_date.isoformat()}
                event['end'] = {'date': (due_date + timedelta(days=1)).isoformat()}
            
            # Update the event
            updated_event = self.service.events().update(
                calendarId=calendar_id,
                eventId=event_id,
                body=event
            ).execute()
            
            return updated_event
            
        except HttpError as e:
            logger.error(f"Error updating calendar event {event_id}: {e}")
            return None
    
    def delete_task_event(self, event_id, calendar_id='primary'):
        """Delete calendar event for a task"""
        if not self.service:
            return False
        
        try:
            self.service.events().delete(
                calendarId=calendar_id,
                eventId=event_id
            ).execute()
            return True
            
        except HttpError as e:
            logger.error(f"Error deleting calendar event {event_id}: {e}")
            return False
    
    def sync_tasks_to_calendar(self, calendar_id='primary', days_ahead=30):
        """Sync upcoming tasks to Google Calendar"""
        if not self.service:
            return {'success': False, 'error': 'Service not initialized'}
        
        try:
            # Get tasks with due dates or scheduled times in the next 30 days
            end_date = timezone.now() + timedelta(days=days_ahead)
            tasks = Task.objects.filter(
                user=self.user,
                status__in=['pending', 'in_progress'],
            ).filter(
                models.Q(due_date__lte=end_date) | 
                models.Q(scheduled_for__lte=end_date)
            ).exclude(
                models.Q(due_date__isnull=True) & 
                models.Q(scheduled_for__isnull=True)
            )
            
            synced_count = 0
            errors = []
            
            for task in tasks:
                # Check if event already exists (you might want to store event_id in task model)
                event = self.create_task_event(task, calendar_id)
                if event:
                    synced_count += 1
                    # Store event ID in task for future updates
                    task.calendar_event_id = event['id']
                    task.save()
                else:
                    errors.append(f"Failed to sync task: {task.title}")
            
            return {
                'success': True,
                'synced_count': synced_count,
                'errors': errors
            }
            
        except Exception as e:
            logger.error(f"Error syncing tasks to calendar: {e}")
            return {'success': False, 'error': str(e)}
    
    def _format_task_description(self, task):
        """Format task description for calendar event"""
        description_parts = []
        
        if task.description:
            description_parts.append(task.description)
        
        description_parts.extend([
            f"Priority: {task.get_priority_display()}",
            f"Type: {task.get_task_type_display()}",
            f"Status: {task.get_status_display()}"
        ])
        
        if task.goal:
            description_parts.append(f"Goal: {task.goal.title}")
        
        if task.estimated_duration:
            description_parts.append(f"Estimated Duration: {task.estimated_duration} minutes")
        
        if task.ai_suggestions:
            description_parts.append(f"AI Suggestions: {task.ai_suggestions}")
        
        return "\n".join(description_parts)
    
    def _get_priority_color(self, priority):
        """Map task priority to Google Calendar color"""
        color_map = {
            'low': '2',      # Green
            'medium': '5',   # Yellow
            'high': '11',    # Red
            'urgent': '4'    # Orange
        }
        return color_map.get(priority, '1')  # Default blue