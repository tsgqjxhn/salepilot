export interface SavedAccount {
  username: string;
  companyName: string;
  lastLoginTime: number;
  refreshToken?: string;
  companyIdentityStatus?: "verified" | "pending";
}

export interface SaveAccountSessionPayload {
  username: string;
  companyName: string;
  refreshToken?: string | null;
  companyIdentityStatus?: "verified" | "pending";
}

const SAVED_ACCOUNTS_KEY = "salepilot_saved_accounts";
const MAX_SAVED_ACCOUNTS = 5;

const normalizeSavedAccount = (value: unknown): SavedAccount | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const account = value as Partial<SavedAccount>;
  const username = typeof account.username === "string" ? account.username.trim() : "";

  if (!username) {
    return null;
  }

  return {
    username,
    companyName: typeof account.companyName === "string" ? account.companyName : "",
    lastLoginTime: typeof account.lastLoginTime === "number" ? account.lastLoginTime : Date.now(),
    refreshToken: typeof account.refreshToken === "string" && account.refreshToken.trim()
      ? account.refreshToken.trim()
      : undefined,
    companyIdentityStatus: account.companyIdentityStatus === "pending" ? "pending" : "verified",
  };
};

export const loadSavedAccounts = (): SavedAccount[] => {
  try {
    const rawValue = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsedValue)
      ? parsedValue
        .map(normalizeSavedAccount)
        .filter((account): account is SavedAccount => Boolean(account))
      : [];
  } catch {
    return [];
  }
};

export const persistSavedAccounts = (accounts: SavedAccount[]) => {
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, MAX_SAVED_ACCOUNTS)));
};

export const clearSavedAccounts = () => {
  localStorage.removeItem(SAVED_ACCOUNTS_KEY);
};

export const saveAccountSession = ({
  username,
  companyName,
  refreshToken,
  companyIdentityStatus = "verified",
}: SaveAccountSessionPayload) => {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) {
    return;
  }

  const savedAccounts = loadSavedAccounts();
  const previous = savedAccounts.find((account) => account.username === normalizedUsername);
  const accounts = savedAccounts.filter((account) => account.username !== normalizedUsername);

  persistSavedAccounts([
    {
      username: normalizedUsername,
      companyName,
      refreshToken: refreshToken?.trim() || previous?.refreshToken,
      companyIdentityStatus,
      lastLoginTime: Date.now(),
    },
    ...accounts,
  ]);
};

export const updateSavedAccountRefreshToken = (username: string, refreshToken?: string | null) => {
  const normalizedUsername = username.trim();
  const normalizedRefreshToken = refreshToken?.trim();

  if (!normalizedUsername || !normalizedRefreshToken) {
    return;
  }

  const accounts = loadSavedAccounts();
  const account = accounts.find((item) => item.username === normalizedUsername);

  if (!account) {
    return;
  }

  account.refreshToken = normalizedRefreshToken;
  account.lastLoginTime = Date.now();
  persistSavedAccounts(accounts);
};
