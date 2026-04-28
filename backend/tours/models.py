from django.db import models
from django.conf import settings
import uuid

User = settings.AUTH_USER_MODEL

# Create your models here.
class Tour(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=100)
    date = models.DateField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    max_people = models.IntegerField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    category = models.CharField(max_length=50, default="Adventure")
    duration = models.CharField(max_length=50, blank=True, null=True)
    image = models.ImageField(upload_to='tour_images/', null=True, blank=True)
    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.image:
            self.optimize_image()

    def optimize_image(self):
        from PIL import Image
        from django.core.files.base import ContentFile
        import os
        from io import BytesIO

        try:
            img = Image.open(self.image.path)
            
            # Convert to RGB if necessary (e.g. for RGBA/PNG)
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Resize if too large
            output_size = (1200, 800)
            if img.width > 1200 or img.height > 800:
                img.thumbnail(output_size, Image.Resampling.LANCZOS)

            # Save optimized version back to the same path
            img.save(self.image.path, 'JPEG', quality=85, optimize=True)
        except Exception as e:
            print(f"Image optimization failed: {e}")
