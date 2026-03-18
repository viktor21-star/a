import { useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useManualMasterDataSync } from "../lib/queries";

export function IntegrationsPage() {
  const { user } = useAuth();
  const syncMutation = useManualMasterDataSync();
  const [lastResult, setLastResult] = useState<{ locationsSynced: number; itemsSynced: number; mode: string } | null>(null);

  if (!isAdministrator(user)) {
    return <PageState message="Интеграциите ги контролира администратор." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Интеграции</p>
          <h3>Рачен daily sync</h3>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Master data sync</h3>
          <button
            className="action-button"
            type="button"
            disabled={syncMutation.isPending}
            onClick={() => {
              syncMutation.mutate(undefined, {
                onSuccess: (response) => {
                  setLastResult(response.data as { locationsSynced: number; itemsSynced: number; mode: string });
                }
              });
            }}
          >
            {syncMutation.isPending ? "Синхронизација..." : "Стартувај sync"}
          </button>
        </div>

        <div className="list-card">
          Source DB: `192.168.10.10:1443` / `wtrg`
        </div>
        <div className="list-card">
          <code>orged</code> -&gt; локации, <code>katart</code> -&gt; артикли
        </div>
        <div className="list-card">
          Автоматски термин: секој ден во `02:00`
        </div>

        {syncMutation.isError && (
          <div className="form-error">
            {(syncMutation.error as Error).message}
          </div>
        )}

        {lastResult && (
          <div className="sync-result">
            <strong>Последен рачен sync</strong>
            <span>Локации: {lastResult.locationsSynced}</span>
            <span>Артикли: {lastResult.itemsSynced}</span>
            <span>Режим: {lastResult.mode}</span>
          </div>
        )}
      </section>
    </section>
  );
}
