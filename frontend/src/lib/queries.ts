import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type {
  Alert,
  ApiEnvelope,
  AppVersionPolicy,
  UpdateAppVersionPolicyRequest,
  BatchDetail,
  CreateManualPlanRequest,
  CreateOperatorEntryRequest,
  CreateWasteEntryRequest,
  CreateUserRequest,
  DashboardOverview,
  Item,
  Location,
  LocationOvenConfig,
  OperatorEntry,
  PlanCard,
  PlanVsActualReport,
  ReasonEntry,
  ReportExport,
  TermEntry,
  UpdateLocationOvensRequest,
  UpdateReasonsRequest,
  UpdateTermsRequest,
  UpdateUserAccountRequest,
  UpsertItemRequest,
  UpsertLocationRequest,
  UserLocationPermission,
  UserSummary,
  WasteEntry
} from "./types";

export function useDashboardOverview() {
  return useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => api.getDashboardOverview<ApiEnvelope<DashboardOverview>>()
  });
}

export function useVersionPolicy() {
  return useQuery({
    queryKey: ["version-policy"],
    queryFn: () => api.getVersionPolicy<ApiEnvelope<AppVersionPolicy>>()
  });
}

export function useUpdateVersionPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAppVersionPolicyRequest) => api.updateVersionPolicy<ApiEnvelope<AppVersionPolicy>>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["version-policy"] });
    }
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: () => api.getPlans<ApiEnvelope<PlanCard[]>>()
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateManualPlanRequest) => api.createPlan<ApiEnvelope<PlanCard>>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    }
  });
}

export function useBatches() {
  return useQuery({
    queryKey: ["batches"],
    queryFn: () => api.getBatches<ApiEnvelope<BatchDetail[]>>()
  });
}

export function useOperatorEntries() {
  return useQuery({
    queryKey: ["operator-entries"],
    queryFn: () => api.getOperatorEntries<ApiEnvelope<OperatorEntry[]>>()
  });
}

export function useCreateOperatorEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOperatorEntryRequest) => api.createOperatorEntry<ApiEnvelope<OperatorEntry>>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operator-entries"] });
      queryClient.invalidateQueries({ queryKey: ["report-plan-vs-actual"] });
    }
  });
}

export function useWasteEntries() {
  return useQuery({
    queryKey: ["waste"],
    queryFn: () => api.getWaste<ApiEnvelope<WasteEntry[]>>()
  });
}

export function useCreateWasteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWasteEntryRequest) => api.createWaste<ApiEnvelope<WasteEntry>>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waste"] });
    }
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.getAlerts<ApiEnvelope<Alert[]>>()
  });
}

export function usePlanVsActualReport() {
  return useQuery({
    queryKey: ["report-plan-vs-actual"],
    queryFn: () => api.getPlanVsActual<ApiEnvelope<PlanVsActualReport>>()
  });
}

export function useExportPlanVsActualExcel() {
  return useMutation({
    mutationFn: () => api.exportPlanVsActualExcel<ApiEnvelope<ReportExport>>()
  });
}

export function useExportPlanVsActualPdf() {
  return useMutation({
    mutationFn: () => api.exportPlanVsActualPdf<ApiEnvelope<ReportExport>>()
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: () => api.getLocations<ApiEnvelope<Location[]>>()
  });
}

export function useItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: () => api.getItems<ApiEnvelope<Item[]>>()
  });
}

export function useLocationOvens() {
  return useQuery({
    queryKey: ["location-ovens"],
    queryFn: () => api.getLocationOvens<ApiEnvelope<LocationOvenConfig[]>>()
  });
}

export function useUpdateLocationOvens() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateLocationOvensRequest) => api.updateLocationOvens<ApiEnvelope<LocationOvenConfig[]>>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["location-ovens"] });
    }
  });
}

export function useTerms() {
  return useQuery({
    queryKey: ["terms"],
    queryFn: () => api.getTerms<ApiEnvelope<TermEntry[]>>()
  });
}

export function useUpdateTerms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTermsRequest) => api.updateTerms<ApiEnvelope<TermEntry[]>>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terms"] });
    }
  });
}

export function useReasons() {
  return useQuery({
    queryKey: ["reasons"],
    queryFn: () => api.getReasons<ApiEnvelope<ReasonEntry[]>>()
  });
}

export function useUpdateReasons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateReasonsRequest) => api.updateReasons<ApiEnvelope<ReasonEntry[]>>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reasons"] });
    }
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers<ApiEnvelope<UserSummary[]>>()
  });
}

export function useUserLocations(userId: number | null) {
  return useQuery({
    queryKey: ["user-locations", userId],
    queryFn: () => api.getUserLocations<ApiEnvelope<UserLocationPermission[]>>(userId as number),
    enabled: Boolean(userId)
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserRequest) => api.createUser<ApiEnvelope<UserSummary>>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });
}

export function useUpdateUserAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: UpdateUserAccountRequest }) =>
      api.updateUserAccount<ApiEnvelope<UserSummary>>(userId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-locations", variables.userId] });
    }
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertLocationRequest) => api.createLocation<ApiEnvelope<Location>>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    }
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ locationId, payload }: { locationId: number; payload: UpsertLocationRequest }) =>
      api.updateLocation<ApiEnvelope<Location>>(locationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    }
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertItemRequest) => api.createItem<ApiEnvelope<Item>>(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    }
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: UpsertItemRequest }) =>
      api.updateItem<ApiEnvelope<Item>>(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    }
  });
}

export function useUpdateUserLocations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: { locations: UserLocationPermission[] } }) =>
      api.updateUserLocations<ApiEnvelope<UserLocationPermission[]>>(userId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-locations", variables.userId] });
    }
  });
}

export function useManualMasterDataSync() {
  return useMutation({
    mutationFn: () => api.manualMasterDataSync<ApiEnvelope<{ locationsSynced: number; itemsSynced: number; mode: string }>>()
  });
}
