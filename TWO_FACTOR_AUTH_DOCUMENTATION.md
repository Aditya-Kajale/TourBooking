# Two-Factor Authentication (2FA) Implementation

## Overview

This document describes the implementation of Two-Factor Authentication (2FA) for the TourBooking application using TOTP (Time-based One-Time Password) and backup codes.

## Features Implemented

### Backend (Django)

1. **Database Models** (`backend/users/models.py`)
   - `TwoFactorAuth`: Stores TOTP secrets, phone numbers, backup codes, and 2FA status
   - `TwoFactorSession`: Manages temporary sessions during 2FA verification after login

2. **Utilities** (`backend/users/two_factor_utils.py`)
   - TOTP secret generation and verification
   - QR code generation for authenticator app setup
   - Backup code generation and consumption
   - 2FA session creation and verification

3. **API Endpoints** (`backend/users/views.py`)
   - `GET /api/2fa/setup/` - Get QR code and backup codes for 2FA setup
   - `POST /api/2fa/enable/` - Enable 2FA after verifying first code
   - `POST /api/2fa/disable/` - Disable 2FA (requires password)
   - `GET /api/2fa/status/` - Get current 2FA status
   - `POST /api/2fa/verify/` - Verify 2FA code after login

4. **Modified Endpoints**
   - `POST /api/login/` - Now returns 202 with session_code if 2FA is required

5. **Admin Integration**
   - Django admin panels for TwoFactorAuth and TwoFactorSession models
   - Ability to manage user 2FA settings from admin console

### Frontend (React)

1. **Components**
   - `TwoFactorSetup.tsx` - Multi-step setup component with QR code display
   - `TwoFactorVerify.tsx` - 2FA verification screen during login
   - `TwoFactorManagement.tsx` - User profile 2FA management interface

2. **API Services** (`frontend/src/api/auth.ts`)
   - `get2FASetup()` - Fetch setup QR code
   - `enable2FA()` - Enable 2FA with verification code
   - `disable2FA()` - Disable 2FA with password
   - `get2FAStatus()` - Fetch current 2FA status
   - `verify2FACode()` - Verify 2FA code during login

3. **Updated Screens**
   - `Login.tsx` - Integrated 2FA verification step
   - `Profile.tsx` - Added 2FA management section

4. **Type Updates** (`frontend/src/api/types.ts`)
   - Added `two_fa_enabled` field to User type

## Installation & Setup

### Backend

1. **Install Dependencies**
   ```bash
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Run Migrations**
   ```bash
   python manage.py migrate
   ```

### Frontend

No additional dependencies needed. Components use existing packages.

## User Workflows

### Enabling 2FA

1. User navigates to Profile → Two-Factor Authentication
2. Click "Enable 2FA"
3. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
4. Enter 6-digit code to verify
5. Save backup codes in a secure location
6. 2FA is now active

### Login with 2FA

1. Enter username and password
2. If 2FA is enabled, user sees verification screen
3. Enter 6-digit code from authenticator app OR use backup code
4. Login completes and redirects to home

### Disabling 2FA

1. Navigate to Profile → Two-Factor Authentication
2. Click "Disable 2FA"
3. Confirm with password
4. 2FA is disabled

## API Response Examples

### Setup Request
```json
GET /api/2fa/setup/
Authorization: Token <auth_token>

Response 200:
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,...",
  "uri": "otpauth://totp/user@example.com?secret=...",
  "backup_codes": ["XXXX-XXXX-XXXX", ...]
}
```

### Login with 2FA
```json
POST /api/login/
{
  "username": "john",
  "password": "password123"
}

Response 202:
{
  "detail": "2FA verification required.",
  "requires_2fa": true,
  "session_code": "...",
  "user": {
    "username": "john",
    "email": "john@example.com"
  }
}
```

### Verify 2FA Code
```json
POST /api/2fa/verify/
{
  "session_code": "...",
  "code": "123456"
}

Response 200:
{
  "id": "...",
  "username": "john",
  "email": "john@example.com",
  "two_fa_enabled": true,
  "token": "...",
  "csrfToken": "..."
}
```

## Security Features

1. **TOTP Verification**
   - Uses PyOTP library for RFC 6238 compliant TOTP
   - Time window validation (±1 slot tolerance for clock drift)

2. **Backup Codes**
   - 10 one-time use codes generated during setup
   - Codes removed from database after use
   - Stored securely in database

3. **Session Management**
   - Temporary sessions expire after 15 minutes
   - Failed attempts tracked (max 5 before lockout)
   - Sessions marked as verified only after successful 2FA

4. **Password Protection**
   - Disabling 2FA requires password confirmation
   - Protects against unauthorized account changes

## Database Schema

### TwoFactorAuth Model
```python
user → OneToOneField(User)
is_enabled → BooleanField
method → CharField (totp|sms)
totp_secret → CharField
phone_number → CharField
backup_codes → JSONField
created_at → DateTimeField
enabled_at → DateTimeField (nullable)
last_verified_at → DateTimeField (nullable)
```

### TwoFactorSession Model
```python
user → ForeignKey(User)
session_code → CharField (unique)
created_at → DateTimeField
expires_at → DateTimeField
verified → BooleanField
verified_at → DateTimeField (nullable)
failed_attempts → IntegerField
```

## Testing Scenarios

### Test User Setup
1. Create account and verify email
2. Navigate to Profile
3. Click "Enable 2FA"
4. Scan QR code with Google Authenticator
5. Enter code from app
6. Save backup codes

### Test Login Flow
1. Log out from account
2. Log in with username/password
3. Enter 2FA code from authenticator app
4. Verify successful login

### Test Backup Code
1. Log out
2. Log in with username/password
3. Select "Backup Code" option
4. Enter one saved backup code
5. Verify login succeeds and code is consumed

### Test 2FA Disable
1. In Profile, disable 2FA
2. Next login should not require 2FA
3. Verify account is no longer protected

## Future Enhancements

1. **SMS-based 2FA**: Implement SMS delivery via Twilio
2. **WebAuthn Support**: Add hardware key support (FIDO2)
3. **Recovery Emails**: Send backup codes to email
4. **2FA Enforcement**: Make 2FA mandatory for guides
5. **Device Trust**: Remember trusted devices for X days
6. **Rate Limiting**: Add rate limiting for verification attempts

## Troubleshooting

### QR Code Not Scanning
- Use manual entry: Settings → Add account manually → Enter secret key
- Ensure authenticator app is up to date

### Time Sync Issues
- TOTP depends on device time being accurate
- Sync device time with internet
- Check authenticator app time setting

### Lost Authenticator Device
- Use backup codes to log in
- Disable 2FA and set up new device

### Backup Codes Exhausted
- Disable and re-enable 2FA to get new backup codes
- Store in secure location immediately

## Files Changed/Created

### Backend
- `backend/users/models.py` - Added TwoFactorAuth and TwoFactorSession models
- `backend/users/two_factor_utils.py` - Created utility functions (NEW)
- `backend/users/serializers.py` - Added 2FA serializers (NEW)
- `backend/users/views.py` - Added 2FA endpoints, modified login_view
- `backend/users/admin.py` - Registered 2FA models
- `backend/users/migrations/0009_*.py` - Database migration (auto-generated)
- `backend/tour_backend/urls.py` - Added 2FA URL routes
- `backend/requirements.txt` - Added pyotp and qrcode packages

### Frontend
- `frontend/src/app/components/TwoFactorSetup.tsx` - Setup component (NEW)
- `frontend/src/app/components/TwoFactorVerify.tsx` - Verification component (NEW)
- `frontend/src/app/components/TwoFactorManagement.tsx` - Profile management (NEW)
- `frontend/src/app/screens/Login.tsx` - Integrated 2FA verification
- `frontend/src/app/screens/Profile.tsx` - Added 2FA management section
- `frontend/src/api/auth.ts` - Added 2FA API functions
- `frontend/src/api/types.ts` - Added two_fa_enabled field to User type

## Notes for Developers

1. **TOTP Libraries**: The implementation uses `pyotp` which is battle-tested and RFC 6238 compliant
2. **QR Code Generation**: Uses `qrcode` library to generate QR codes for easy setup
3. **Backup Codes**: Format is XXXX-XXXX-XXXX (12 hex characters) for readability
4. **Session Timeout**: 15 minutes for 2FA session - adjust in `two_factor_utils.py` if needed
5. **Frontend State**: 2FA status is stored in user object from localStorage
6. **Error Handling**: All endpoints follow consistent error response format

## Security Considerations

✅ **Implemented:**
- Secure TOTP verification with time drift tolerance
- One-time use backup codes
- Session expiration and attempt limiting
- Password confirmation for disabling 2FA
- Secure random code generation

⚠️ **Recommended:**
- Use HTTPS in production
- Implement rate limiting on verification endpoints
- Add audit logging for 2FA events
- Regularly review 2FA audit trail in admin

## Support

For issues or questions about 2FA implementation:
1. Check troubleshooting section above
2. Review error messages in browser console
3. Check Django server logs for backend errors
4. Contact development team with implementation details
