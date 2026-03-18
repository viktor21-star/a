import { KpiCard } from "../components/KpiCard";
import { PageState } from "../components/PageState";
import { useAlerts, useDashboardOverview } from "../lib/queries";

export function DashboardPage() {
  const overviewQuery = useDashboardOverview();
  const alertsQuery = useAlerts();

  if (overviewQuery.isLoading) {
    return <PageState message="Се вчитува dashboard..." />;
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return <PageState message="Не може да се вчита dashboard." />;
  }

  const overview = overviewQuery.data.data;
  const kpis = [
    { label: "Реализација на план", value: `${overview.network.realizationPct}%`, tone: "good" },
    { label: "% отпад", value: `${overview.network.wastePct}%`, tone: "warn" },
    { label: "% продажба", value: `${overview.network.salesPct}%`, tone: "neutral" },
    { label: "% навремено печење", value: `${overview.network.onTimePct}%`, tone: "good" }
  ];

  return (
    <section className="page-grid">
      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} tone={kpi.tone as "good" | "warn" | "neutral"} />
        ))}
      </div>

      <div className="panel-grid">
        <section className="panel panel--large">
          <div className="panel-header">
            <h3>План vs Реално</h3>
            <span>денес</span>
          </div>
          <div className="chart-placeholder">Chart area</div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>Топ проблематични артикли</h3>
          </div>
          {overview.topProblemItems.map((item) => (
            <div className="list-card" key={item.itemId}>
              {item.itemName} · отпад {item.wastePct}% · недостиг {item.shortagePct}%
            </div>
          ))}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h3>Отворени аларми</h3>
          </div>
          {alertsQuery.data?.data.slice(0, 3).map((alert) => (
            <div className="alert-card" key={alert.alertId}>
              {alert.locationName} · {alert.message}
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}
