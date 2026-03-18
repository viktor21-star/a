import { usePlans } from "../lib/queries";
import { PageState } from "../components/PageState";

export function PlanningPage() {
  const { data, isLoading, isError } = usePlans();

  if (isLoading) {
    return <PageState message="Се вчитува планот..." />;
  }

  if (isError || !data) {
    return <PageState message="Не може да се вчита планот." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Планирање</p>
          <h3>Дневен план на печење</h3>
        </div>
        <button className="action-button">Генерирај план</button>
      </header>

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
