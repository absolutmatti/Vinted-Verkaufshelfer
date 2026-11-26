import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 z-40 flex items-center gap-2 rounded-xl bg-amber-700 px-3.5 py-2 text-xs font-medium text-white shadow-md"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline-Modus – gespeicherte Daten werden verwendet.</span>
    </div>
  );
};
