import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useAlerts, useBatches, usePlans } from "../lib/queries";

type DifferenceRow = {
  key: string;
  locationName: string;
  itemName: string;
  plannedQty: number;
  bakedQty: number;
  differenceQty: number;
};

export function AlertsPage() {
  const { user } = useAuth();
  const alertsQuery = useAlerts();
  const plansQuery = usePlans();
  const batchesQuery = useBatches();

  if (!isAdministrator(user)) {
    return <PageState message="Алармите ги следи администратор." />;
  }

  if (alertsQuery.isLoading || plansQuery.isLoading || batchesQuery.isLoading) {
    return <PageState message="Се вчитуваат аларми..." />;
  }

  if (alertsQuery.isError || plansQuery.isError || batchesQuery.isError || !alertsQuery.data || !plansQuery.data || !batchesQuery.data) {
    return <PageState message="Не може да се вчитаат алармите." />;
  }

  const differences = buildDifferences(plansQuery.data.data, batchesQuery.data.data);
  const criticalRows = differences.filter((entry) => Math.abs(entry.differenceQty) > 0);

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Контрола</p>
          <h3>Аларми и разлика план vs реално печење</h3>
          <p className="meta">Администраторот тука гледа каде недостига, каде има вишок и кои аларми бараат интервенција.</p>
        </div>
      </header>

      <section className="admin-hero-grid">
        <article className="admin-stat-tile">
          <span>Отворени аларми</span>
          <strong>{alertsQuery.data.data.length}</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Разлики план/реално</span>
          <strong>{criticalRows.length}</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Планирани ставки</span>
          <strong>{plansQuery.data.data.length}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Разлика по маркет и артикал</h3>
        </div>
        <div className="card-list admin-summary-grid">
          {criticalRows.map((row) => (
            <article className="workflow-card admin-tile-card" key={row.key}>
              <div className="workflow-card__top">
                <span className={`severity severity--${row.differenceQty < 0 ? "high" : "medium"}`}>
                  {row.differenceQty < 0 ? "Недостиг" : "Вишок"}
                </span>
                <span className="status-chip">{row.differenceQty}</span>
              </div>
              <h4>{row.itemName}</h4>
              <p>Маркет: {row.locationName}</p>
              <p>План: {row.plannedQty}</p>
              <p>Реално: {row.bakedQty}</p>
            </article>
          ))}
          {criticalRows.length === 0 && <div className="list-card">Нема разлика меѓу план и реално печење.</div>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Системски аларми</h3>
        </div>
        <div className="card-list admin-summary-grid">
          {alertsQuery.data.data.map((alert) => (
            <article className="workflow-card admin-tile-card" key={alert.alertId}>
              <div className="workflow-card__top">
                <span className={`severity severity--${alert.severity}`}>{alert.severity}</span>
                <span className="status-chip">{alert.status}</span>
              </div>
              <h4>{alert.locationName}</h4>
              <p>{alert.itemName}</p>
              <p>{alert.message}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function buildDifferences(plans: Array<{ locationName: string; itemName: string; correctedQty: number }>, batches: Array<{ locationName: string; itemName: string; actualQty: number }>) {
  const summary = new Map<string, DifferenceRow>();

  for (const plan of plans) {
    const key = `${plan.locationName}::${plan.itemName}`;
    const current = summary.get(key) ?? {
      key,
      locationName: plan.locationName,
      itemName: plan.itemName,
      plannedQty: 0,
      bakedQty: 0,
      differenceQty: 0
    };
    current.plannedQty += plan.correctedQty;
    current.differenceQty = current.bakedQty - current.plannedQty;
    summary.set(key, current);
  }

  for (const batch of batches) {
    const key = `${batch.locationName}::${batch.itemName}`;
    const current = summary.get(key) ?? {
      key,
      locationName: batch.locationName,
      itemName: batch.itemName,
      plannedQty: 0,
      bakedQty: 0,
      differenceQty: 0
    };
    current.bakedQty += batch.actualQty;
    current.differenceQty = current.bakedQty - current.plannedQty;
    summary.set(key, current);
  }

  return Array.from(summary.values()).sort((left, right) => Math.abs(right.differenceQty) - Math.abs(left.differenceQty));
}
