import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from tours.models import Tour
from datetime import date, timedelta

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def guide_user(db):
    return User.objects.create_user(username='guide', password='password', is_guide=True)

@pytest.fixture
def regular_user(db):
    return User.objects.create_user(username='traveler', password='password', is_guide=False)

@pytest.fixture
def tour(db, guide_user):
    return Tour.objects.create(
        title='Sample Tour',
        location='Sample City',
        date=date.today() + timedelta(days=10),
        price=50,
        max_people=10,
        category='Relaxation',
        duration='3 hours',
        created_by=guide_user
    )

@pytest.mark.django_db
class TestTourViewSet:
    def test_list_tours_unauthenticated(self, api_client, tour):
        url = reverse('tours-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        # Check if tour is in response (DRF might return results key if paginated)
        data = response.data
        tours_list = data['results'] if 'results' in data else data
        assert len(tours_list) >= 1

    def test_create_tour_only_for_guides(self, api_client, regular_user):
        api_client.force_authenticate(user=regular_user)
        url = reverse('tours-list')
        data = {
            'title': 'New Tour',
            'location': 'New City',
            'date': (date.today() + timedelta(days=5)).isoformat(),
            'price': 100,
            'max_people': 5,
            'category': 'Culture',
            'duration': '1 day'
        }
        response = api_client.post(url, data)
        # Assuming we have a permission check or logic in viewset.
        # Let's check current viewset implementation if it restricts creation.
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_tour_only_by_author(self, api_client, guide_user, tour):
        another_guide = User.objects.create_user(username='another', password='password', is_guide=True)
        api_client.force_authenticate(user=another_guide)
        
        url = reverse('tours-detail', args=[tour.id])
        data = {'title': 'Updated Title'}
        response = api_client.patch(url, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        api_client.force_authenticate(user=guide_user)
        response = api_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Updated Title'
