import React, { useState, useEffect } from 'react';
import { Shield, Check, X, AlertCircle } from 'lucide-react';
import { get2FAStatus, disable2FA } from '../../api/auth';
import { TwoFactorSetup } from './TwoFactorSetup';

export const TwoFactorManagement: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [disablingPassword, setDisablingPassword] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disablingError, setDisablingError] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    const result = await get2FAStatus();
    if (result.ok) {
      setIsEnabled(result.is_enabled);
    }
    setLoading(false);
  };

  const handleDisable = async () => {
    if (!disablingPassword) {
      setDisablingError('Password is required');
      return;
    }

    setLoading(true);
    setDisablingError('');

    const result = await disable2FA(disablingPassword);
    if (result.ok) {
      setIsEnabled(false);
      setShowDisableConfirm(false);
      setDisablingPassword('');
    } else {
      setDisablingError(result.error);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-sm md:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-bold">Two-Factor Authentication (2FA)</h3>
        </div>

        <div className="space-y-4">
          {/* Status Card */}
          <div className={`p-4 rounded-2xl border-2 transition-all ${
            isEnabled
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-700'
              : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-700'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isEnabled ? (
                  <>
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">Enabled</p>
                      <p className="text-sm text-green-700 dark:text-green-200">Your account is protected with 2FA</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100">Disabled</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-200">Enable 2FA to secure your account</p>
                    </div>
                  </>
                )}
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                isEnabled
                  ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-100'
                  : 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100'
              }`}>
                {isEnabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-4 bg-secondary/30 rounded-2xl">
            <p className="text-sm text-muted-foreground">
              Two-Factor Authentication adds an extra layer of security by requiring a second verification method (such as a code from your phone) in addition to your password when logging in.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isEnabled ? (
              <button
                onClick={() => setShowSetup(true)}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-xl transition"
              >
                Enable 2FA
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowDisableConfirm(true)}
                  className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30 font-semibold py-2 px-4 rounded-xl transition"
                >
                  Disable 2FA
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <TwoFactorSetup
          onComplete={() => {
            setShowSetup(false);
            setIsEnabled(true);
          }}
          onCancel={() => setShowSetup(false)}
        />
      )}

      {/* Disable Confirmation Modal */}
      {showDisableConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Disable Two-Factor Authentication?</h3>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Disabling 2FA will make your account less secure. You'll only need your password to log in.
              </p>
            </div>

            {disablingError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-200 flex-shrink-0" />
                <p className="text-red-800 dark:text-red-200 text-sm">{disablingError}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Enter your password to confirm:
              </label>
              <input
                type="password"
                value={disablingPassword}
                onChange={(e) => setDisablingPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-slate-700 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisableConfirm(false);
                  setDisablingPassword('');
                  setDisablingError('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDisable}
                disabled={loading || !disablingPassword}
                className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive/90 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
