import { api } from "./api";
import type { CreateOperatorEntryRequest, CreateWasteEntryRequest } from "./types";

export type PendingOperatorEntry = CreateOperatorEntryRequest & { localId: string };
export type PendingWasteEntry = CreateWasteEntryRequest & { localId: string };

const PENDING_OPERATOR_ENTRIES_KEY = "pecenje-pending-operator-entries";
const PENDING_WASTE_ENTRIES_KEY = "pecenje-pending-waste-entries";
let pendingSyncInFlight = false;

export function shouldQueueOffline(error: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("failed to fetch") || message.includes("networkerror") || message.includes("load failed");
}

export function createLocalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function queuePendingOperatorEntry(entry: PendingOperatorEntry) {
  const queue = readPendingOperatorEntries();
  queue.push(entry);
  writePendingOperatorEntries(queue);
}

export function queuePendingWasteEntry(entry: PendingWasteEntry) {
  const queue = readPendingWasteEntries();
  queue.push(entry);
  writePendingWasteEntries(queue);
}

export async function syncPendingOperatorEntries() {
  if (pendingSyncInFlight || typeof window === "undefined" || !navigator.onLine) {
    return;
  }

  const queue = readPendingOperatorEntries();
  if (!queue.length) {
    return;
  }

  pendingSyncInFlight = true;
  try {
    const remaining: PendingOperatorEntry[] = [];
    for (let index = 0; index < queue.length; index += 1) {
      const entry = queue[index];
      try {
        await api.createOperatorEntry(entry);
      } catch (error) {
        if (shouldQueueOffline(error)) {
          remaining.push(...queue.slice(index));
          break;
        }
      }
    }

    writePendingOperatorEntries(remaining);
  } finally {
    pendingSyncInFlight = false;
  }
}

export async function syncPendingWasteEntries() {
  if (pendingSyncInFlight || typeof window === "undefined" || !navigator.onLine) {
    return;
  }

  const queue = readPendingWasteEntries();
  if (!queue.length) {
    return;
  }

  pendingSyncInFlight = true;
  try {
    const remaining: PendingWasteEntry[] = [];
    for (let index = 0; index < queue.length; index += 1) {
      const entry = queue[index];
      try {
        await api.createWaste(entry);
      } catch (error) {
        if (shouldQueueOffline(error)) {
          remaining.push(...queue.slice(index));
          break;
        }
      }
    }

    writePendingWasteEntries(remaining);
  } finally {
    pendingSyncInFlight = false;
  }
}

function readPendingOperatorEntries(): PendingOperatorEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(PENDING_OPERATOR_ENTRIES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as PendingOperatorEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readPendingWasteEntries(): PendingWasteEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(PENDING_WASTE_ENTRIES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as PendingWasteEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingOperatorEntries(entries: PendingOperatorEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  if (!entries.length) {
    window.localStorage.removeItem(PENDING_OPERATOR_ENTRIES_KEY);
    return;
  }

  window.localStorage.setItem(PENDING_OPERATOR_ENTRIES_KEY, JSON.stringify(entries));
}

function writePendingWasteEntries(entries: PendingWasteEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  if (!entries.length) {
    window.localStorage.removeItem(PENDING_WASTE_ENTRIES_KEY);
    return;
  }

  window.localStorage.setItem(PENDING_WASTE_ENTRIES_KEY, JSON.stringify(entries));
}
