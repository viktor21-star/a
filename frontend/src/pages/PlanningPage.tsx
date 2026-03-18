import { useEffect, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useItems, useLocations, usePlans } from "../lib/queries";

type ManualPlanEntry = {
  locationId: number;
  itemId: number;
  termLabel: string;
  plannedQty: number;
};

export function PlanningPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = usePlans();
  const locationsQuery = useLocations();
  const itemsQuery = useItems();
  const [manualPlans, setManualPlans] = useState<ManualPlanEntry[]>([]);
  const [draft, setDraft] = useState<ManualPlanEntry>({
    locationId: 1,
    itemId: 1,
    termLabel: "Утрински термин",
    plannedQty: 12
  });

  useEffect(() => {
    const raw = window.localStorage.getItem("pecenje-manual-plans");
    if (!raw) {
      return;
    }

    try {
      setManualPlans(JSON.parse(raw) as ManualPlanEntry[]);
    } catch {
      window.localStorage.removeItem("pecenje-manual-plans");
    }
  }, []);

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

  const locations = locationsQuery.data?.data ?? [];
  const items = itemsQuery.data?.data ?? [];

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Планирање</p>
          <h3>Дневен план на печење</h3>
        </div>
        <button className="action-button">Генерирај план</button>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Интерен внес на план по локација</h3>
        </div>
        <div className="master-form master-form--inline">
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
          <input
            value={draft.termLabel}
            onChange={(event) => setDraft((current) => ({ ...current, termLabel: event.target.value }))}
            placeholder="Термин"
          />
          <input
            type="number"
            min="0"
            value={draft.plannedQty}
            onChange={(event) => setDraft((current) => ({ ...current, plannedQty: Number(event.target.value) }))}
            placeholder="Количина"
          />
          <button
            className="action-button"
            type="button"
            onClick={() => {
              const next = [draft, ...manualPlans];
              setManualPlans(next);
              window.localStorage.setItem("pecenje-manual-plans", JSON.stringify(next));
            }}
          >
            Додади во план
          </button>
        </div>

        {manualPlans.length > 0 && (
          <div className="report-table">
            {manualPlans.map((entry, index) => (
              <div className="report-row report-row--manual-plan" key={`${entry.locationId}-${entry.itemId}-${index}`}>
                <span>{locations.find((location) => location.locationId === entry.locationId)?.nameMk ?? entry.locationId}</span>
                <span>{items.find((item) => item.itemId === entry.itemId)?.nameMk ?? entry.itemId}</span>
                <span>{entry.termLabel}</span>
                <strong>{entry.plannedQty}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="card-list">
        {data.data.map((card) => (
          <article className="workflow-card" key={`${card.termLabel}-${card.itemName}`}>
            <div className="workflow-card__top">
              <span className="pill">{card.termLabel}</span>
              <span className="status-chip">{card.status}</span>
            </div>
            <h4>{card.itemName}</h4>
            <p>Локација: {card.locationName}</p>
            <p>Предложено: {card.suggestedQty}</p>
            <p>Коригирано: {card.correctedQty}</p>
            <div className="workflow-card__actions">
              <button className="ghost-button">Коригирај</button>
              <button className="action-button">Одобри</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
