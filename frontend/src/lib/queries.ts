import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type {
  Alert,
  ApiEnvelope,
  AppVersionPolicy,
  UpdateAppVersionPolicyRequest,
  BatchDetail,
  CreateUserRequest,
  DashboardOverview,
  Item,
  Location,
  PlanCard,
  PlanVsActualReport,
  ReportExport,
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

export function useBatches() {
  return useQuery({
    queryKey: ["batches"],
    queryFn: () => api.getBatches<ApiEnvelope<BatchDetail[]>>()
  });
}

export function useWasteEntries() {
  return useQuery({
    queryKey: ["waste"],
    queryFn: () => api.getWaste<ApiEnvelope<WasteEntry[]>>()
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
