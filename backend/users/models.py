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
