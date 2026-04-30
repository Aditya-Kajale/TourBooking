import uuid
from django.db import models
from django.conf import settings


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE)
    tour = models.ForeignKey('tours.Tour', on_delete=models.CASCADE)
    rating = models.IntegerField(default=5)  # 1-5
    comment = models.TextField(blank=True)
    # Set to True for now, but allows admin to hide reviews
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review {self.id} for {self.tour}"
