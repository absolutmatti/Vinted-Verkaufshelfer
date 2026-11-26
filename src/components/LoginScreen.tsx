import React, { useState } from 'react';
import { Lock, ShieldCheck, UserCheck } from 'lucide-react';
import type { ProfileName } from '../types';
import { validatePin } from '../utils/vintedRules';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginScreenProps {
  expectedPin: string;
  onLogin: (profile: ProfileName) => void;
  cloudUserEmail: string | null;
  onGoogleSignIn: () => Promise<void>;
  isSigningInCloud: boolean;
  cloudError: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  expectedPin,
  onLogin,
  cloudUserEmail,
  onGoogleSignIn,
  isSigningInCloud,
  cloudError,
}) => {
  const [selectedProfile, setSelectedProfile] = useState<ProfileName>('Matti');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePin(pin, expectedPin)) {
      setError('Der eingegebene PIN ist leider nicht korrekt.');
      return;
    }
    setError(null);
    onLogin(selectedProfile);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#007782] text-white flex items-center justify-center font-display font-bold text-xl">
              V
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Vinted-Verkaufshelfer
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Privates KI-Tool und gemeinsames Inventar für Matti und Diana.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-800">
                Wer nutzt die App gerade?
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {(['Matti', 'Diana'] as const).map((name) => {
                  const active = selectedProfile === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedProfile(name)}
                      aria-pressed={active}
                      className={`min-h-[52px] rounded-2xl border px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        active
                          ? 'border-[#007782] bg-[#E6F4F5] text-[#005F68]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck className="w-4 h-4 shrink-0" />
                      <span>Ich bin {name}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="login-pin" className="block text-sm font-medium text-slate-800">
                Gemeinsamer PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="PIN eingeben"
                  className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-[#007782] focus:border-[#007782]"
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-red-700 font-medium pt-1">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[#007782] text-white font-semibold text-sm hover:bg-[#005F68] active:scale-[0.99] transition-all cursor-pointer"
            >
              Anmelden als {selectedProfile}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            {cloudUserEmail ? (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-[#007782] shrink-0" />
                <span className="truncate">Cloud-Sync aktiv ({cloudUserEmail})</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onGoogleSignIn}
                disabled={isSigningInCloud}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isSigningInCloud
                  ? 'Verbinde mit Google...'
                  : 'Optional: Mit Google für Handy-Sync verbinden'}
              </button>
            )}
            {cloudError && (
              <p role="alert" className="text-xs text-red-700">
                {cloudError}
              </p>
            )}
            <div className="flex justify-center">
              <PWAInstallButton compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
