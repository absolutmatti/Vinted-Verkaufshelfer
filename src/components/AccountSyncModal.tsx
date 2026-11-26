import React, { useState } from 'react';
import { Cloud, LogOut, ShieldCheck, UserPlus, Users, X } from 'lucide-react';
import type { ProfileName } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface AccountSyncModalProps {
  currentProfile: ProfileName;
  onSwitchProfile: (profile: ProfileName) => void;
  onLogout: () => void;
  onClose: () => void;
  cloudUserEmail: string | null;
  invitedEmails: string[];
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onInviteEmail: (email: string) => Promise<void>;
  onChangePin: (newPin: string) => void;
}

export const AccountSyncModal: React.FC<AccountSyncModalProps> = ({
  currentProfile,
  onSwitchProfile,
  onLogout,
  onClose,
  cloudUserEmail,
  invitedEmails,
  onGoogleSignIn,
  onGoogleSignOut,
  onInviteEmail,
  onChangePin,
}) => {
  const [inviteInput, setInviteInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      await onInviteEmail(inviteInput);
      setInviteInput('');
      setFeedback('E-Mail zum gemeinsamen Inventar hinzugefügt.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Einladung fehlgeschlagen.');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().length < 4) {
      setError('Der neue PIN muss mindestens 4 Zeichen lang sein.');
      return;
    }
    setError(null);
    onChangePin(pinInput.trim());
    setPinInput('');
    setFeedback('Gemeinsamer PIN auf diesem Gerät aktualisiert.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 id="account-modal-title" className="text-lg font-bold text-slate-900">
            Profil &amp; Cloud-Sync
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Einstellungen schließen"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Active Profile Switcher */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#007782]" />
              <span>Aktives Profil wechseln</span>
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {(['Matti', 'Diana'] as const).map((name) => {
                const active = currentProfile === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onSwitchProfile(name)}
                    className={`min-h-[44px] rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'border-[#007782] bg-[#E6F4F5] text-[#005F68]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cloud Sync */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[#007782]" />
              <span>Smartphone-Synchronisation (Firebase)</span>
            </p>

            {cloudUserEmail ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 bg-[#E6F4F5]/60 border border-[#007782]/25 rounded-xl px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-xs text-[#005F68] font-medium min-w-0">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span className="truncate">Verbunden: {cloudUserEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onGoogleSignOut}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap cursor-pointer"
                  >
                    Trennen
                  </button>
                </div>

                <form onSubmit={handleInviteSubmit} className="space-y-2">
                  <label htmlFor="invite-email" className="block text-xs font-medium text-slate-600">
                    Zweite Google-Adresse freigeben (z.B. Dianas Gmail)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="invite-email"
                      type="email"
                      value={inviteInput}
                      onChange={(e) => setInviteInput(e.target.value)}
                      placeholder="diana@gmail.com"
                      className="flex-1 min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#007782]"
                    />
                    <button
                      type="submit"
                      className="min-h-[44px] rounded-xl bg-slate-900 text-white px-4 text-xs font-semibold hover:bg-slate-800 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Freigeben</span>
                    </button>
                  </div>
                  {invitedEmails.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Freigegeben: {invitedEmails.join(', ')}
                    </p>
                  )}
                </form>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Aktuell lokal gespeichert. Verbinde dein Google-Konto, um alle Artikel live zwischen Mattis und Dianas Handy zu synchronisieren.
                </p>
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="w-full min-h-[44px] rounded-xl bg-[#007782] text-white text-sm font-semibold hover:bg-[#005F68] transition-colors cursor-pointer"
                >
                  Mit Google-Konto verbinden
                </button>
              </div>
            )}
          </div>

          {/* Local PIN update */}
          <form onSubmit={handlePinSubmit} className="space-y-2 border-t border-slate-100 pt-4">
            <label htmlFor="new-pin-input" className="block text-xs font-medium text-slate-700">
              PIN auf diesem Gerät ändern
            </label>
            <div className="flex gap-2">
              <input
                id="new-pin-input"
                type="password"
                inputMode="numeric"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Neuer PIN (min. 4 Zeichen)"
                className="flex-1 min-h-[44px] rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#007782]"
              />
              <button
                type="submit"
                className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Speichern
              </button>
            </div>
          </form>

          {feedback && (
            <p role="status" className="text-xs font-medium text-[#005F68] bg-[#E6F4F5] rounded-xl p-3">
              {feedback}
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs font-medium text-red-700 bg-red-50 rounded-xl p-3">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <PWAInstallButton compact />
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 ml-auto cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Abmelden</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
