const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081/api/v1";

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
  const response = await fetch(`${API_BASE}${path}`, {
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
  const response = await fetch(`${API_BASE}${path}`, {
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
  getDashboardOverview: <T>() => request<T>("/dashboard/overview"),
  getVersionPolicy: <T>() => request<T>("/version-policy"),
  updateVersionPolicy: <T>(body: unknown) => send<T>("/version-policy", "PUT", body),
  getPlans: <T>() => request<T>("/baking-plans"),
  getBatches: <T>() => request<T>("/batches"),
  getWaste: <T>() => request<T>("/waste"),
  getAlerts: <T>() => request<T>("/alerts"),
  getPlanVsActual: <T>() => request<T>("/reports/plan-vs-actual"),
  exportPlanVsActualExcel: <T>() => request<T>("/reports/plan-vs-actual/export/excel"),
  exportPlanVsActualPdf: <T>() => request<T>("/reports/plan-vs-actual/export/pdf"),
  getLocations: <T>() => request<T>("/master-data/locations"),
  getItems: <T>() => request<T>("/master-data/items"),
  getUsers: <T>() => request<T>("/users"),
  createUser: <T>(body: unknown) => send<T>("/users", "POST", body),
  getUserLocations: <T>(userId: number) => request<T>(`/users/${userId}/locations`),
  manualMasterDataSync: <T>() => send<T>("/integrations/master-data/sync", "POST", {}),
  createLocation: <T>(body: unknown) => send<T>("/master-data/locations", "POST", body),
  updateLocation: <T>(locationId: number, body: unknown) => send<T>(`/master-data/locations/${locationId}`, "PUT", body),
  createItem: <T>(body: unknown) => send<T>("/master-data/items", "POST", body),
  updateItem: <T>(itemId: number, body: unknown) => send<T>(`/master-data/items/${itemId}`, "PUT", body),
  updateUserLocations: <T>(userId: number, body: unknown) => send<T>(`/users/${userId}/locations`, "PUT", body)
};
