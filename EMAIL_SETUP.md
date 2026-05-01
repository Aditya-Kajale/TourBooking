# Email Verification & Authentication Setup Guide

## Overview
This guide explains how to configure email verification, password reset, and other email-based features in TourBooking.

## Quick Start (Local Development)

### No Setup Required!
For local development, emails are printed to the Django console. Just run:

```bash
cd backend
source .env/bin/activate
python manage.py runserver
```

Check Django's console output for verification links:
```
[Email Output]
Subject: Verify Your Email Address - TourBooking
...
Verification URL: http://localhost:5173/verify-email?token=abc123...
```

## Production Email Setup

### Option 1: SendGrid (Recommended) ⭐

**Why SendGrid?**
- Reliable, scalable email service
- 100 free emails/day
- Excellent delivery rates
- Professional templates support

**Setup:**

1. Create SendGrid account: https://sendgrid.com/
2. Get API key from Settings → API Keys
3. Set environment variables:

```bash
export EMAIL_BACKEND=sendgrid_backend.SendgridBackend
export SENDGRID_API_KEY=SG.your_api_key_here
export EMAIL_FROM=noreply@yourdomain.com
export FRONTEND_URL=https://yourdomain.com
```

4. Install SendGrid backend:
```bash
pip install sendgrid-django
```

5. Update `settings.py`:
```python
EMAIL_BACKEND = 'sendgrid_backend.SendgridBackend'
SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
SENDGRID_SANDBOX_MODE_IN_DEBUG = False
```

### Option 2: Gmail SMTP

**Setup:**

1. Enable 2-factor authentication on Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Set environment variables:

```bash
export EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
export EMAIL_HOST=smtp.gmail.com
export EMAIL_PORT=587
export EMAIL_USE_TLS=True
export EMAIL_HOST_USER=your-email@gmail.com
export EMAIL_HOST_PASSWORD=your-app-specific-password
export EMAIL_FROM=noreply@yourdomain.com
```

### Option 3: AWS SES

**Setup:**

1. Create AWS SES account
2. Verify sender email in SES console
3. Create IAM user with SES permissions
4. Get Access Key ID and Secret Key
5. Set environment variables:

```bash
export EMAIL_BACKEND=django_ses.SESBackend
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_SES_REGION_NAME=us-east-1
export EMAIL_FROM=noreply@yourdomain.com
```

6. Install Django SES backend:
```bash
pip install django-ses
```

### Option 4: Postmark

**Setup:**

```bash
export EMAIL_BACKEND=postmark.django_backend.EmailBackend
export POSTMARK_TOKEN=your_postmark_token
export EMAIL_FROM=noreply@yourdomain.com
```

## Email Verification Flow

### 1. User Registration
1. User fills signup form with profile info
2. Backend validates and creates user account
3. **Verification email is automatically sent**
4. User redirected to `/verify-email` screen

### 2. Email Verification Page
- Shows user's email address
- Instructions to check email
- Resend button (60-second cooldown)
- Auto-verifies if user clicks link in email

### 3. Email Link
User receives HTML email with:
- Personalized greeting
- Verification button
- Direct token link
- Security note about link expiration

### 4. Verification
- User clicks link in email (or button)
- Frontend calls `POST /api/verify-email/`
- Backend validates token (must be unused and not expired)
- User's `email_verified` flag set to `True`
- Redirects to home

### 5. Resend Flow
- If user misses email, clicks "Resend"
- Frontend calls `POST /api/resend-verification-email/`
- Old tokens invalidated
- New token generated and sent
- 60-second cooldown enforced

## API Endpoints

### 1. Register User
```
POST /api/register/
Content-Type: multipart/form-data

{
  username: "john_doe",
  email: "john@example.com",
  password: "SecurePass123!",
  first_name: "John",
  last_name: "Doe",
  phone: "+1234567890",
  profile_pic: (file) - optional
}

Response: 201
{
  id: "uuid",
  username: "john_doe",
  email: "john@example.com",
  email_verified: false,
  token: "auth_token",
  csrfToken: "csrf_token"
}
```

### 2. Verify Email
```
POST /api/verify-email/
Content-Type: application/json

{
  token: "64-character-token-from-email"
}

Response: 200
{
  detail: "Email verified successfully!",
  email_verified: true
}
```

### 3. Resend Verification Email
```
POST /api/resend-verification-email/
Content-Type: application/json

{
  email: "john@example.com"
}

Response: 200
{
  detail: "Verification email has been sent. Please check your inbox."
}
```

### 4. Get Current User (Includes Email Status)
```
GET /api/me/
Authorization: Token {auth_token}

Response: 200
{
  id: "uuid",
  email_verified: true/false,
  guide_verification_status: "not_requested|pending|approved|rejected",
  ...
}
```

## Environment Variables Reference

### Required for Production
```
EMAIL_BACKEND          - Email service backend class
EMAIL_FROM            - Sender email address
FRONTEND_URL          - Frontend domain for verification links
```

### SendGrid
```
SENDGRID_API_KEY      - SendGrid API key
SENDGRID_SANDBOX_MODE_IN_DEBUG - true/false
```

### SMTP (Gmail, Outlook, etc.)
```
EMAIL_HOST            - SMTP server host
EMAIL_PORT            - SMTP port (usually 587)
EMAIL_USE_TLS         - true/false
EMAIL_HOST_USER       - SMTP username
EMAIL_HOST_PASSWORD   - SMTP password/app-password
```

### AWS SES
```
AWS_ACCESS_KEY_ID     - AWS access key
AWS_SECRET_ACCESS_KEY - AWS secret key
AWS_SES_REGION_NAME   - AWS region (e.g., us-east-1)
```

## Database

### Models

**User Fields**
- `email_verified: bool` - Has user verified their email?
- `email_verified_at: datetime` - When was email verified?

**EmailVerificationToken**
- `user: FK` - OneToOne relationship to User
- `token: str` - Cryptographic token (64 chars)
- `created_at: datetime` - Token creation time
- `expires_at: datetime` - Token expiration (24 hours)
- `is_used: bool` - Has token been used?
- `used_at: datetime` - When was token used?

### Admin Interface

Access at `/secure-admin-panel/`:

1. **Users**
   - View all users with email verification status
   - Filter by email_verified, is_guide, guide_verification_status
   - Edit user details
   - Set guide status

2. **Email Verification Tokens**
   - View all tokens (used/unused)
   - Check expiration status
   - Search by user email

## Security Considerations

### Token Security ✅
- 64-character cryptographically secure tokens
- Generated using `secrets` module
- Stored in database (never in email)
- One-time use (marked as used after verification)
- 24-hour expiration

### Email Security ✅
- Plain text + HTML versions
- Security warnings in emails
- HTTPS links for verification
- Per-user unique tokens
- No sensitive data in URLs except token

### Rate Limiting
- 60-second cooldown on resend button (frontend)
- No rate limiting on API (TODO: implement)
- Recommended: Add `django-ratelimit` in production

### Privacy
- Email addresses not revealed in API (404 vs 401)
- User cannot enumerate valid emails
- Verification tokens are unguessable

## Testing

### Local Testing

1. Start Django server with console email backend
2. Register new user
3. Check Django console for verification link
4. Copy token from link
5. Visit `http://localhost:5173/verify-email?token=YOUR_TOKEN`
6. Frontend calls API with token
7. Backend verifies and marks email as verified

### Manual API Testing

```bash
# Register user
curl -X POST http://localhost:8000/api/register/ \
  -F username=testuser \
  -F email=test@example.com \
  -F password=SecurePass123! \
  -F first_name=Test \
  -F last_name=User \
  -F phone=+1234567890

# Copy token from console output

# Verify email
curl -X POST http://localhost:8000/api/verify-email/ \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'

# Resend email
curl -X POST http://localhost:8000/api/resend-verification-email/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Troubleshooting

### Emails not sending in production

1. **Check EMAIL_BACKEND**
   ```bash
   python manage.py shell
   >>> from django.conf import settings
   >>> print(settings.EMAIL_BACKEND)
   ```

2. **Test email sending**
   ```bash
   python manage.py shell
   >>> from django.core.mail import send_mail
   >>> send_mail('Test', 'Body', 'from@example.com', ['to@example.com'])
   ```

3. **Check logs**
   ```bash
   tail -f django_errors.log
   ```

### Verification link expired

- Token expires after 24 hours
- User can click "Resend Verification Email"
- New token generated with fresh 24-hour window

### User locked out

- Admin can manually set `email_verified = True` in admin panel
- User can request password reset (once implemented)

## Future Enhancements

- [ ] Email verification required before booking
- [ ] Password reset with token
- [ ] Welcome email templates
- [ ] Email preferences/unsubscribe
- [ ] Bulk email for announcements
- [ ] Email bounce handling
- [ ] DKIM/SPF configuration
- [ ] Email delivery tracking

## Support

For issues or questions:
1. Check Django error logs: `backend/django_errors.log`
2. Review email service provider documentation
3. Test with console backend first (local dev)
4. Verify environment variables are set correctly
