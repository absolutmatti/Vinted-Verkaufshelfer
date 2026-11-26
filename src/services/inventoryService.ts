import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, HOUSEHOLD_ID, OperationType } from '../firebase';
import { SEED_ITEMS } from '../data/seedItems';
import type { ProfileName, VintedItem } from '../types';

const LOCAL_ITEMS_KEY = 'vinted_helfer_items_v1';
const LOCAL_SESSION_KEY = 'vinted_helfer_session_v1';
const LOCAL_PIN_KEY = 'vinted_helfer_pin_v1';
export const DEFAULT_SHARED_PIN = '2026';

export function getStoredPin(): string {
  try {
    return localStorage.getItem(LOCAL_PIN_KEY) || DEFAULT_SHARED_PIN;
  } catch {
    return DEFAULT_SHARED_PIN;
  }
}

export function setStoredPin(pin: string): void {
  try {
    localStorage.setItem(LOCAL_PIN_KEY, pin);
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export function getSavedSessionProfile(): ProfileName | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { profile?: string };
    if (parsed.profile === 'Matti' || parsed.profile === 'Diana') {
      return parsed.profile;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSessionProfile(profile: ProfileName | null): void {
  try {
    if (!profile) {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      return;
    }
    localStorage.setItem(
      LOCAL_SESSION_KEY,
      JSON.stringify({ profile, loggedInAt: new Date().toISOString() })
    );
  } catch {
    // Ignore storage errors
  }
}

export function loadLocalItems(): VintedItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_ITEMS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(SEED_ITEMS));
      return SEED_ITEMS;
    }
    const parsed = JSON.parse(raw) as VintedItem[];
    if (!Array.isArray(parsed)) return SEED_ITEMS;
    return parsed;
  } catch {
    return SEED_ITEMS;
  }
}

export function saveLocalItems(items: readonly VintedItem[]): void {
  try {
    localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota issues
  }
}

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export async function ensureHouseholdMembership(
  user: User,
  profile: ProfileName
): Promise<{ householdOwnerUid: string; memberUids: string[]; invitedEmails: string[] }> {
  const householdRef = doc(db, 'households', HOUSEHOLD_ID);
  const memberRef = doc(db, 'households', HOUSEHOLD_ID, 'members', user.uid);
  const userRef = doc(db, 'users', user.uid);

  const userEmail = user.email || '';

  try {
    const householdSnap = await getDoc(householdRef);
    const batch = writeBatch(db);

    let ownerUid = user.uid;
    let invitedEmails: string[] = [userEmail];

    if (!householdSnap.exists()) {
      batch.set(householdRef, {
        id: HOUSEHOLD_ID,
        name: 'Matti & Diana Vinted',
        ownerUid: user.uid,
        ownerEmail: userEmail,
        invitedEmails: [userEmail],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(memberRef, {
        uid: user.uid,
        email: userEmail,
        profileName: profile,
        role: 'owner',
        householdOwnerUid: user.uid,
        joinedAt: serverTimestamp(),
      });
    } else {
      const hData = householdSnap.data() as {
        ownerUid: string;
        invitedEmails?: string[];
      };
      ownerUid = hData.ownerUid;
      invitedEmails = Array.isArray(hData.invitedEmails) ? hData.invitedEmails : [];

      const memberSnap = await getDoc(memberRef);
      if (!memberSnap.exists()) {
        batch.set(memberRef, {
          uid: user.uid,
          email: userEmail,
          profileName: profile,
          role: ownerUid === user.uid ? 'owner' : 'member',
          householdOwnerUid: ownerUid,
          joinedAt: serverTimestamp(),
        });
      } else {
        batch.update(memberRef, {
          profileName: profile,
        });
      }
    }

    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      batch.set(userRef, {
        uid: user.uid,
        email: userEmail,
        preferredProfile: profile,
        householdId: HOUSEHOLD_ID,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(userRef, {
        preferredProfile: profile,
        householdId: HOUSEHOLD_ID,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();

    // Collect known member UIDs so new items grant list access to all household members
    const membersSnap = await getDocs(collection(db, 'households', HOUSEHOLD_ID, 'members'));
    const memberUids = Array.from(
      new Set([user.uid, ...membersSnap.docs.map((d) => d.id)])
    ).slice(0, 5);

    return { householdOwnerUid: ownerUid, memberUids, invitedEmails };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `households/${HOUSEHOLD_ID}`);
  }
}

export async function inviteHouseholdEmail(email: string, currentInvited: string[]): Promise<string[]> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Bitte gib eine gültige Google-E-Mail-Adresse ein.');
  }
  const next = Array.from(new Set([...currentInvited.map((e) => e.toLowerCase()), normalized])).slice(
    0,
    5
  );
  const path = `households/${HOUSEHOLD_ID}`;
  try {
    await updateDoc(doc(db, 'households', HOUSEHOLD_ID), {
      invitedEmails: next,
      updatedAt: serverTimestamp(),
    });
    return next;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeHouseholdItems(
  uid: string,
  onItems: (items: VintedItem[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `households/${HOUSEHOLD_ID}/items`;
  const q = query(collection(db, 'households', HOUSEHOLD_ID, 'items'), where('memberUids', 'array-contains', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: VintedItem[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data() as Record<string, unknown>;
        return {
          id: String(d.id || docSnap.id),
          title: String(d.title || ''),
          description: String(d.description || ''),
          hashtags: Array.isArray(d.hashtags) ? d.hashtags.map(String) : [],
          category: String(d.category || ''),
          brand: String(d.brand || 'Keine Marke'),
          size: String(d.size || 'One Size'),
          material: String(d.material || ''),
          color: String(d.color || ''),
          condition: (d.condition as VintedItem['condition']) || 'Sehr gut',
          priceBargain: Number(d.priceBargain) || 0,
          priceFair: Number(d.priceFair) || 0,
          priceHigh: Number(d.priceHigh) || 0,
          images: Array.isArray(d.images) ? d.images.map(String) : [],
          ownerProfile: d.ownerProfile === 'Diana' ? 'Diana' : 'Matti',
          authorUid: String(d.authorUid || uid),
          memberUids: Array.isArray(d.memberUids) ? d.memberUids.map(String) : [uid],
          status: d.status === 'sold' ? 'sold' : 'available',
          soldPrice: typeof d.soldPrice === 'number' ? d.soldPrice : undefined,
          soldAt: d.soldAt ? toIsoString(d.soldAt) : undefined,
          createdAt: toIsoString(d.createdAt),
          updatedAt: toIsoString(d.updatedAt),
        };
      });
      onItems(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function createCloudItem(
  item: Omit<VintedItem, 'createdAt' | 'updatedAt'>,
  memberUids: string[],
  uid: string
): Promise<void> {
  const path = `households/${HOUSEHOLD_ID}/items/${item.id}`;
  const cleanMemberUids = Array.from(new Set([uid, ...memberUids])).slice(0, 5);
  try {
    await setDoc(doc(db, 'households', HOUSEHOLD_ID, 'items', item.id), {
      id: item.id,
      title: item.title.slice(0, 140),
      description: item.description.slice(0, 4000),
      hashtags: item.hashtags.slice(0, 10),
      category: item.category.slice(0, 200),
      brand: item.brand.slice(0, 100),
      size: item.size.slice(0, 60),
      material: item.material.slice(0, 120),
      color: item.color.slice(0, 60),
      condition: item.condition,
      priceBargain: item.priceBargain,
      priceFair: item.priceFair,
      priceHigh: item.priceHigh,
      images: item.images.slice(0, 4),
      ownerProfile: item.ownerProfile,
      authorUid: uid,
      memberUids: cleanMemberUids,
      status: 'available',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markCloudItemSold(itemId: string, soldPrice: number): Promise<void> {
  const path = `households/${HOUSEHOLD_ID}/items/${itemId}`;
  try {
    await updateDoc(doc(db, 'households', HOUSEHOLD_ID, 'items', itemId), {
      status: 'sold',
      soldPrice,
      soldAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCloudItem(itemId: string): Promise<void> {
  const path = `households/${HOUSEHOLD_ID}/items/${itemId}`;
  try {
    await deleteDoc(doc(db, 'households', HOUSEHOLD_ID, 'items', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
