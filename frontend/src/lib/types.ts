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
  mode: "pekara" | "pecenjara";
  status: string;
};

export type CreateManualPlanRequest = {
  mode: "pekara" | "pecenjara";
  locationId: number;
  plannedTime: string;
  plannedQty: number;
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

export type OperatorEntryLine = {
  itemName: string;
  quantity: number;
  classB: boolean;
  classBItemName?: string;
  classBQuantity: number;
};

export type OperatorEntry = {
  id: string;
  mode: "pekara" | "pecenjara" | "pijara";
  locationId: number;
  locationName: string;
  items: OperatorEntryLine[];
  note: string;
  photoDataUrl: string;
  photoName: string;
  createdAt: string;
  userId: number;
  operatorName: string;
};

export type CreateOperatorEntryRequest = {
  mode: "pekara" | "pecenjara" | "pijara";
  locationId: number;
  locationName: string;
  items: OperatorEntryLine[];
  note: string;
  photoDataUrl: string;
  photoName: string;
  createdAt: string;
};

export type CreateWasteEntryRequest = {
  sourceMode: "pekara" | "pecenjara" | "pijara";
  locationId: number;
  locationName: string;
  itemName: string;
  quantity: number;
  reason: string;
  note: string;
  photoDataUrl: string;
  photoName: string;
  createdAt: string;
};

export type WasteEntry = {
  wasteEntryId: number;
  locationId: number;
  itemName: string;
  quantity: number;
  reason: string;
  locationName: string;
  sourceMode: "pekara" | "pecenjara" | "pijara";
  note: string;
  photoDataUrl: string;
  photoName: string;
  createdAt: string;
  operatorName: string;
};

export type PhotoAsset = {
  photoDataUrl: string;
  photoName: string;
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
    mode: "pekara" | "pecenjara";
    planDate: string;
    plannedTime: string;
    actualTime?: string | null;
    delayMinutes?: number | null;
    timingStatus: string;
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

export type ReportExport = {
  fileName: string;
  contentType: string;
  contentBase64: string;
};

export type AppVersionPolicy = {
  minimumSupportedVersion: string;
  latestVersion: string;
  buildNumber: string;
  releasedAt: string;
  forceUpdate: boolean;
  downloadUrl: string;
  messageMk: string;
};

export type UpdateAppVersionPolicyRequest = AppVersionPolicy;

export type Location = {
  locationId: number;
  code: string;
  nameMk: string;
  regionCode: string;
  isActive: boolean;
};

export type OvenModeConfig = {
  ovenType: string;
  ovenCount: number;
  ovenCapacity: number;
};

export type LocationOvenConfig = {
  locationId: number;
  pekara: OvenModeConfig;
  pecenjara: OvenModeConfig;
};

export type UpdateLocationOvensRequest = {
  locations: LocationOvenConfig[];
};

export type TermEntry = {
  id: string;
  label: string;
  time: string;
  isActive: boolean;
};

export type UpdateTermsRequest = {
  terms: TermEntry[];
};

export type ReasonEntry = {
  id: string;
  code: string;
  name: string;
  category: "разлика" | "отпад" | "доцнење";
  isActive: boolean;
};

export type UpdateReasonsRequest = {
  reasons: ReasonEntry[];
};

export type Item = {
  itemId: number;
  code: string;
  nameMk: string;
  groupCode: string;
  groupName: string;
  salesPrice: number;
  wasteLimitPct: number;
  isActive: boolean;
  classBCode?: string | null;
  classBName?: string | null;
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
  defaultLocationId?: number | null;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    fullName: string;
    role: string;
    defaultLocationId?: number | null;
    permissions: string[];
  };
};

export type CreateUserRequest = {
  defaultLocationId: number;
  username: string;
  fullName: string;
  password: string;
  roleCode: string;
  isActive: boolean;
  canUsePekara: boolean;
  canUsePecenjara: boolean;
  canUsePijara: boolean;
  pekaraOvenType: string;
  pecenjaraOvenType: string;
};

export type UpdateUserAccountRequest = {
  isActive: boolean;
  newPassword?: string;
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
  canUsePijara: boolean;
  pekaraOvenType?: string | null;
  pecenjaraOvenType?: string | null;
};
