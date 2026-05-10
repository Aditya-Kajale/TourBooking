"""Serializers for user authentication and 2FA."""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TwoFactorAuth
from .two_factor_utils import (
    generate_totp_secret,
    get_totp_uri,
    generate_qr_code,
    verify_totp_code,
    generate_backup_codes,
)

User = get_user_model()


class TwoFactorSetupSerializer(serializers.Serializer):
    """Initiate 2FA setup and return QR code."""
    
    def get_qr_code(self, user: User) -> dict:
        """Generate QR code for TOTP setup."""
        secret = generate_totp_secret()
        uri = get_totp_uri(user, secret)
        qr_code = generate_qr_code(uri)
        
        return {
            'secret': secret,
            'qr_code': qr_code,
            'uri': uri,
            'backup_codes': generate_backup_codes(10),
        }


class TwoFactorVerifySetupSerializer(serializers.Serializer):
    """Verify 2FA setup by validating the first code."""
    
    secret = serializers.CharField(required=True, write_only=True)
    code = serializers.CharField(required=True, write_only=True, min_length=6, max_length=6)
    
    def validate_code(self, value):
        """Ensure code is numeric."""
        if not value.isdigit():
            raise serializers.ValidationError("Code must be 6 digits.")
        return value
    
    def validate(self, data):
        """Verify the TOTP code."""
        if not verify_totp_code(data['secret'], data['code']):
            raise serializers.ValidationError("Invalid 2FA code. Please try again.")
        return data


class TwoFactorVerifyCodeSerializer(serializers.Serializer):
    """Verify 2FA code during login."""
    
    session_code = serializers.CharField(required=True, write_only=True)
    code = serializers.CharField(required=False, write_only=True, allow_blank=True)
    backup_code = serializers.CharField(required=False, write_only=True, allow_blank=True)
    
    def validate(self, data):
        """Ensure at least one code is provided."""
        if not data.get('code') and not data.get('backup_code'):
            raise serializers.ValidationError(
                "Either TOTP code or backup code must be provided."
            )
        return data


class TwoFactorStatusSerializer(serializers.ModelSerializer):
    """Read-only 2FA status information."""
    
    class Meta:
        model = TwoFactorAuth
        fields = [
            'is_enabled',
            'method',
            'created_at',
            'enabled_at',
            'last_verified_at',
        ]
        read_only_fields = fields


class TwoFactorDisableSerializer(serializers.Serializer):
    """Disable 2FA (optional password verification)."""
    
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})
    
    def validate_password(self, value):
        """Verify password is correct."""
        user = self.context.get('user')
        if user and not user.check_password(value):
            raise serializers.ValidationError("Incorrect password.")
        return value


class GuideDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import GuideDocument
        model = GuideDocument
        fields = ['id', 'document_type', 'file', 'uploaded_at']


class GuideApplicationSerializer(serializers.ModelSerializer):
    documents = GuideDocumentSerializer(source='guide_documents', many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'phone', 
            'guide_verification_status', 'guide_verification_reason', 
            'guide_requested_at', 'documents'
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class GuideApplicationVerifySerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if data['action'] == 'reject' and not data.get('reason'):
            raise serializers.ValidationError({"reason": "A reason is required when rejecting an application."})
        return data
