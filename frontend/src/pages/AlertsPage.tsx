import { useAlerts } from "../lib/queries";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";

export function AlertsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useAlerts();

  if (!isAdministrator(user)) {
    return <PageState message="Алармите ги следи администратор." />;
  }

  if (isLoading) {
    return <PageState message="Се вчитуваат аларми..." />;
  }

  if (isError || !data) {
    return <PageState message="Не може да се вчитаат алармите." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Контрола</p>
          <h3>Аларми и ескалации</h3>
        </div>
      </header>

      <div className="card-list">
        {data.data.map((alert) => (
          <article className="workflow-card" key={alert.alertId}>
            <div className="workflow-card__top">
              <span className={`severity severity--${alert.severity}`}>{alert.severity}</span>
              <span className="status-chip">{alert.status}</span>
            </div>
            <h4>{alert.locationName}</h4>
            <p>{alert.itemName}</p>
            <p>{alert.message}</p>
            <div className="workflow-card__actions">
              <button className="ghost-button">Потврди</button>
              <button className="action-button">Затвори</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
