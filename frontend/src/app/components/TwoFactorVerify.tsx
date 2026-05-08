import React, { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { verify2FACode } from '../../api/auth';

export const TwoFactorVerify: React.FC<{
  sessionCode: string;
  userEmail: string;
  onSuccess: (user: any) => void;
  onCancel: () => void;
}> = ({ sessionCode, userEmail, onSuccess, onCancel }) => {
  const [verificationMethod, setVerificationMethod] = useState<'totp' | 'backup'>('totp');
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (verificationMethod === 'totp' && code.length !== 6) {
      setError('TOTP code must be 6 digits');
      return;
    }
    if (verificationMethod === 'backup' && !backupCode.trim()) {
      setError('Backup code is required');
      return;
    }

    setLoading(true);
    setError('');

    const result = await verify2FACode(
      sessionCode,
      verificationMethod === 'totp' ? code : undefined,
      verificationMethod === 'backup' ? backupCode : undefined
    );

    if (result.ok) {
      onSuccess(result.user);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-md w-full p-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold">Verify Your Account</h1>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-center mb-2">
          Two-Factor Authentication Required
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 text-center mb-6">
          {userEmail}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-200 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setVerificationMethod('totp');
              setCode('');
              setBackupCode('');
              setError('');
            }}
            className={`flex-1 py-2 px-3 rounded font-semibold transition ${
              verificationMethod === 'totp'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Authenticator App
          </button>
          <button
            onClick={() => {
              setVerificationMethod('backup');
              setCode('');
              setBackupCode('');
              setError('');
            }}
            className={`flex-1 py-2 px-3 rounded font-semibold transition ${
              verificationMethod === 'backup'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Backup Code
          </button>
        </div>

        {verificationMethod === 'totp' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Enter 6-digit code from your authenticator app:
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono tracking-widest border-2 border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded py-3 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>
          </div>
        )}

        {verificationMethod === 'backup' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Enter a backup code:
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                className="w-full text-center font-mono border-2 border-gray-300 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded py-2 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              One backup code can only be used once. It will be removed from your account.
            </p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || (verificationMethod === 'totp' ? code.length !== 6 : !backupCode.trim())}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded transition"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        <button
          onClick={onCancel}
          className="w-full mt-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded transition"
        >
          Back
        </button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
          Having trouble? Contact support at support@tourbooking.com
        </p>
      </div>
    </div>
  );
};
