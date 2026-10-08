type LineProfile = { userId?: string };
type LineClient = {
  init: (options: { liffId: string }) => Promise<void>;
  isLoggedIn: () => boolean;
  login: () => void;
  getProfile: () => Promise<LineProfile>;
};

declare global {
  interface Window {
    liff?: LineClient;
  }
}

const storageKey = 'pairo-customer-key';

function getBrowserCustomerKey(): string {
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const created = `device:${crypto.randomUUID()}`;
  window.localStorage.setItem(storageKey, created);
  return created;
}

export async function getCustomerKey(): Promise<string> {
  const liffId = import.meta.env.VITE_LIFF_ID;
  const line = window.liff;
  if (liffId && line) {
    try {
      await line.init({ liffId });
      if (line.isLoggedIn()) {
        const profile = await line.getProfile();
        if (profile.userId) return `line:${profile.userId}`;
      }
    } catch (error) {
      console.warn('LINE identity unavailable; using browser identity', error);
    }
  }
  return getBrowserCustomerKey();
}
