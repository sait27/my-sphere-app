from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from lists.models import ListTemplate

class Command(BaseCommand):
    help = 'Create default public templates'

    def handle(self, *args, **options):
        # Get or create a system user for public templates
        system_user, created = User.objects.get_or_create(
            username='system',
            defaults={
                'email': 'system@mysphere.com',
                'first_name': 'System',
                'is_active': False
            }
        )

        # Default templates data
        default_templates = [
            {
                'name': 'Weekly Groceries',
                'description': 'Essential items for weekly grocery shopping',
                'category': 'shopping',
                'is_public': True,
                'use_count': 45
            },
            {
                'name': 'Daily Tasks',
                'description': 'Common daily tasks and reminders',
                'category': 'todo',
                'is_public': True,
                'use_count': 32
            },
            {
                'name': 'Travel Packing',
                'description': 'Essential items for travel packing',
                'category': 'travel',
                'is_public': True,
                'use_count': 28
            },
            {
                'name': 'Work Meeting Agenda',
                'description': 'Standard agenda items for work meetings',
                'category': 'work',
                'is_public': True,
                'use_count': 15
            },
            {
                'name': 'Home Cleaning Checklist',
                'description': 'Complete home cleaning tasks',
                'category': 'personal',
                'is_public': True,
                'use_count': 22
            },
            {
                'name': 'Workout Routine',
                'description': 'Basic workout exercises and routine',
                'category': 'health',
                'is_public': True,
                'use_count': 18
            }
        ]

        created_count = 0
        for template_data in default_templates:
            template, created = ListTemplate.objects.get_or_create(
                name=template_data['name'],
                user=system_user,
                defaults=template_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created template: {template.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} default templates')
        )
