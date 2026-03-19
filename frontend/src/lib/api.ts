const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://192.168.11.40:8081/api/v1";
const API_BASE_STORAGE_KEY = "pecenje-api-base-url";

export function getApiBaseUrl() {
  const stored = window.localStorage.getItem(API_BASE_STORAGE_KEY);
  if (!stored) {
    return DEFAULT_API_BASE;
  }

  if (stored.includes("127.0.0.1:8081") || stored.includes("localhost:8081")) {
    window.localStorage.setItem(API_BASE_STORAGE_KEY, DEFAULT_API_BASE);
    return DEFAULT_API_BASE;
  }

  return stored;
}

export function setApiBaseUrl(url: string) {
  window.localStorage.setItem(API_BASE_STORAGE_KEY, url);
}

function authHeaders(): Record<string, string> {
  const raw = window.localStorage.getItem("pecenje-auth");
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as { user?: { id?: number } };
    return parsed.user?.id ? { "X-Demo-UserId": String(parsed.user.id) } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      ...authHeaders()
    }
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function send<T>(path: string, method: "POST" | "PUT", body: unknown): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.errors?.[0]?.message ?? `API error: ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: <T>(body: unknown) => send<T>("/auth/login", "POST", body),
  getDashboardOverview: <T>() => request<T>("/dashboard/overview"),
  getVersionPolicy: <T>() => request<T>("/version-policy"),
  updateVersionPolicy: <T>(body: unknown) => send<T>("/version-policy", "PUT", body),
  getPlans: <T>() => request<T>("/baking-plans"),
  createPlan: <T>(body: unknown) => send<T>("/baking-plans", "POST", body),
  getBatches: <T>() => request<T>("/batches"),
  getOperatorEntries: <T>() => request<T>("/batches/entries"),
  createOperatorEntry: <T>(body: unknown) => send<T>("/batches/entries", "POST", body),
  getWaste: <T>() => request<T>("/waste"),
  getAlerts: <T>() => request<T>("/alerts"),
  getPlanVsActual: <T>() => request<T>("/reports/plan-vs-actual"),
  exportPlanVsActualExcel: <T>() => request<T>("/reports/plan-vs-actual/export/excel"),
  exportPlanVsActualPdf: <T>() => request<T>("/reports/plan-vs-actual/export/pdf"),
  getLocations: <T>() => request<T>("/master-data/locations"),
  getItems: <T>() => request<T>("/master-data/items"),
  getLocationOvens: <T>() => request<T>("/master-data/ovens"),
  updateLocationOvens: <T>(body: unknown) => send<T>("/master-data/ovens", "PUT", body),
  getTerms: <T>() => request<T>("/master-data/terms"),
  updateTerms: <T>(body: unknown) => send<T>("/master-data/terms", "PUT", body),
  getReasons: <T>() => request<T>("/master-data/reasons"),
  updateReasons: <T>(body: unknown) => send<T>("/master-data/reasons", "PUT", body),
  getUsers: <T>() => request<T>("/users"),
  createUser: <T>(body: unknown) => send<T>("/users", "POST", body),
  updateUserAccount: <T>(userId: number, body: unknown) => send<T>(`/users/${userId}`, "PUT", body),
  getUserLocations: <T>(userId: number) => request<T>(`/users/${userId}/locations`),
  manualMasterDataSync: <T>() => send<T>("/integrations/master-data/sync", "POST", {}),
  createLocation: <T>(body: unknown) => send<T>("/master-data/locations", "POST", body),
  updateLocation: <T>(locationId: number, body: unknown) => send<T>(`/master-data/locations/${locationId}`, "PUT", body),
  createItem: <T>(body: unknown) => send<T>("/master-data/items", "POST", body),
  updateItem: <T>(itemId: number, body: unknown) => send<T>(`/master-data/items/${itemId}`, "PUT", body),
  updateUserLocations: <T>(userId: number, body: unknown) => send<T>(`/users/${userId}/locations`, "PUT", body)
};
