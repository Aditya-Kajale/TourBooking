"""
Email service for sending verification and notification emails.
Supports SendGrid and Django's default SMTP email backend.
"""

import logging
import os
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


class EmailService:
    """Professional email service with SendGrid support."""
    
    EMAIL_FROM = os.getenv('EMAIL_FROM', settings.DEFAULT_FROM_EMAIL or 'noreply@tourbooking.com')
    SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

    @classmethod
    def send_verification_email(cls, user_email: str, token: str, user_name: str = None) -> bool:
        """
        Send email verification link to user.
        
        Args:
            user_email: Recipient email
            token: Verification token (URLsafe)
            user_name: User's first name for personalization
            
        Returns:
            True if successful, False otherwise
        """
        try:
            verification_url = f"{cls.FRONTEND_URL}/verify-email?token={token}"
            subject = "Verify Your Email Address - TourBooking"
            
            # HTML email template
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #2d5016 0%, #4a7c1c 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .button {{ display: inline-block; background: #4a7c1c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }}
                    .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                    .security-note {{ background: #e8f5e9; padding: 12px; border-left: 4px solid #4a7c1c; margin: 15px 0; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to TourBooking!</h1>
                    </div>
                    <div class="content">
                        <p>Hi {user_name or 'there'},</p>
                        <p>Thank you for signing up with TourBooking. To complete your registration and unlock all features, please verify your email address by clicking the button below.</p>
                        
                        <center>
                            <a href="{verification_url}" class="button">Verify Email Address</a>
                        </center>
                        
                        <p>Or copy and paste this link in your browser:</p>
                        <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px; font-size: 12px;">
                            {verification_url}
                        </p>
                        
                        <div class="security-note">
                            <strong>🔒 Security Note:</strong> This link expires in 24 hours. If you didn't create this account, please ignore this email.
                        </div>
                        
                        <p style="margin-top: 20px; color: #666;">Happy exploring!<br><strong>The TourBooking Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>TourBooking | Share Your Adventures Worldwide</p>
                        <p>© 2026 TourBooking. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            plain_message = strip_tags(html_message)
            
            # Send email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=cls.EMAIL_FROM,
                recipient_list=[user_email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Verification email sent to {user_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {user_email}: {str(e)}")
            return False

    @classmethod
    def send_password_reset_email(cls, user_email: str, token: str, user_name: str = None) -> bool:
        """
        Send password reset link to user.
        
        Args:
            user_email: Recipient email
            token: Reset token (URLsafe)
            user_name: User's first name for personalization
            
        Returns:
            True if successful, False otherwise
        """
        try:
            reset_url = f"{cls.FRONTEND_URL}/reset-password?token={token}"
            subject = "Reset Your Password - TourBooking"
            
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #2d5016 0%, #4a7c1c 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .button {{ display: inline-block; background: #4a7c1c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }}
                    .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                    .warning {{ background: #fff3cd; padding: 12px; border-left: 4px solid #ffc107; margin: 15px 0; font-size: 12px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hi {user_name or 'there'},</p>
                        <p>We received a request to reset your password. Click the button below to set a new password.</p>
                        
                        <center>
                            <a href="{reset_url}" class="button">Reset Password</a>
                        </center>
                        
                        <div class="warning">
                            <strong>⚠️ Important:</strong> This link expires in 1 hour. If you didn't request a password reset, please ignore this email and your account will remain secure.
                        </div>
                        
                        <p style="margin-top: 20px; color: #666;">Best regards,<br><strong>The TourBooking Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>TourBooking | Share Your Adventures Worldwide</p>
                        <p>© 2026 TourBooking. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=cls.EMAIL_FROM,
                recipient_list=[user_email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Password reset email sent to {user_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {user_email}: {str(e)}")
            return False
