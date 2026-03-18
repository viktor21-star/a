import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useItems, useLocations, usePlans } from "../lib/queries";

type ManualPlanEntry = {
  locationId: number;
  itemId: number;
  plannedTime: string;
  plannedQty: number;
};

const STORAGE_KEY = "pecenje-manual-plans";

export function PlanningPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = usePlans();
  const locationsQuery = useLocations();
  const itemsQuery = useItems();
  const [manualPlans, setManualPlans] = useState<ManualPlanEntry[]>([]);
  const [draft, setDraft] = useState<ManualPlanEntry>({
    locationId: 1,
    itemId: 1,
    plannedTime: "07:00",
    plannedQty: 12
  });

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Array<ManualPlanEntry & { termLabel?: string }>;
      setManualPlans(
        parsed.map((entry) => ({
          locationId: entry.locationId,
          itemId: entry.itemId,
          plannedQty: entry.plannedQty,
          plannedTime: entry.plannedTime ?? extractTime(entry.termLabel)
        }))
      );
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const locations = locationsQuery.data?.data ?? [];
  const items = itemsQuery.data?.data ?? [];

  const totals = useMemo(() => {
    return manualPlans.reduce(
      (summary, entry) => ({
        markets: new Set([...summary.markets, entry.locationId]),
        qty: summary.qty + entry.plannedQty
      }),
      { markets: new Set<number>(), qty: 0 }
    );
  }, [manualPlans]);

  if (isLoading) {
    return <PageState message="Се вчитува планот..." />;
  }

  if (isError || !data || locationsQuery.isError || itemsQuery.isError) {
    return <PageState message="Не може да се вчита планот." />;
  }

  if (!isAdministrator(user)) {
    return <PageState message="Планот на печење го внесува и следи администратор." />;
  }

  if (locationsQuery.isLoading || itemsQuery.isLoading) {
    return <PageState message="Се вчитуваат локации и артикли..." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Планирање</p>
          <h3>План на печење по маркет, саат и количина</h3>
          <p className="meta">Администраторот го внесува планот како големи кочки: маркет, артикал, саат и количина.</p>
        </div>
      </header>

      <section className="admin-hero-grid">
        <article className="admin-stat-tile">
          <span>Маркетите во план</span>
          <strong>{totals.markets.size}</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Вкупно планирани парчиња</span>
          <strong>{totals.qty}</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Автоматски предлог</span>
          <strong>{data.data.length}</strong>
        </article>
      </section>

      <section className="admin-form-grid">
        <article className="admin-input-tile">
          <span>1. Одбери маркет</span>
          <select
            value={draft.locationId}
            onChange={(event) => setDraft((current) => ({ ...current, locationId: Number(event.target.value) }))}
          >
            {locations.map((location) => (
              <option key={location.locationId} value={location.locationId}>
                {location.nameMk}
              </option>
            ))}
          </select>
        </article>

        <article className="admin-input-tile">
          <span>2. Одбери артикал</span>
          <select
            value={draft.itemId}
            onChange={(event) => setDraft((current) => ({ ...current, itemId: Number(event.target.value) }))}
          >
            {items.map((item) => (
              <option key={item.itemId} value={item.itemId}>
                {item.nameMk}
              </option>
            ))}
          </select>
        </article>

        <article className="admin-input-tile">
          <span>3. Внеси саат</span>
          <input
            type="time"
            value={draft.plannedTime}
            onChange={(event) => setDraft((current) => ({ ...current, plannedTime: event.target.value }))}
          />
        </article>

        <article className="admin-input-tile">
          <span>4. Внеси количина</span>
          <input
            type="number"
            min="0"
            value={draft.plannedQty}
            onChange={(event) => setDraft((current) => ({ ...current, plannedQty: Number(event.target.value) }))}
          />
        </article>
      </section>

      <div className="page-header">
        <div>
          <p className="topbar-eyebrow">Акција</p>
          <h3>Сними во план</h3>
        </div>
        <button
          className="action-button"
          type="button"
          onClick={() => {
            if (!draft.locationId || !draft.itemId || !draft.plannedTime || draft.plannedQty <= 0) {
              return;
            }

            const next = [draft, ...manualPlans];
            setManualPlans(next);
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          }}
        >
          Додади план
        </button>
      </div>

      {manualPlans.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h3>Рачно внесен план</h3>
          </div>
          <div className="card-list admin-summary-grid">
            {manualPlans.map((entry, index) => (
              <article className="workflow-card admin-tile-card" key={`${entry.locationId}-${entry.itemId}-${entry.plannedTime}-${index}`}>
                <div className="workflow-card__top">
                  <span className="pill">{entry.plannedTime}</span>
                  <span className="status-chip">Планирано</span>
                </div>
                <h4>{items.find((item) => item.itemId === entry.itemId)?.nameMk ?? entry.itemId}</h4>
                <p>Маркет: {locations.find((location) => location.locationId === entry.locationId)?.nameMk ?? entry.locationId}</p>
                <p>Количина: {entry.plannedQty}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <h3>Предложен план од системот</h3>
        </div>
        <div className="card-list admin-summary-grid">
          {data.data.map((card) => (
            <article className="workflow-card admin-tile-card" key={`${card.termLabel}-${card.itemName}-${card.locationId}`}>
              <div className="workflow-card__top">
                <span className="pill">{card.termLabel}</span>
                <span className="status-chip">{card.status}</span>
              </div>
              <h4>{card.itemName}</h4>
              <p>Маркет: {card.locationName}</p>
              <p>Предлог: {card.suggestedQty}</p>
              <p>Корекција: {card.correctedQty}</p>
            </article>
          ))}
        </div>
      </section>
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
