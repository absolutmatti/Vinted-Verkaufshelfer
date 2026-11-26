import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { Package, PlusCircle, Search, User as UserIcon } from 'lucide-react';
import { auth, googleProvider } from './firebase';
import { AccountSyncModal } from './components/AccountSyncModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ItemCard } from './components/ItemCard';
import { ItemDetailModal } from './components/ItemDetailModal';
import { LoginScreen } from './components/LoginScreen';
import { NewItemView } from './components/NewItemView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { RevenueStatsBar } from './components/RevenueStatsBar';
import {
  createCloudItem,
  deleteCloudItem,
  ensureHouseholdMembership,
  getSavedSessionProfile,
  getStoredPin,
  inviteHouseholdEmail,
  loadLocalItems,
  markCloudItemSold,
  saveLocalItems,
  saveSessionProfile,
  setStoredPin,
  subscribeHouseholdItems,
} from './services/inventoryService';
import type { OwnerFilter, ProfileName, StatusFilter, VintedItem } from './types';
import { calculateRevenues, filterItems } from './utils/vintedRules';

type ActiveTab = 'inventory' | 'new';

function generateItemId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `item_${Date.now()}_${rand}`;
}

export const AppContent: React.FC = () => {
  const [profile, setProfile] = useState<ProfileName | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return 'Matti';
    }
    return getSavedSessionProfile();
  });

  const [expectedPin, setExpectedPin] = useState<string>(() => getStoredPin());
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');
  const [items, setItems] = useState<VintedItem[]>(() => loadLocalItems());
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('Alle');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Firebase Cloud Sync state
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [memberUids, setMemberUids] = useState<string[]>([]);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [isSigningInCloud, setIsSigningInCloud] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);

  if (firestoreError) {
    throw firestoreError;
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCloudUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!cloudUser || !profile) {
      return;
    }

    let unsubscribeItems: (() => void) | undefined;
    let cancelled = false;

    ensureHouseholdMembership(cloudUser, profile)
      .then(({ memberUids: uids, invitedEmails: emails }) => {
        if (cancelled) return;
        setMemberUids(uids);
        setInvitedEmails(emails);
        unsubscribeItems = subscribeHouseholdItems(
          cloudUser.uid,
          (cloudItems) => {
            setItems(cloudItems);
          },
          (err) => {
            setFirestoreError(err);
          }
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setFirestoreError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      cancelled = true;
      if (unsubscribeItems) unsubscribeItems();
    };
  }, [cloudUser, profile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleLogin = (chosenProfile: ProfileName) => {
    saveSessionProfile(chosenProfile);
    setProfile(chosenProfile);
  };

  const handleLogout = () => {
    saveSessionProfile(null);
    setProfile(null);
    setShowAccountModal(false);
  };

  const handleSwitchProfile = (nextProfile: ProfileName) => {
    saveSessionProfile(nextProfile);
    setProfile(nextProfile);
    showToast(`Aktives Profil: ${nextProfile}`);
  };

  const handleGoogleSignIn = async () => {
    setCloudError(null);
    setIsSigningInCloud(true);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Mit Google Cloud-Sync verbunden.');
    } catch (err) {
      setCloudError(
        err instanceof Error ? err.message : 'Google-Anmeldung wurde abgebrochen.'
      );
    } finally {
      setIsSigningInCloud(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await signOut(auth);
    setItems(loadLocalItems());
    showToast('Cloud-Sync getrennt (lokaler Modus aktiv).');
  };

  const handleInviteEmail = async (email: string) => {
    const updated = await inviteHouseholdEmail(email, invitedEmails);
    setInvitedEmails(updated);
  };

  const handleChangePin = (newPin: string) => {
    setStoredPin(newPin);
    setExpectedPin(newPin);
  };

  const handleSaveNewItem = async (
    draft: Omit<VintedItem, 'id' | 'authorUid' | 'memberUids' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!profile) return;
    const nowIso = new Date().toISOString();
    const newId = generateItemId();

    if (cloudUser) {
      await createCloudItem(
        {
          ...draft,
          id: newId,
          authorUid: cloudUser.uid,
          memberUids: memberUids.length > 0 ? memberUids : [cloudUser.uid],
        },
        memberUids,
        cloudUser.uid
      );
    } else {
      const localItem: VintedItem = {
        ...draft,
        id: newId,
        authorUid: `local-${profile.toLowerCase()}`,
        memberUids: ['local-matti', 'local-diana'],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      const updated = [localItem, ...items];
      setItems(updated);
      saveLocalItems(updated);
    }

    setStatusFilter('available');
    setOwnerFilter('Alle');
    setActiveTab('inventory');
    showToast('Artikel gespeichert und als verfügbar markiert.');
  };

  const handleMarkSold = async (itemId: string, soldPrice: number) => {
    if (cloudUser) {
      await markCloudItemSold(itemId, soldPrice);
    } else {
      const nowIso = new Date().toISOString();
      const updated = items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: 'sold' as const,
              soldPrice,
              soldAt: nowIso,
              updatedAt: nowIso,
            }
          : item
      );
      setItems(updated);
      saveLocalItems(updated);
    }
    showToast(`Als verkauft für ${soldPrice} € gespeichert.`);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (cloudUser) {
      await deleteCloudItem(itemId);
    } else {
      const updated = items.filter((item) => item.id !== itemId);
      setItems(updated);
      saveLocalItems(updated);
    }
    showToast('Artikel gelöscht.');
  };

  const revenueSummary = useMemo(() => calculateRevenues(items), [items]);
  const visibleItems = useMemo(
    () => filterItems(items, ownerFilter, statusFilter, searchQuery),
    [items, ownerFilter, statusFilter, searchQuery]
  );

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId]
  );

  if (!profile) {
    return (
      <LoginScreen
        expectedPin={expectedPin}
        onLogin={handleLogin}
        cloudUserEmail={cloudUser?.email ?? null}
        onGoogleSignIn={handleGoogleSignIn}
        isSigningInCloud={isSigningInCloud}
        cloudError={cloudError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111827] pb-24 md:pb-12">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('inventory');
            }}
            className="text-lg font-display font-bold text-slate-900 tracking-tight whitespace-nowrap shrink-0"
          >
            Vinted-Verkaufshelfer
          </a>

          <nav
            aria-label="Hauptnavigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'inventory'
                  ? 'border-[#007782] text-[#005F68] font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Unsere Artikel
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('new')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'new'
                  ? 'border-[#007782] text-[#005F68] font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Neuer Artikel
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:block">
              <PWAInstallButton compact />
            </div>
            <button
              type="button"
              onClick={() => setShowAccountModal(true)}
              aria-label={`Profil und Sync öffnen (${profile})`}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-[#007782]" />
              <span>{profile}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {toastMessage && (
          <div
            role="status"
            className="rounded-xl bg-[#007782] text-white px-4 py-2.5 text-sm font-medium shadow-sm"
          >
            {toastMessage}
          </div>
        )}

        {activeTab === 'inventory' ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Unsere Artikel
              </h1>
              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className="hidden sm:inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#007782] px-4 text-sm font-semibold text-white hover:bg-[#005F68] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Neuer Artikel</span>
              </button>
            </div>

            <RevenueStatsBar summary={revenueSummary} />

            {/* Combined Filters & Search */}
            <section
              aria-label="Artikel filtern"
              className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Owner Filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 mr-1">Besitzer:</span>
                  <div
                    role="group"
                    aria-label="Nach Besitzer filtern"
                    className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
                  >
                    {(['Alle', 'Matti', 'Diana'] as const).map((owner) => {
                      const active = ownerFilter === owner;
                      return (
                        <button
                          key={owner}
                          type="button"
                          onClick={() => setOwnerFilter(owner)}
                          aria-pressed={active}
                          className={`min-h-[38px] px-3.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {owner}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 mr-1">Status:</span>
                  <div
                    role="group"
                    aria-label="Nach Status filtern"
                    className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
                  >
                    {(
                      [
                        { id: 'available', label: 'Verfügbar' },
                        { id: 'sold', label: 'Verkauft' },
                        { id: 'all', label: 'Alle' },
                      ] as const
                    ).map((opt) => {
                      const active = statusFilter === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setStatusFilter(opt.id)}
                          aria-pressed={active}
                          className={`min-h-[38px] px-3.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search */}
                <div className="relative lg:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    aria-label="Artikel durchsuchen"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Marke, Titel, Größe..."
                    className="w-full min-h-[42px] pl-9 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#007782]"
                  />
                </div>
              </div>
            </section>

            {/* Inventory Grid */}
            {visibleItems.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                <p className="text-base font-semibold text-slate-900">
                  Keine passenden Artikel gefunden
                </p>
                <p className="text-sm text-slate-600">
                  Passe die Filter an oder füge einen neuen Vinted-Artikel hinzu.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('new')}
                  className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#007782] px-5 text-sm font-semibold text-white hover:bg-[#005F68] cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Neuer Artikel</span>
                </button>
              </div>
            ) : (
              <div
                data-testid="inventory-grid"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {visibleItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onSelect={(chosen) => setSelectedItemId(chosen.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Neuer Artikel
              </h1>
              <span className="text-xs font-medium text-slate-500">
                Eingestellt von {profile}
              </span>
            </div>
            <NewItemView currentProfile={profile} onSaveItem={handleSaveNewItem} />
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-3 h-16 items-center">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'inventory' ? 'text-[#007782] font-semibold' : 'text-slate-500'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[11px]">Unsere Artikel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'new' ? 'text-[#007782] font-semibold' : 'text-slate-500'
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-[11px]">Neuer Artikel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAccountModal(true)}
            className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-slate-500 cursor-pointer"
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[11px]">{profile}</span>
          </button>
        </div>
      </nav>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          currentProfile={profile}
          onClose={() => setSelectedItemId(null)}
          onMarkSold={handleMarkSold}
          onDelete={handleDeleteItem}
        />
      )}

      {/* Account & Sync Modal */}
      {showAccountModal && (
        <AccountSyncModal
          currentProfile={profile}
          onSwitchProfile={handleSwitchProfile}
          onLogout={handleLogout}
          onClose={() => setShowAccountModal(false)}
          cloudUserEmail={cloudUser?.email ?? null}
          invitedEmails={invitedEmails}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          onInviteEmail={handleInviteEmail}
          onChangePin={handleChangePin}
        />
      )}

      <OfflineIndicator />
    </div>
  );
};

export const App: React.FC = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;
