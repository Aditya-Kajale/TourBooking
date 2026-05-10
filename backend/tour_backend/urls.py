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

    # Admin APIs
    path('api/admin/guide-applications/', users_views.GuideVerificationAdminViewSet.as_view({'get': 'list'})),
    path('api/admin/guide-applications/<uuid:pk>/', users_views.GuideVerificationAdminViewSet.as_view({'get': 'retrieve'})),
    path('api/admin/guide-applications/<uuid:pk>/verify/', users_views.GuideVerificationAdminViewSet.as_view({'post': 'verify'})),

    # Auth APIs
    path('api-auth/', include('rest_framework.urls')),
    path('api/me/', users_views.me),
    path('api/login/', users_views.login_view),
    path('api/register/', users_views.register_view),
    path('api/refresh-token/', users_views.token_refresh_view),
    path('api/logout/', users_views.logout_view),
    path('api/verify-email/', users_views.verify_email_view),
    path('api/resend-verification-email/', users_views.resend_verification_email_view),
    path('api/check-username/', users_views.check_username_availability_view),
    path('api/check-email/', users_views.check_email_availability_view),
    path('api/request-password-reset/', users_views.request_password_reset_view),
    path('api/confirm-password-reset/', users_views.confirm_password_reset_view),
    
    # 2FA APIs
    path('api/2fa/setup/', users_views.get_2fa_setup),
    path('api/2fa/enable/', users_views.enable_2fa),
    path('api/2fa/disable/', users_views.disable_2fa),
    path('api/2fa/status/', users_views.get_2fa_status),
    path('api/2fa/verify/', users_views.verify_2fa_code),

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
