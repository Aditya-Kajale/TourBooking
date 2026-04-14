from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, BasePermission
from rest_framework.authentication import SessionAuthentication, BasicAuthentication, BaseAuthentication
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Tour
from .serializers import TourSerializer

class DevHeaderAuthentication(BaseAuthentication):
    """
    Custom authentication to trust X-DEV-USER header in local development.
    Bypasses SessionAuthentication (and its CSRF constraint) if present.
    """
    def authenticate(self, request):
        if not settings.DEBUG:
            return None
        dev_user = request.META.get('HTTP_X_DEV_USER')
        if not dev_user:
            return None
            
        User = get_user_model()
        try:
            user = User.objects.get(pk=dev_user)
            return (user, None)
        except Exception:
            try:
                user = User.objects.get(username=dev_user)
                return (user, None)
            except Exception:
                pass
        return None


class DevHeaderAllowCreatePermission(BasePermission):
    """Allow all methods if X-DEV-USER header present in DEBUG mode, otherwise use IsAuthenticatedOrReadOnly."""
    def has_permission(self, request, view):
        if settings.DEBUG and request.META.get('HTTP_X_DEV_USER'):
            return True
        return IsAuthenticatedOrReadOnly().has_permission(request, view)


class IsOwnerOrReadOnly(BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
            
        user = request.user
        
        # We rely on DevHeaderAuthentication or SessionAuthentication to set user.
        if user and user.is_authenticated:
            return str(obj.created_by.id) == str(user.id)
            
        return False


class TourViewSet(viewsets.ModelViewSet):
    serializer_class = TourSerializer
    permission_classes = [DevHeaderAllowCreatePermission, IsOwnerOrReadOnly]
    authentication_classes = [DevHeaderAuthentication, SessionAuthentication, BasicAuthentication]

    def get_queryset(self):
        queryset = Tour.objects.all().order_by('-created_at')
        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(date=date_param)
        return queryset



    def perform_create(self, serializer):
        # DEBUG: log CSRF header and cookie to help diagnose missing-token issues
        try:
            csrf_header = self.request.META.get('HTTP_X_CSRFTOKEN')
            csrf_cookie = self.request.COOKIES.get('csrftoken')
            dev_user = self.request.META.get('HTTP_X_DEV_USER')
            print(f"[DEBUG] Tour create CSRF header={csrf_header!r} cookie={csrf_cookie!r} dev_user={dev_user!r} user={getattr(self.request.user, 'username', None)}")
        except Exception:
            pass

        # If a dev header is present and request.user is anonymous, resolve user and save as creator
        if not self.request.user or not self.request.user.is_authenticated:
            dev_user = self.request.META.get('HTTP_X_DEV_USER')
            if dev_user:
                User = get_user_model()
                try:
                    # try by id first
                    creator = User.objects.get(pk=dev_user)
                except Exception:
                    try:
                        creator = User.objects.get(username=dev_user)
                    except Exception:
                        creator = None
                if creator:
                    return serializer.save(created_by=creator)

        return serializer.save(created_by=self.request.user)