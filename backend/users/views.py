import json
import logging
from datetime import timedelta

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login as django_login
from django.middleware.csrf import get_token
from django.contrib.auth import logout as django_logout
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST, require_http_methods
from django.utils import timezone
from django.conf import settings
from rest_framework.authtoken.models import Token
from .email_service import EmailService
from .models import EmailVerificationToken, PasswordResetToken

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
    
    # Get 2FA status
    from .models import TwoFactorAuth
    two_fa_enabled = False
    try:
        two_fa = TwoFactorAuth.objects.get(user=user)
        two_fa_enabled = two_fa.is_enabled
    except TwoFactorAuth.DoesNotExist:
        pass
    
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
        'is_admin': user.is_staff,
        'guide_verification_status': getattr(user, 'guide_verification_status', 'not_requested'),
        'two_fa_enabled': two_fa_enabled,
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

    # ── Check for 2FA ────────────────────────────────────────────────────
    from .models import TwoFactorAuth
    try:
        two_fa = TwoFactorAuth.objects.get(user=user, is_enabled=True)
        # 2FA is enabled - create temporary session for 2FA verification
        from .two_factor_utils import create_2fa_session
        session = create_2fa_session(user)
        
        logger.info('Successful password auth for user=%s, 2FA required', user.username)
        
        return JsonResponse({
            'detail': '2FA verification required.',
            'requires_2fa': True,
            'session_code': session.session_code,
            'user': {
                'username': user.username,
                'email': user.email,
            }
        }, status=202)
    except TwoFactorAuth.DoesNotExist:
        pass  # Continue with normal login

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

    logger.info(
        'New user registered username=%s email_sent=%s',
        username,
        email_sent)

    # ⚠️ DO NOT create auth token yet - user must verify email first
    # After email verification, user will login with their credentials
    return JsonResponse({
        'detail': 'Account created! Please verify your email to complete registration.',
        'email': user.email,
        'username': user.username,
    }, status=201)


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


@csrf_exempt
def check_username_availability_view(request):
    """Check if username is available (not already taken)."""
    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    data = _parse_json_body(request)
    username = (data.get('username') or '').strip()

    if not username:
        return JsonResponse({'available': False, 'message': 'Username is required.'}, status=400)

    if len(username) < 3:
        return JsonResponse({'available': False, 'message': 'Username must be at least 3 characters.'})

    User = get_user_model()
    exists = User.objects.filter(username__iexact=username).exists()

    return JsonResponse({
        'available': not exists,
        'username': username,
        'message': 'Username is already taken.' if exists else 'Username is available.',
    })


@csrf_exempt
def check_email_availability_view(request):
    """Check if email is available (not already used by another user)."""
    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    data = _parse_json_body(request)
    email = (data.get('email') or '').strip()

    if not email:
        return JsonResponse({'available': False, 'message': 'Email is required.'}, status=400)

    # Basic email format validation
    if not email or '@' not in email or '.' not in email.split('@')[1]:
        return JsonResponse({'available': False, 'message': 'Invalid email format.'})

    User = get_user_model()
    exists = User.objects.filter(email__iexact=email).exists()

    return JsonResponse({
        'available': not exists,
        'email': email,
        'message': 'Email is already in use.' if exists else 'Email is available.',
    })


@csrf_exempt
@require_POST
def request_password_reset_view(request):
    """Send a password reset link to the user's email."""
    data = _parse_json_body(request)
    email = (data.get('email') or '').strip()

    if not email:
        return JsonResponse({'detail': 'Email address is required.'}, status=400)

    # Always return success to prevent email enumeration
    success_msg = 'If an account exists with this email, a password reset link has been sent.'

    User = get_user_model()
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({'detail': success_msg})

    # Invalidate any existing unused reset tokens
    PasswordResetToken.objects.filter(user=user, is_used=False).delete()

    # Create new token (expires in 1 hour)
    token_string = PasswordResetToken.generate_token()
    PasswordResetToken.objects.create(
        user=user,
        token=token_string,
        expires_at=timezone.now() + timedelta(hours=1)
    )

    # Send the reset email
    EmailService.send_password_reset_email(
        user_email=user.email,
        token=token_string,
        user_name=user.first_name
    )

    logger.info('Password reset requested for user=%s', user.username)
    return JsonResponse({'detail': success_msg})


@csrf_exempt
@require_POST
def confirm_password_reset_view(request):
    """Reset the user's password using a valid token."""
    data = _parse_json_body(request)
    token = (data.get('token') or '').strip()
    new_password = data.get('new_password') or ''

    if not token:
        return JsonResponse({'detail': 'Reset token is required.'}, status=400)
    if not new_password or len(new_password) < 8:
        return JsonResponse({'detail': 'Password must be at least 8 characters.'}, status=400)

    try:
        reset_token = PasswordResetToken.objects.select_related('user').get(token=token)
    except PasswordResetToken.DoesNotExist:
        return JsonResponse({'detail': 'Invalid or expired reset token.'}, status=400)

    if not reset_token.is_valid():
        return JsonResponse({'detail': 'This reset link has expired. Please request a new one.'}, status=400)

    # Set new password
    user = reset_token.user
    user.set_password(new_password)
    user.save()

    # Mark token as used
    reset_token.mark_used()

    # Invalidate all existing auth tokens for security
    Token.objects.filter(user=user).delete()

    logger.info('Password reset completed for user=%s', user.username)
    return JsonResponse({'detail': 'Password has been reset successfully. Please log in with your new password.'})


# ── Two-Factor Authentication (2FA) ────────────────────────────────────

@require_http_methods(['GET'])
def get_2fa_setup(request):
    """Get QR code and backup codes for 2FA setup."""
    if not request.user or not request.user.is_authenticated:
        return JsonResponse({'detail': 'Not authenticated.'}, status=401)
    
    from .serializers import TwoFactorSetupSerializer
    from .two_factor_utils import get_totp_uri, generate_qr_code, generate_backup_codes
    import pyotp
    
    # Generate new TOTP secret
    secret = pyotp.random_base32()
    uri = get_totp_uri(request.user, secret)
    qr_code = generate_qr_code(uri)
    backup_codes = generate_backup_codes(10)
    
    return JsonResponse({
        'secret': secret,
        'qr_code': qr_code,
        'uri': uri,
        'backup_codes': backup_codes,
    })


@csrf_exempt
@require_POST
def enable_2fa(request):
    """Enable 2FA after verifying the first TOTP code."""
    if not request.user or not request.user.is_authenticated:
        return JsonResponse({'detail': 'Not authenticated.'}, status=401)
    
    from .models import TwoFactorAuth
    from .two_factor_utils import verify_totp_code, generate_backup_codes
    
    data = _parse_json_body(request)
    secret = data.get('secret', '').strip()
    code = data.get('code', '').strip()
    method = data.get('method', 'totp').strip()
    
    if not secret or not code:
        return JsonResponse(
            {'detail': 'Secret and code are required.'}, status=400)
    
    if not code.isdigit() or len(code) != 6:
        return JsonResponse(
            {'detail': '2FA code must be 6 digits.'}, status=400)
    
    # Verify the code
    if not verify_totp_code(secret, code):
        return JsonResponse(
            {'detail': 'Invalid 2FA code. Please try again.'}, status=400)
    
    # Create or update 2FA record
    two_fa, created = TwoFactorAuth.objects.get_or_create(
        user=request.user,
        defaults={
            'method': method,
            'totp_secret': secret,
            'backup_codes': generate_backup_codes(10),
        }
    )
    
    if not created:
        # Update existing record
        two_fa.method = method
        two_fa.totp_secret = secret
        two_fa.backup_codes = generate_backup_codes(10)
    
    two_fa.is_enabled = True
    two_fa.enabled_at = timezone.now()
    two_fa.save()
    
    logger.info('2FA enabled for user=%s method=%s', request.user.username, method)
    
    return JsonResponse({
        'detail': '2FA has been enabled successfully.',
        'backup_codes': two_fa.backup_codes,
    })


@csrf_exempt
@require_POST
def disable_2fa(request):
    """Disable 2FA for the current user."""
    if not request.user or not request.user.is_authenticated:
        return JsonResponse({'detail': 'Not authenticated.'}, status=401)
    
    from .models import TwoFactorAuth
    
    data = _parse_json_body(request)
    password = data.get('password', '')
    
    if not password:
        return JsonResponse(
            {'detail': 'Password is required to disable 2FA.'}, status=400)
    
    # Verify password
    if not request.user.check_password(password):
        return JsonResponse(
            {'detail': 'Incorrect password.'}, status=401)
    
    try:
        two_fa = TwoFactorAuth.objects.get(user=request.user)
        two_fa.is_enabled = False
        two_fa.totp_secret = ''
        two_fa.backup_codes = []
        two_fa.save()
        
        logger.info('2FA disabled for user=%s', request.user.username)
        
        return JsonResponse({'detail': '2FA has been disabled.'})
    except TwoFactorAuth.DoesNotExist:
        return JsonResponse(
            {'detail': '2FA is not enabled for this account.'}, status=400)


@require_http_methods(['GET'])
def get_2fa_status(request):
    """Get current 2FA status for the authenticated user."""
    if not request.user or not request.user.is_authenticated:
        return JsonResponse({'detail': 'Not authenticated.'}, status=401)
    
    from .models import TwoFactorAuth
    
    try:
        two_fa = TwoFactorAuth.objects.get(user=request.user)
        return JsonResponse({
            'is_enabled': two_fa.is_enabled,
            'method': two_fa.method,
            'created_at': two_fa.created_at.isoformat(),
            'enabled_at': two_fa.enabled_at.isoformat() if two_fa.enabled_at else None,
            'last_verified_at': two_fa.last_verified_at.isoformat() if two_fa.last_verified_at else None,
            'backup_codes_count': len(two_fa.backup_codes) if two_fa.backup_codes else 0,
        })
    except TwoFactorAuth.DoesNotExist:
        return JsonResponse({
            'is_enabled': False,
            'method': None,
            'created_at': None,
            'enabled_at': None,
            'last_verified_at': None,
            'backup_codes_count': 0,
        })


@csrf_exempt
@require_POST
def verify_2fa_code(request):
    """Verify 2FA code after login to get final auth token."""
    from .models import TwoFactorSession
    from .two_factor_utils import verify_2fa_session
    
    data = _parse_json_body(request)
    session_code = data.get('session_code', '').strip()
    totp_code = data.get('code', '').strip()
    backup_code = data.get('backup_code', '').strip()
    
    if not session_code:
        return JsonResponse(
            {'detail': 'Session code is required.'}, status=400)
    
    if not totp_code and not backup_code:
        return JsonResponse(
            {'detail': 'Either TOTP code or backup code must be provided.'}, status=400)
    
    # Verify the 2FA session
    success, user = verify_2fa_session(session_code, totp_code, backup_code)
    
    if not success:
        return JsonResponse(
            {'detail': 'Invalid 2FA code. Please try again.'}, status=401)
    
    # Clean up the session and create auth token
    TwoFactorSession.objects.filter(session_code=session_code).delete()
    
    # Rotate token
    token = _rotate_token(user)
    csrf_token = get_token(request)
    
    logger.info('Successful 2FA verification for user=%s', user.username)
    
    resp = JsonResponse(_user_payload(user, token.key, csrf_token))
    resp.set_cookie(
        'csrftoken', csrf_token,
        httponly=False,
        samesite='Lax',
        secure=request.is_secure(),
    )
    return resp


from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import GuideApplicationSerializer, GuideApplicationVerifySerializer

class GuideVerificationAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin endpoints to view and approve/reject guide applications."""
    serializer_class = GuideApplicationSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = get_user_model().objects.exclude(guide_verification_status='not_requested')
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(guide_verification_status=status_param)
        return queryset.order_by('-guide_requested_at')

    @action(detail=True, methods=['post'], url_path='verify')
    def verify(self, request, pk=None):
        user_app = self.get_object()
        serializer = GuideApplicationVerifySerializer(data=request.data)
        
        if serializer.is_valid():
            action = serializer.validated_data['action']
            reason = serializer.validated_data.get('reason', '')
            
            user_app.guide_verification_status = action + 'ed' # 'approved' or 'rejected'
            user_app.guide_verification_reason = reason
            user_app.guide_verified_at = timezone.now()
            
            if action == 'approve':
                user_app.is_guide = True
            else:
                user_app.is_guide = False
                
            user_app.save()
            return Response({'status': f'Application {action}ed'})
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
