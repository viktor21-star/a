import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { RequireAuth } from "./components/RequireAuth";
import { PlanningPage } from "./pages/PlanningPage";
import { ProductionPage } from "./pages/ProductionPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { LoginPage } from "./pages/LoginPage";
import { MasterDataPage } from "./pages/MasterDataPage";
import { LocationsPage } from "./pages/LocationsPage";
import { ItemsPage } from "./pages/ItemsPage";
import { OvensPage } from "./pages/OvensPage";
import { UserAccessPage } from "./pages/UserAccessPage";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { HomePage } from "./pages/HomePage";
import { VersionPolicyPage } from "./pages/VersionPolicyPage";
import { TermsPage } from "./pages/TermsPage";
import { ReasonsPage } from "./pages/ReasonsPage";
import { WastePage } from "./pages/WastePage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="planning" element={<PlanningPage />} />
        <Route path="production" element={<ProductionPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="waste" element={<WastePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="master-data" element={<MasterDataPage />} />
        <Route path="master-data/locations" element={<LocationsPage />} />
        <Route path="master-data/items" element={<ItemsPage />} />
        <Route path="master-data/ovens" element={<OvensPage />} />
        <Route path="master-data/terms" element={<TermsPage />} />
        <Route path="master-data/reasons" element={<ReasonsPage />} />
        <Route path="user-access" element={<UserAccessPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="version-policy" element={<VersionPolicyPage />} />
      </Route>
    </Routes>
  );
}
