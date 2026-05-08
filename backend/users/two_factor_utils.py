"""Utilities for Two-Factor Authentication (2FA) operations."""

import io
import base64
import pyotp
import qrcode
from django.contrib.auth import get_user_model
from .models import TwoFactorAuth, TwoFactorSession

User = get_user_model()


def generate_totp_secret() -> str:
    """Generate a random TOTP secret for Google Authenticator."""
    return pyotp.random_base32()


def get_totp_uri(user: User, secret: str) -> str:
    """Generate the provisioning URI for TOTP (for QR code)."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(
        name=user.email,
        issuer_name='TourBooking'
    )


def generate_qr_code(uri: str) -> str:
    """Generate QR code image as base64 string."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
    """Verify a TOTP code against the secret."""
    totp = pyotp.TOTP(secret)
    # Check current and previous/next codes (window allows for time drift)
    return totp.verify(code, valid_window=window)


def generate_backup_codes(count: int = 10) -> list:
    """Generate backup codes for account recovery."""
    import secrets
    codes = []
    for _ in range(count):
        # Generate codes like: XXXX-XXXX-XXXX (16 hex characters total)
        code = ''.join(secrets.choice('0123456789ABCDEF') for _ in range(12))
        formatted_code = f"{code[:4]}-{code[4:8]}-{code[8:]}"
        codes.append(formatted_code)
    return codes


def use_backup_code(two_fa: TwoFactorAuth, code: str) -> bool:
    """Use a backup code for 2FA when TOTP is unavailable."""
    if not two_fa.backup_codes:
        return False
    
    # Remove hyphens for comparison
    code_clean = code.replace('-', '').upper()
    
    for i, backup_code in enumerate(two_fa.backup_codes):
        if backup_code.replace('-', '').upper() == code_clean:
            # Remove used code
            two_fa.backup_codes.pop(i)
            two_fa.save()
            return True
    
    return False


def create_2fa_session(user: User) -> TwoFactorSession:
    """Create a temporary 2FA session after successful password auth."""
    from datetime import timedelta
    from django.utils import timezone
    
    session_code = TwoFactorSession.generate_session_code()
    
    session = TwoFactorSession.objects.create(
        user=user,
        session_code=session_code,
        expires_at=timezone.now() + timedelta(minutes=15)
    )
    
    return session


def verify_2fa_session(session_code: str, totp_code: str = None, backup_code: str = None) -> tuple[bool, User]:
    """
    Verify a 2FA session and return (success, user).
    
    Args:
        session_code: The session identifier from login
        totp_code: The TOTP code from authenticator app
        backup_code: The backup code if TOTP is unavailable
    
    Returns:
        (success: bool, user: User or None)
    """
    from django.utils import timezone
    
    try:
        session = TwoFactorSession.objects.get(session_code=session_code)
    except TwoFactorSession.DoesNotExist:
        return False, None
    
    # Check if session is still valid
    if not session.is_valid():
        return False, None
    
    user = session.user
    
    try:
        two_fa = TwoFactorAuth.objects.get(user=user, is_enabled=True)
    except TwoFactorAuth.DoesNotExist:
        # 2FA was disabled, accept the session
        session.verified = True
        session.verified_at = timezone.now()
        session.save()
        return True, user
    
    # Try to verify TOTP code first
    if totp_code:
        if verify_totp_code(two_fa.totp_secret, totp_code):
            session.verified = True
            session.verified_at = timezone.now()
            session.save()
            two_fa.last_verified_at = timezone.now()
            two_fa.save()
            return True, user
    
    # Try backup code if provided
    if backup_code:
        if use_backup_code(two_fa, backup_code):
            session.verified = True
            session.verified_at = timezone.now()
            session.save()
            two_fa.last_verified_at = timezone.now()
            two_fa.save()
            return True, user
    
    # Increment failed attempts
    session.failed_attempts += 1
    session.save()
    
    # Lock session after 5 failed attempts
    if session.failed_attempts >= 5:
        session.verified = False
        session.save()
        return False, None
    
    return False, None


def disable_2fa(user: User) -> bool:
    """Disable 2FA for a user."""
    try:
        two_fa = TwoFactorAuth.objects.get(user=user)
        two_fa.is_enabled = False
        two_fa.totp_secret = ''
        two_fa.backup_codes = []
        two_fa.save()
        return True
    except TwoFactorAuth.DoesNotExist:
        return False
