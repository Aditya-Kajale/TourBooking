import React, { useState, useEffect } from 'react';
import { Shield, Copy, Check, AlertCircle } from 'lucide-react';
import { get2FASetup, enable2FA } from '../../api/auth';

export const TwoFactorSetup: React.FC<{ onComplete: () => void; onCancel: () => void }> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'init' | 'scan' | 'verify' | 'backup' | 'complete'>('init');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupData, setSetupData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    setError('');
    const result = await get2FASetup();
    if (result.ok) {
      setSetupData(result);
      setStep('scan');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Code must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    const result = await enable2FA(setupData.secret, verificationCode, 'totp');
    if (result.ok) {
      setStep('backup');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleCopyBackupCodes = () => {
    if (setupData?.backup_codes) {
      const codes = setupData.backup_codes.join('\n');
      navigator.clipboard.writeText(codes);
      setBackupCodesCopied(true);
      setTimeout(() => setBackupCodesCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold">Enable Two-Factor Auth</h2>
            </div>
            {step !== 'init' && step !== 'scan' && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {step === 'verify' ? 'Step 2/3' : 'Step 3/3'}
              </span>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-200 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {step === 'init' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Protect your account with Two-Factor Authentication (2FA). You'll need an authenticator app like Google Authenticator or Authy.
              </p>
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded transition"
              >
                {loading ? 'Setting up...' : 'Get Started'}
              </button>
              <button
                onClick={onCancel}
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded transition"
              >
                Cancel
              </button>
            </div>
          )}

          {step === 'scan' && setupData && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Scan this QR code with your authenticator app:
              </p>
              <div className="flex justify-center bg-white p-4 rounded">
                <img
                  src={setupData.qr_code}
                  alt="2FA QR Code"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Can't scan? Enter this key manually:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded font-mono text-sm text-center break-all">
                {setupData.secret}
              </div>
              <button
                onClick={() => setStep('verify')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
              >
                Next
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Enter the 6-digit code from your authenticator app:
              </p>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-2xl font-mono border-2 border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded py-2"
                autoFocus
              />
              <button
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded transition"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                onClick={() => setStep('scan')}
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded transition"
              >
                Back
              </button>
            </div>
          )}

          {step === 'backup' && setupData?.backup_codes && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
                  ⚠️ Save your backup codes
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  You'll need these codes to access your account if you lose your authenticator device.
                </p>
              </div>

              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {setupData.backup_codes.map((code: string, idx: number) => (
                    <div key={idx} className="text-gray-700 dark:text-gray-300">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCopyBackupCodes}
                className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded transition"
              >
                {backupCodesCopied ? (
                  <>
                    <Check className="w-4 h-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Codes
                  </>
                )}
              </button>

              <button
                onClick={onComplete}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition"
              >
                Setup Complete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
