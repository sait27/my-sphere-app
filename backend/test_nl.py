#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysphere_core.settings')
django.setup()

from todos.ai_engine import AITaskEngine
from django.contrib.auth.models import User

# Test the natural language processing
def test_nl_processing():
    try:
        # Get or create a test user
        user, created = User.objects.get_or_create(username='testuser')
        
        # Test the AI engine
        ai_engine = AITaskEngine()
        text = "movie at 11:30 in revathi theatre"
        
        print(f"Testing text: {text}")
        result = ai_engine.process_natural_language_task(user, text)
        print(f"Result: {result}")
        
        # Test task creation data
        task_data = {
            'title': result['title'],
            'description': result['description'],
            'priority': result['priority'],
            'task_type': result['task_type'],
            'estimated_duration': result.get('estimated_duration'),
        }
        
        if result.get('due_date'):
            task_data['due_date'] = result['due_date']
            
        print(f"Task data: {task_data}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_nl_processing()
