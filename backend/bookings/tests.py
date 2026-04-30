import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from tours.models import Tour
from bookings.models import Booking
from datetime import date, timedelta

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def regular_user(db):
    return User.objects.create_user(username='traveler', password='password')

@pytest.fixture
def tour(db):
    guide = User.objects.create_user(username='guide', password='password', is_guide=True)
    return Tour.objects.create(
        title='Sample Tour',
        location='Sample City',
        date=date.today() + timedelta(days=10),
        price=50,
        max_people=10,
        category='Relaxation',
        duration='3 hours',
        created_by=guide
    )

@pytest.mark.django_db
class TestBookingViewSet:
    def test_create_booking_success(self, api_client, regular_user, tour):
        api_client.force_authenticate(user=regular_user)
        url = reverse('bookings-list')
        data = {
            'tour': tour.id,
            'participants': 5,
            'date': tour.date.isoformat()
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Booking.objects.count() == 1

    def test_create_booking_over_capacity(self, api_client, regular_user, tour):
        api_client.force_authenticate(user=regular_user)
        # Create an initial booking of 8 people
        Booking.objects.create(user=regular_user, tour=tour, participants=8, total_price=400, date=tour.date)
        
        url = reverse('bookings-list')
        data = {
            'tour': tour.id,
            'participants': 3, # 8 + 3 = 11 > 10 max_people
            'date': tour.date.isoformat()
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'participants' in response.data.get('validation_errors', response.data) or 'detail' in response.data
