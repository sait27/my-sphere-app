# Generated migration for enhanced lending features

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('lending', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ContactProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('relationship', models.CharField(choices=[('family', 'Family'), ('friend', 'Friend'), ('colleague', 'Colleague'), ('business', 'Business'), ('other', 'Other')], default='other', max_length=50)),
                ('reliability_score', models.FloatField(default=5.0)),
                ('preferred_contact_method', models.CharField(choices=[('email', 'Email'), ('phone', 'Phone'), ('sms', 'SMS'), ('whatsapp', 'WhatsApp')], default='email', max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('is_verified', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='TransactionTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('transaction_type', models.CharField(choices=[('lend', 'Lend'), ('borrow', 'Borrow')], max_length=10)),
                ('default_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('default_category', models.CharField(blank=True, max_length=100)),
                ('default_interest_rate', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('default_payment_method', models.CharField(blank=True, max_length=50)),
                ('use_count', models.IntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-use_count', 'name'],
            },
        ),
        migrations.CreateModel(
            name='PaymentPlan',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_installments', models.IntegerField()),
                ('installment_amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('frequency', models.CharField(choices=[('weekly', 'Weekly'), ('biweekly', 'Bi-weekly'), ('monthly', 'Monthly'), ('quarterly', 'Quarterly')], default='monthly', max_length=20)),
                ('start_date', models.DateField()),
                ('auto_reminder', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('transaction', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='payment_plan', to='lending.lendingtransaction')),
            ],
        ),
        migrations.CreateModel(
            name='PaymentInstallment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('installment_number', models.IntegerField()),
                ('due_date', models.DateField()),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('is_paid', models.BooleanField(default=False)),
                ('paid_date', models.DateField(blank=True, null=True)),
                ('paid_amount', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('payment_plan', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='installments', to='lending.paymentplan')),
            ],
            options={
                'ordering': ['installment_number'],
            },
        ),
        migrations.CreateModel(
            name='NotificationRule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('trigger_event', models.CharField(choices=[('due_date_approaching', 'Due Date Approaching'), ('payment_overdue', 'Payment Overdue'), ('payment_received', 'Payment Received'), ('transaction_created', 'Transaction Created')], max_length=50)),
                ('days_before', models.IntegerField(default=3)),
                ('notification_methods', models.JSONField(default=list)),
                ('message_template', models.TextField()),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='LendingDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document_type', models.CharField(choices=[('agreement', 'Agreement'), ('receipt', 'Receipt'), ('contract', 'Contract'), ('photo', 'Photo'), ('other', 'Other')], max_length=50)),
                ('title', models.CharField(max_length=200)),
                ('file', models.FileField(upload_to='lending_documents/')),
                ('file_size', models.IntegerField()),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('transaction', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documents', to='lending.lendingtransaction')),
                ('uploaded_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='paymentinstallment',
            unique_together={('payment_plan', 'installment_number')},
        ),
        migrations.AlterUniqueTogether(
            name='contactprofile',
            unique_together={('user', 'name')},
        ),
    ]