import uuid
from django.db import models


class Guide(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    avatar = models.URLField(blank=True)
    rating = models.FloatField(default=5.0)
    reviews = models.IntegerField(default=0)

    def __str__(self):
        return self.name
