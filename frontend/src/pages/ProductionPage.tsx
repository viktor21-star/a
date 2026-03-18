import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { useAuth } from "../lib/auth";
import { useBatches, useUserLocations, useWasteEntries } from "../lib/queries";

type EntryMode = "pekara" | "pecenjara";

export function ProductionPage() {
  const { user } = useAuth();
  const batchesQuery = useBatches();
  const wasteQuery = useWasteEntries();
  const permissionsQuery = useUserLocations(user?.id ?? null);
  const [selectedMode, setSelectedMode] = useState<EntryMode | null>(null);

  const modeAccess = useMemo(() => {
    const permissions = permissionsQuery.data?.data ?? [];

    return {
      pekara: permissions.some((entry) => entry.canBake && entry.canUsePekara),
      pecenjara: permissions.some((entry) => entry.canBake && entry.canUsePecenjara)
    };
  }, [permissionsQuery.data]);

  useEffect(() => {
    if (selectedMode && modeAccess[selectedMode]) {
      return;
    }

    if (modeAccess.pekara) {
      setSelectedMode("pekara");
      return;
    }

    if (modeAccess.pecenjara) {
      setSelectedMode("pecenjara");
      return;
    }

    setSelectedMode(null);
  }, [modeAccess, selectedMode]);

  if (batchesQuery.isLoading || permissionsQuery.isLoading) {
    return <PageState message="Се вчитуваат турите..." />;
  }

  if (batchesQuery.isError || permissionsQuery.isError || !batchesQuery.data) {
    return <PageState message="Не може да се вчитаат турите." />;
  }

  if (!modeAccess.pekara && !modeAccess.pecenjara) {
    return <PageState message="Корисникот нема дозвола за внес во Пекара или Печењара." />;
  }

  const modeLabel = selectedMode === "pecenjara" ? "Печењара" : "Пекара";
  const modeDescription =
    selectedMode === "pecenjara"
      ? "Внес на тури и отпад за печено месо и пилешки производи."
      : "Внес на тури и отпад за пекарски производи и теста.";

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Оперативно</p>
          <h3>Реално печење по тура</h3>
          <p className="meta">{modeDescription}</p>
        </div>
        <button className="action-button">Старт нова тура · {modeLabel}</button>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Режим на внес</h3>
        </div>
        <div className="mode-grid mode-grid--wide">
          {modeAccess.pekara && (
            <button
              type="button"
              className={`mode-tile${selectedMode === "pekara" ? " mode-tile--active" : ""}`}
              onClick={() => setSelectedMode("pekara")}
            >
              <strong>Пекара</strong>
              <span>Леб, буреци, печива и теста</span>
            </button>
          )}
          {modeAccess.pecenjara && (
            <button
              type="button"
              className={`mode-tile${selectedMode === "pecenjara" ? " mode-tile--active" : ""}`}
              onClick={() => setSelectedMode("pecenjara")}
            >
              <strong>Печењара</strong>
              <span>Пилешко, месо и rotisserie производи</span>
            </button>
          )}
        </div>
      </section>

      <div className="panel-grid panel-grid--production">
        <div className="card-list">
          {batchesQuery.data.data.map((batch) => (
            <article className="workflow-card" key={`${batch.itemName}-${batch.operatorName}`}>
              <div className="workflow-card__top">
                <span className="pill">{batch.status}</span>
                <span className="meta">{batch.operatorName}</span>
              </div>
              <h4>{batch.itemName}</h4>
              <p>Локација: {batch.locationName}</p>
              <p>Термин: {batch.termLabel}</p>
              <p>Испечено: {batch.actualQty}</p>
              <p>Почеток: {batch.startTime}</p>
              <p>Режим на внес: {modeLabel}</p>
              <div className="workflow-card__actions">
                <button className="ghost-button">Внеси отпад · {modeLabel}</button>
                <button className="action-button">Заврши тура · {modeLabel}</button>
              </div>
            </article>
          ))}
        </div>

        <aside className="panel">
          <div className="panel-header">
            <h3>Последен отпад · {modeLabel}</h3>
          </div>
          {wasteQuery.data?.data.map((entry) => (
            <div className="list-card" key={entry.wasteEntryId}>
              {entry.locationName} · {entry.itemName} · {entry.quantity} · {entry.reason}
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}
