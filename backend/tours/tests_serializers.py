import pytest
import io
from PIL import Image
from datetime import date, timedelta
from django.core.files.uploadedfile import SimpleUploadedFile
from tours.serializers import TourSerializer

def generate_image(size=(10, 10), format='JPEG'):
    buf = io.BytesIO()
    img = Image.new('RGB', size)
    img.save(buf, format=format)
    return buf.getvalue()

@pytest.mark.django_db
class TestTourSerializer:
    def test_tour_date_cannot_be_in_past(self):
        data = {
            'title': 'Test Tour',
            'location': 'Test Location',
            'date': date.today() - timedelta(days=1),
            'price': 100,
            'max_people': 10,
            'category': 'Adventure',
            'duration': '2 hours'
        }
        serializer = TourSerializer(data=data)
        assert not serializer.is_valid()
        assert 'date' in serializer.errors

    def test_tour_image_size_validation(self):
        # Create a valid image but pad it to be over 5MB
        valid_img = generate_image()
        large_content = valid_img + b"0" * (6 * 1024 * 1024)
        large_file = SimpleUploadedFile("large.jpg", large_content, content_type="image/jpeg")
        
        data = {
            'title': 'Test Tour',
            'location': 'Test Location',
            'date': date.today() + timedelta(days=1),
            'price': 100,
            'max_people': 10,
            'category': 'Adventure',
            'duration': '2 hours',
            'image': large_file
        }
        serializer = TourSerializer(data=data)
        assert not serializer.is_valid()
        assert 'image' in serializer.errors
        assert "5MB" in str(serializer.errors['image'][0])

    def test_tour_image_format_validation(self):
        # Create a file with valid image bytes but rename it to .txt (though ImageField checks content)
        # Actually, my serializer checks the extension too.
        # Let's create a valid image but with a blocked extension.
        valid_img = generate_image()
        invalid_file = SimpleUploadedFile("test.gif", valid_img, content_type="image/gif")
        
        data = {
            'title': 'Test Tour',
            'location': 'Test Location',
            'date': date.today() + timedelta(days=1),
            'price': 100,
            'max_people': 10,
            'category': 'Adventure',
            'duration': '2 hours',
            'image': invalid_file
        }
        serializer = TourSerializer(data=data)
        assert not serializer.is_valid()
        assert 'image' in serializer.errors
        assert "Unsupported image format" in str(serializer.errors['image'][0])
