import json
import logging
from datetime import timedelta

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login as django_login
from django.middleware.csrf import get_token
from django.contrib.auth import logout as django_logout
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST
from django.utils import timezone
from django.conf import settings
from rest_framework.authtoken.models import Token
from .email_service import EmailService
from .models import EmailVerificationToken

logger = logging.getLogger(__name__)

# ── Helpers ─────────────────────────────────────────────────────────────

TOKEN_EXPIRY_HOURS = getattr(settings, 'AUTH_TOKEN_EXPIRY_HOURS', 72)


def _is_token_expired(token: Token) -> bool:
    """Return True when the token is older than TOKEN_EXPIRY_HOURS."""
    if TOKEN_EXPIRY_HOURS <= 0:
        return False
    return timezone.now() > token.created + timedelta(hours=TOKEN_EXPIRY_HOURS)


def _rotate_token(user) -> Token:
    """Delete existing token (if any) and create a fresh one."""
    Token.objects.filter(user=user).delete()
    return Token.objects.create(user=user)


def _user_payload(user, token_key: str, csrf_token: str) -> dict:
    """Standard JSON payload returned after successful auth."""
    profile_pic_url = None
    if user.profile_pic:
        profile_pic_url = user.profile_pic.url
    return {
        'id': str(user.id),
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'phone': user.phone,
        'profile_pic': profile_pic_url,
        'email_verified': user.email_verified,
        'is_guide': getattr(user, 'is_guide', False),
        'guide_verification_status': getattr(user, 'guide_verification_status', 'not_requested'),
        'csrfToken': csrf_token,
        'token': token_key,
        'token_expiry_hours': TOKEN_EXPIRY_HOURS,
    }


def _parse_json_body(request) -> dict:
    """Safely parse JSON from request body, falling back to POST dict."""
    data = {}
    try:
        if request.body:
            data = json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        pass

    # merge form-encoded body (if any)
    if hasattr(request, 'POST'):
        for k, v in request.POST.items():
            if k not in data:
                data[k] = v
    return data


# ── Endpoints ───────────────────────────────────────────────────────────

def me(request):
    """Return current authenticated user info, or 401."""
    user = request.user
    if user and user.is_authenticated:
        profile_pic_url = None
        if user.profile_pic:
            profile_pic_url = user.profile_pic.url
        return JsonResponse({
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'profile_pic': profile_pic_url,
            'email_verified': user.email_verified,
            'is_guide': getattr(user, 'is_guide', False),
            'guide_verification_status': getattr(user, 'guide_verification_status', 'not_requested'),
        })
    return JsonResponse({'detail': 'Not authenticated'}, status=401)


@csrf_exempt
def login_view(request):
    """Authenticate with username + password, return token + CSRF cookie."""
    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    data = _parse_json_body(request)
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return JsonResponse(
            {'detail': 'Username and password are required.'}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        # Intentionally vague to prevent user-enumeration attacks
        logger.warning(
            'Failed login attempt for username=%s ip=%s',
            username,
            request.META.get('REMOTE_ADDR'))
        return JsonResponse(
            {'detail': 'Invalid username or password.'}, status=401)

    if not user.is_active:
        return JsonResponse(
            {'detail': 'This account has been deactivated.'}, status=403)

    django_login(request, user)

    # Rotate token on every login for security
    token = _rotate_token(user)
    csrf_token = get_token(request)

    logger.info('Successful login user=%s', user.username)

    resp = JsonResponse(_user_payload(user, token.key, csrf_token))
    resp.set_cookie(
        'csrftoken', csrf_token,
        httponly=False,
        samesite='Lax',
        secure=request.is_secure(),
    )
    return resp


@csrf_exempt
@require_POST
def register_view(request):
    """Create a new user account and return an auth token."""
    data = request.POST.dict()  # Use POST data for form fields
    files = request.FILES

    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    email = (data.get('email') or '').strip()
    first_name = (data.get('first_name') or '').strip()
    last_name = (data.get('last_name') or '').strip()
    phone = (data.get('phone') or '').strip()
    profile_pic = files.get('profile_pic')

    # ── Validation ─────────────────────────────────────────────────
    errors = {}
    if not username:
        errors['username'] = 'Username is required.'
    elif len(username) < 3:
        errors['username'] = 'Username must be at least 3 characters.'

    if not password:
        errors['password'] = 'Password is required.'
    elif len(password) < 8:
        errors['password'] = 'Password must be at least 8 characters.'

    if not first_name:
        errors['first_name'] = 'First name is required.'

    if not last_name:
        errors['last_name'] = 'Last name is required.'

    if not phone:
        errors['phone'] = 'Phone number is required.'

    if errors:
        return JsonResponse({'detail': errors}, status=400)

    User = get_user_model()
    if User.objects.filter(username=username).exists():
        return JsonResponse({'detail': 'Username already exists.'}, status=409)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name)
    user.phone = phone
    # is_guide remains False by default; guides are verified separately
    if profile_pic:
        user.profile_pic = profile_pic
    user.save()

    # Create and send email verification token
    token_string = EmailVerificationToken.generate_token()
    EmailVerificationToken.objects.create(
        user=user,
        token=token_string,
        expires_at=timezone.now() + timedelta(hours=24)
    )

    # Send verification email asynchronously in production (use Celery)
    # For now, send synchronously
    email_sent = EmailService.send_verification_email(
        user_email=user.email,
        token=token_string,
        user_name=user.first_name
    )

    token = Token.objects.create(user=user)
    csrf_token = get_token(request)

    logger.info(
        'New user registered username=%s email_sent=%s',
        username,
        email_sent)

    resp = JsonResponse(_user_payload(user, token.key, csrf_token), status=201)
    resp.set_cookie(
        'csrftoken', csrf_token,
        httponly=False,
        samesite='Lax',
        secure=request.is_secure(),
    )
    return resp


@csrf_exempt
@require_POST
def token_refresh_view(request):
    """
    Refresh an expired or near-expiry auth token.
    Requires a valid existing token in the Authorization header.
    Returns a fresh token with a new expiry window.
    """
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth_header.startswith('Token '):
        return JsonResponse(
            {'detail': 'Authorization token required.'}, status=401)

    old_key = auth_header.split(' ', 1)[1].strip()
    try:
        old_token = Token.objects.select_related('user').get(key=old_key)
    except Token.DoesNotExist:
        return JsonResponse({'detail': 'Invalid token.'}, status=401)

    user = old_token.user
    if not user.is_active:
        return JsonResponse({'detail': 'Account deactivated.'}, status=403)

    # Rotate
    new_token = _rotate_token(user)
    csrf_token = get_token(request)

    logger.info('Token refreshed for user=%s', user.username)

    resp = JsonResponse(_user_payload(user, new_token.key, csrf_token))
    resp.set_cookie(
        'csrftoken', csrf_token,
        httponly=False,
        samesite='Lax',
        secure=request.is_secure(),
    )
    return resp


@csrf_exempt
def logout_view(request):
    """Logout: delete the auth token and clear the session."""
    if request.method not in ('POST', 'GET'):
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    # Delete token so it can't be reused
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ', 1)[1].strip()
        Token.objects.filter(key=token_key).delete()

    try:
        django_logout(request)
    except Exception:
        pass

    logger.info('User logged out')
    return JsonResponse({'detail': 'Logged out successfully.'})


@csrf_exempt
@require_POST
def verify_email_view(request):
    """Verify email using token sent via email link."""
    data = _parse_json_body(request)
    token = (data.get('token') or '').strip()

    if not token:
        return JsonResponse({'detail': 'Verification token is required.'}, status=400)

    try:
        email_token = EmailVerificationToken.objects.select_related('user').get(token=token)
    except EmailVerificationToken.DoesNotExist:
        return JsonResponse({'detail': 'Invalid or expired verification token.'}, status=400)

    # Check if token is still valid
    if not email_token.is_valid():
        return JsonResponse({'detail': 'Verification token has expired. Please request a new one.'}, status=400)

    # Mark email as verified
    user = email_token.user
    user.email_verified = True
    user.email_verified_at = timezone.now()
    user.save()

    # Mark token as used
    email_token.mark_used()

    logger.info('Email verified for user=%s', user.username)
    return JsonResponse({
        'detail': 'Email verified successfully!',
        'email_verified': True,
    })


@csrf_exempt
@require_POST
def resend_verification_email_view(request):
    """Resend email verification link to user."""
    data = _parse_json_body(request)
    email = (data.get('email') or '').strip()

    if not email:
        return JsonResponse({'detail': 'Email address is required.'}, status=400)

    User = get_user_model()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if email exists (security best practice)
        return JsonResponse({
            'detail': 'If an account exists with this email, a verification link has been sent.'
        })

    # Check if already verified
    if user.email_verified:
        return JsonResponse({
            'detail': 'This email is already verified.',
            'email_verified': True,
        })

    # Delete old token if exists
    EmailVerificationToken.objects.filter(user=user, is_used=False).delete()

    # Create new verification token
    token_string = EmailVerificationToken.generate_token()
    email_token = EmailVerificationToken.objects.create(
        user=user,
        token=token_string,
        expires_at=timezone.now() + timedelta(hours=24)
    )

    # Send verification email
    success = EmailService.send_verification_email(
        user_email=user.email,
        token=token_string,
        user_name=user.first_name
    )

    if success:
        logger.info('Verification email resent to user=%s', user.username)
        return JsonResponse({
            'detail': 'Verification email has been sent. Please check your inbox.',
        })
    else:
        return JsonResponse({
            'detail': 'Failed to send verification email. Please try again later.',
        }, status=500)
