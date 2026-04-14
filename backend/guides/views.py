from rest_framework import viewsets
from .models import Guide
from .serializers import GuideSerializer


class GuideViewSet(viewsets.ModelViewSet):
    queryset = Guide.objects.all()
    serializer_class = GuideSerializer
