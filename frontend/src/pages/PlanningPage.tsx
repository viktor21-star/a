import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useLocations, usePlans } from "../lib/queries";

type PlanningMode = "pekara" | "pecenjara";

type ManualPlanEntry = {
  mode: PlanningMode;
  locationId: number;
  plannedTime: string;
  plannedQty: number;
};

const STORAGE_KEY = "pecenje-manual-plans";

export function PlanningPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = usePlans();
  const locationsQuery = useLocations();
  const [selectedMode, setSelectedMode] = useState<PlanningMode | null>(null);
  const [manualPlans, setManualPlans] = useState<ManualPlanEntry[]>([]);
  const [nameSearch, setNameSearch] = useState("");
  const [codeSearch, setCodeSearch] = useState("");
  const [draft, setDraft] = useState<ManualPlanEntry>({
    mode: "pekara",
    locationId: 1,
    plannedTime: "07:00",
    plannedQty: 12
  });

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Array<
        ManualPlanEntry & { termLabel?: string; itemId?: number; mode?: PlanningMode }
      >;
      setManualPlans(
        parsed.map((entry) => ({
          mode: entry.mode ?? "pekara",
          locationId: entry.locationId,
          plannedQty: entry.plannedQty,
          plannedTime: entry.plannedTime ?? extractTime(entry.termLabel)
        }))
      );
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("mode");
    if (requestedMode === "pekara" || requestedMode === "pecenjara") {
      setSelectedMode(requestedMode);
      setDraft((current) => ({ ...current, mode: requestedMode }));
    }
  }, []);

  const locations = locationsQuery.data?.data ?? [];
  const filteredLocations = useMemo(() => {
    const nameQuery = nameSearch.trim().toLowerCase();
    const codeQuery = codeSearch.trim().toLowerCase();

    return locations.filter((location) => {
      const matchesName = !nameQuery || location.nameMk.toLowerCase().includes(nameQuery);
      const matchesCode = !codeQuery || location.code.toLowerCase().includes(codeQuery);
      return matchesName && matchesCode;
    });
  }, [codeSearch, locations, nameSearch]);

  useEffect(() => {
    if (!filteredLocations.length) {
      return;
    }

    setDraft((current) => {
      if (filteredLocations.some((location) => location.locationId === current.locationId)) {
        return current;
      }

      return { ...current, locationId: filteredLocations[0].locationId };
    });
  }, [filteredLocations]);

  const totals = useMemo(() => {
    const rows = selectedMode ? manualPlans.filter((entry) => entry.mode === selectedMode) : manualPlans;
    return rows.reduce(
      (summary, entry) => ({
        markets: new Set([...summary.markets, entry.locationId]),
        qty: summary.qty + entry.plannedQty
      }),
      { markets: new Set<number>(), qty: 0 }
    );
  }, [manualPlans, selectedMode]);

  const visiblePlans = useMemo(() => {
    const rows = selectedMode ? manualPlans.filter((entry) => entry.mode === selectedMode) : manualPlans;
    return [...rows].sort((left, right) => left.plannedTime.localeCompare(right.plannedTime));
  }, [manualPlans, selectedMode]);

  if (isLoading || locationsQuery.isLoading) {
    return <PageState message="Се вчитува планот..." />;
  }

  if (isError || !data || locationsQuery.isError) {
    return <PageState message="Не може да се вчита планот." />;
  }

  if (!isAdministrator(user)) {
    return <PageState message="Планот на печење го внесува и следи администратор." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Планирање</p>
          <h3>{selectedMode ? `План за ${selectedMode === "pekara" ? "Пекара" : "Печењара"}` : "Избери дел за планирање"}</h3>
          <p className="meta">
            {selectedMode
              ? "Администраторот внесува само време, локација и количина. Артикал не се избира."
              : "Планот се дели на две големи кочки: Пекара и Печењара."}
          </p>
        </div>
        {selectedMode && (
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              setSelectedMode(null);
              setDraft((current) => ({ ...current, mode: "pekara" }));
              window.history.replaceState({}, "", "/planning");
            }}
          >
            Назад
          </button>
        )}
      </header>

      {!selectedMode && (
        <section className="operator-mode-grid">
          <button
            type="button"
            className="operator-mode-card"
            onClick={() => {
              setSelectedMode("pekara");
              setDraft((current) => ({ ...current, mode: "pekara" }));
              window.history.replaceState({}, "", "/planning?mode=pekara");
            }}
          >
            <strong>Пекара</strong>
            <span>План по локација, време и количина за пекарски производи.</span>
          </button>

          <button
            type="button"
            className="operator-mode-card"
            onClick={() => {
              setSelectedMode("pecenjara");
              setDraft((current) => ({ ...current, mode: "pecenjara" }));
              window.history.replaceState({}, "", "/planning?mode=pecenjara");
            }}
          >
            <strong>Печењара</strong>
            <span>План по локација, време и количина за печењара.</span>
          </button>
        </section>
      )}

      {selectedMode && (
        <>
          <section className="admin-hero-grid">
            <article className="admin-stat-tile">
              <span>Локации во план</span>
              <strong>{totals.markets.size}</strong>
            </article>
            <article className="admin-stat-tile">
              <span>Вкупно планирани парчиња</span>
              <strong>{totals.qty}</strong>
            </article>
            <article className="admin-stat-tile">
              <span>Системски редови</span>
              <strong>{data.data.filter((card) => mapPlanCardMode(card.itemName) === selectedMode).length}</strong>
            </article>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h3>Избери локација</h3>
            </div>
            <div className="master-form master-form--inline">
              <input
                className="search-input"
                value={nameSearch}
                placeholder="Пребарај по име на локација"
                onChange={(event) => setNameSearch(event.target.value)}
              />
              <input
                className="search-input"
                value={codeSearch}
                placeholder="Пребарај по шифра на локација"
                onChange={(event) => setCodeSearch(event.target.value)}
              />
            </div>
          </section>

          <section className="admin-form-grid">
            <article className="admin-input-tile">
              <span>1. Одбери локација</span>
              <select
                value={draft.locationId}
                onChange={(event) => setDraft((current) => ({ ...current, locationId: Number(event.target.value) }))}
              >
                {filteredLocations.map((location) => (
                  <option key={location.locationId} value={location.locationId}>
                    {location.code} · {location.nameMk}
                  </option>
                ))}
              </select>
            </article>

            <article className="admin-input-tile">
              <span>2. Внеси време на печење</span>
              <input
                type="time"
                value={draft.plannedTime}
                onChange={(event) => setDraft((current) => ({ ...current, plannedTime: event.target.value }))}
              />
            </article>

            <article className="admin-input-tile">
              <span>3. Внеси количина</span>
              <input
                type="number"
                min="0"
                value={draft.plannedQty}
                onChange={(event) => setDraft((current) => ({ ...current, plannedQty: Number(event.target.value) }))}
              />
            </article>

            <article className="admin-input-tile admin-input-tile--action">
              <span>4. Сними план</span>
              <button
                className="action-button"
                type="button"
                onClick={() => {
                  if (!draft.locationId || !draft.plannedTime || draft.plannedQty <= 0) {
                    return;
                  }

                  const nextEntry: ManualPlanEntry = {
                    mode: selectedMode,
                    locationId: draft.locationId,
                    plannedTime: draft.plannedTime,
                    plannedQty: draft.plannedQty
                  };
                  const next = [nextEntry, ...manualPlans];
                  setManualPlans(next);
                  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                }}
              >
                Додади план
              </button>
            </article>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h3>Рачно внесен план</h3>
            </div>
            <div className="card-list admin-summary-grid">
              {visiblePlans.map((entry, index) => (
                <article className="workflow-card admin-tile-card" key={`${entry.mode}-${entry.locationId}-${entry.plannedTime}-${index}`}>
                  <div className="workflow-card__top">
                    <span className="pill">{entry.plannedTime}</span>
                    <span className="status-chip">{entry.mode === "pekara" ? "Пекара" : "Печењара"}</span>
                  </div>
                  <h4>{locations.find((location) => location.locationId === entry.locationId)?.nameMk ?? entry.locationId}</h4>
                  <p>Шифра: {locations.find((location) => location.locationId === entry.locationId)?.code ?? "-"}</p>
                  <p>Количина: {entry.plannedQty}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function extractTime(termLabel?: string) {
  if (!termLabel) {
    return "07:00";
  }

  const match = termLabel.match(/(\d{1,2}:\d{2})/);
  return match?.[1] ?? "07:00";
}

function mapPlanCardMode(itemName: string) {
  const normalized = itemName.toLowerCase();
  return ["пиле", "мес", "ќебап", "кобас", "скара", "грил"].some((value) => normalized.includes(value))
    ? "pecenjara"
    : "pekara";
}
