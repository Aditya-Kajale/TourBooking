from django.contrib import admin
from django.urls import include, path
from users import views as users_views
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('secure-admin-panel/', admin.site.urls),

    # Core APIs
    path('api/tours/', include('tours.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/guides/', include('guides.urls')),

    # Auth APIs
    path('api-auth/', include('rest_framework.urls')),
    path('api/me/', users_views.me),
    path('api/login/', users_views.login_view),
    path('api/register/', users_views.register_view),
    path('api/refresh-token/', users_views.token_refresh_view),
    path('api/logout/', users_views.logout_view),

    # OpenAPI Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(
            url_name='schema'),
        name='swagger-ui'),
]

# ✅ ADD THIS OUTSIDE the list
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
