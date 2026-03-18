import { usePlanVsActualReport } from "../lib/queries";
import { PageState } from "../components/PageState";

export function ReportsPage() {
  const { data, isLoading, isError } = usePlanVsActualReport();

  if (isLoading) {
    return <PageState message="Се вчитуваат извештаите..." />;
  }

  if (isError || !data) {
    return <PageState message="Не може да се вчита извештајот." />;
  }

  const reports = [
    "Дневен план vs реализација",
    "Печење vs продажба",
    "Отпад по артикал",
    "Отпад по локација",
    "KPI по локација",
    "Финансиска анализа"
  ];

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Аналитика</p>
          <h3>Извештаи и export центар</h3>
        </div>
      </header>

      <div className="card-list reports-grid">
        {reports.map((report) => (
          <article className="workflow-card" key={report}>
            <h4>{report}</h4>
            <p>Excel и PDF извоз со филтри по датум, локација и артикал.</p>
            <div className="workflow-card__actions">
              <button className="ghost-button">Excel</button>
              <button className="action-button">PDF</button>
            </div>
          </article>
        ))}
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>Преглед: План vs реализација</h3>
          <span>реален API shape</span>
        </div>
        <div className="report-table">
          {data.data.rows.map((row) => (
            <div className="report-row" key={`${row.locationName}-${row.itemName}`}>
              <strong>{row.locationName}</strong>
              <span>{row.itemName}</span>
              <span>План {row.plannedQty}</span>
              <span>Печено {row.bakedQty}</span>
              <span>Разлика {row.differenceQty}</span>
              <span>{row.realizationPct}%</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
