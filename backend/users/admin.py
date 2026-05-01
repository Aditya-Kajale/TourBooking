from django.contrib import admin
from .models import User, EmailVerificationToken


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'email_verified', 'is_guide', 'guide_verification_status', 'date_joined')
    list_filter = ('email_verified', 'is_guide', 'guide_verification_status', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')
    readonly_fields = ('id', 'date_joined', 'last_login', 'email_verified_at', 'guide_verified_at')
    fieldsets = (
        ('Account Info', {'fields': ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'phone', 'profile_pic')}),
        ('Email Verification', {'fields': ('email_verified', 'email_verified_at')}),
        ('Guide Status', {'fields': ('is_guide', 'guide_verification_status', 'guide_verification_reason', 'guide_requested_at', 'guide_verified_at')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Timeline', {'fields': ('date_joined', 'last_login')}),
    )


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'expires_at', 'is_used', 'used_at', 'is_valid')
    list_filter = ('is_used', 'created_at', 'expires_at')
    search_fields = ('user__email', 'user__username')
    readonly_fields = ('token', 'created_at', 'used_at', 'is_valid')
    
    def is_valid(self, obj):
        return obj.is_valid()
    is_valid.boolean = True
    is_valid.short_description = 'Currently Valid'

