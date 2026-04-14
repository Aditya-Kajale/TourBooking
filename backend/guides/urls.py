from rest_framework.routers import DefaultRouter
from .views import GuideViewSet

router = DefaultRouter()
router.register(r'guides', GuideViewSet)

urlpatterns = router.urls
