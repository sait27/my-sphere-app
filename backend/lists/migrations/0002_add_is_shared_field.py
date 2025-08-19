# Generated manually

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('lists', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='list',
            name='is_shared',
            field=models.BooleanField(default=False),
        ),
    ]
