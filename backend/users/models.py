from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid
import secrets
import string


class User(AbstractUser):
    # ─── Identity ───────────────────────────────────────────────────────────
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, blank=True)
    profile_pic = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    # ─── Email Verification ────────────────────────────────────────────────
    email_verified = models.BooleanField(default=False, help_text="User has verified their email")
    email_verified_at = models.DateTimeField(null=True, blank=True)

    # ─── Guide Verification Status ──────────────────────────────────────────
    is_guide = models.BooleanField(default=False, help_text="Admin-approved guide status")
    guide_verification_status = models.CharField(
        max_length=20,
        choices=[
            ('not_requested', 'Not Requested'),
            ('pending', 'Pending Review'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
        ],
        default='not_requested',
        help_text="User's guide verification application status"
    )
    guide_verification_reason = models.TextField(blank=True, help_text="Admin notes for rejection")
    guide_requested_at = models.DateTimeField(null=True, blank=True)
    guide_verified_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.username


class EmailVerificationToken(models.Model):
    """Store email verification tokens with expiration."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_verification_token')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Email Verification Token"
        verbose_name_plural = "Email Verification Tokens"
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'is_used']),
        ]

    def __str__(self):
        return f"Token for {self.user.email}"

    def is_valid(self) -> bool:
        """Check if token is valid (not expired, not used)."""
        return (
            not self.is_used and
            timezone.now() < self.expires_at
        )

    def mark_used(self):
        """Mark token as used."""
        self.is_used = True
        self.used_at = timezone.now()
        self.save()

    @staticmethod
    def generate_token(length: int = 64) -> str:
        """Generate a cryptographically secure token."""
        chars = string.ascii_letters + string.digits + '-_'
        return ''.join(secrets.choice(chars) for _ in range(length))


class PasswordResetToken(models.Model):
    """Store password reset tokens with 1-hour expiration."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Password Reset Token"
        verbose_name_plural = "Password Reset Tokens"
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'is_used']),
        ]

    def __str__(self):
        return f"Password reset for {self.user.email}"

    def is_valid(self) -> bool:
        """Check if token is valid (not expired, not used)."""
        return (
            not self.is_used and
            timezone.now() < self.expires_at
        )

    def mark_used(self):
        """Mark token as used."""
        self.is_used = True
        self.used_at = timezone.now()
        self.save()

    @staticmethod
    def generate_token(length: int = 64) -> str:
        """Generate a cryptographically secure token."""
        chars = string.ascii_letters + string.digits + '-_'
        return ''.join(secrets.choice(chars) for _ in range(length))


class TwoFactorAuth(models.Model):
    """Store TOTP secrets for Two-Factor Authentication (2FA)."""
    
    TWO_FA_METHODS = [
        ('totp', 'Time-based One-Time Password (TOTP)'),
        ('sms', 'SMS-based OTP'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='two_factor_auth')
    is_enabled = models.BooleanField(default=False, help_text="2FA is active for this user")
    method = models.CharField(max_length=10, choices=TWO_FA_METHODS, default='totp')
    
    # TOTP-specific fields
    totp_secret = models.CharField(max_length=255, blank=True, help_text="Base32-encoded TOTP secret")
    
    # SMS-specific fields
    phone_number = models.CharField(max_length=20, blank=True, help_text="Phone number for SMS OTP")
    
    # Backup codes for account recovery
    backup_codes = models.JSONField(default=list, blank=True, help_text="List of one-time backup codes")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    enabled_at = models.DateTimeField(null=True, blank=True, help_text="When 2FA was enabled")
    last_verified_at = models.DateTimeField(null=True, blank=True, help_text="Last successful 2FA verification")
    
    class Meta:
        verbose_name = "Two-Factor Authentication"
        verbose_name_plural = "Two-Factor Authentications"
        indexes = [
            models.Index(fields=['user', 'is_enabled']),
        ]
    
    def __str__(self):
        return f"2FA ({self.method}) for {self.user.email}"


class TwoFactorSession(models.Model):
    """Track temporary sessions waiting for 2FA verification after login."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='two_factor_sessions')
    session_code = models.CharField(max_length=255, unique=True, help_text="Unique session identifier")
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    failed_attempts = models.IntegerField(default=0, help_text="Number of failed 2FA attempts")
    
    class Meta:
        verbose_name = "Two-Factor Session"
        verbose_name_plural = "Two-Factor Sessions"
        indexes = [
            models.Index(fields=['session_code']),
            models.Index(fields=['user', 'verified', 'expires_at']),
        ]
    
    def __str__(self):
        return f"2FA Session for {self.user.email}"
    
    def is_valid(self) -> bool:
        """Check if session is valid (not expired, not verified)."""
        return (
            not self.verified and
            timezone.now() < self.expires_at
        )
    
    @staticmethod
    def generate_session_code(length: int = 48) -> str:
        """Generate a cryptographically secure session code."""
        chars = string.ascii_letters + string.digits + '-_'
        return ''.join(secrets.choice(chars) for _ in range(length))


class GuideDocument(models.Model):
    """Store uploaded documents for guide verification."""
    
    DOCUMENT_TYPES = [
        ('id_passport', 'ID / Passport'),
        ('certification', 'Tour Guide Certification'),
        ('insurance', 'Public Liability Insurance'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='guide_documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to='guide_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Guide Document"
        verbose_name_plural = "Guide Documents"
        
    def __str__(self):
        return f"{self.get_document_type_display()} for {self.user.username}"

