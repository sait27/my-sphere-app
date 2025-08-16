from django.test import TestCase

# Create your tests here.

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth.models import User
from .models import List, ListItem, ListTemplate, ListCategory


class ListEndpointTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.category = ListCategory.objects.create(user=self.user, name='Test Category')
        self.list = List.objects.create(user=self.user, name='Test List', category=self.category)
        self.list_item = ListItem.objects.create(list=self.list, name='Test Item')
        self.template = ListTemplate.objects.create(user=self.user, name='Test Template')

    def test_get_lists(self):
        url = reverse('list-list-create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_list_analytics(self):
        url = reverse('list-analytics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_list_templates(self):
        url = reverse('list-templates')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_list_agenda(self):
        url = reverse('list-agenda')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

