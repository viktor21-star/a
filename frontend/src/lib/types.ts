export type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown> | null;
  errors?: Array<{ code: string; message: string }> | null;
};

export type DashboardOverview = {
  date: string;
  network: {
    realizationPct: number;
    wastePct: number;
    salesPct: number;
    onTimePct: number;
  };
  alertsOpen: number;
  topProblemItems: Array<{
    itemId: number;
    itemName: string;
    wastePct: number;
    shortagePct: number;
  }>;
  topProblemLocations: Array<{
    locationId: number;
    locationName: string;
    score: number;
  }>;
};

export type PlanCard = {
  planHeaderId: number;
  planDate: string;
  locationId: number;
  locationName: string;
  shiftName: string;
  termLabel: string;
  itemName: string;
  suggestedQty: number;
  correctedQty: number;
  status: string;
};

export type BatchDetail = {
  batchId: number;
  locationId: number;
  itemName: string;
  locationName: string;
  shiftName: string;
  termLabel: string;
  actualQty: number;
  status: string;
  operatorName: string;
  startTime: string;
  endTime?: string | null;
};

export type WasteEntry = {
  wasteEntryId: number;
  locationId: number;
  itemName: string;
  quantity: number;
  reason: string;
  locationName: string;
};

export type Alert = {
  alertId: number;
  locationId: number;
  severity: string;
  locationName: string;
  itemName: string;
  message: string;
  status: string;
};

export type PlanVsActualReport = {
  rows: Array<{
    locationName: string;
    itemName: string;
    plannedQty: number;
    bakedQty: number;
    differenceQty: number;
    realizationPct: number;
  }>;
  totals: {
    plannedQty: number;
    bakedQty: number;
    differenceQty: number;
    realizationPct: number;
  };
};

export type Location = {
  locationId: number;
  code: string;
  nameMk: string;
  regionCode: string;
  isActive: boolean;
};

export type Item = {
  itemId: number;
  code: string;
  nameMk: string;
  groupName: string;
  salesPrice: number;
  wasteLimitPct: number;
  isActive: boolean;
};

export type UpsertLocationRequest = {
  code: string;
  nameMk: string;
  regionCode: string;
  isActive: boolean;
};

export type UpsertItemRequest = {
  code: string;
  nameMk: string;
  groupName: string;
  salesPrice: number;
  wasteLimitPct: number;
  isActive: boolean;
};

export type UserSummary = {
  userId: number;
  username: string;
  fullName: string;
  roleCode: string;
  isActive: boolean;
};

export type UserLocationPermission = {
  locationId: number;
  locationName: string;
  canPlan: boolean;
  canBake: boolean;
  canRecordWaste: boolean;
  canViewReports: boolean;
  canApprovePlan: boolean;
  canUsePekara: boolean;
  canUsePecenjara: boolean;
};
