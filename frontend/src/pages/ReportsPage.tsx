import { useEffect, useMemo } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useExportPlanVsActualExcel, useExportPlanVsActualPdf, useOperatorEntries, usePlanVsActualReport } from "../lib/queries";

const reports = [
  "Извештај за испечено",
  "Дневен план vs реализација",
  "Печење vs продажба",
  "Отпад по артикал",
  "Отпад по локација"
];

export function ReportsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = usePlanVsActualReport();
  const exportExcel = useExportPlanVsActualExcel();
  const exportPdf = useExportPlanVsActualPdf();
  const operatorEntriesQuery = useOperatorEntries();

  useEffect(() => {
    if (exportExcel.data?.data) {
      downloadFile(
        exportExcel.data.data.fileName,
        exportExcel.data.data.contentType,
        exportExcel.data.data.contentBase64
      );
    }
  }, [exportExcel.data]);

  useEffect(() => {
    if (exportPdf.data?.data) {
      openPrintableDocument(
        exportPdf.data.data.fileName,
        exportPdf.data.data.contentType,
        exportPdf.data.data.contentBase64
      );
    }
  }, [exportPdf.data]);

  const bakedSummary = useMemo(() => {
    if (!data?.data) {
      return [];
    }

    return [...data.data.rows]
      .sort((left, right) => right.bakedQty - left.bakedQty)
      .slice(0, 4);
  }, [data]);

  const pijaraReport = useMemo(() => {
    const pijaraEntries = (operatorEntriesQuery.data?.data ?? []).filter((entry) => entry.mode === "pijara");
    const rows = pijaraEntries.flatMap((entry) =>
      (entry.items ?? []).map((item) => ({
        id: `${entry.id}-${item.itemName}`,
        createdAt: entry.createdAt,
        locationName: entry.locationName ?? "Непозната локација",
        itemName: item.itemName,
        quantity: item.quantity,
        classBQuantity: item.classB ? item.classBQuantity ?? 0 : 0
      }))
    );

    return {
      totalEntries: pijaraEntries.length,
      totalItems: rows.reduce((sum, row) => sum + row.quantity, 0),
      totalClassB: rows.reduce((sum, row) => sum + row.classBQuantity, 0),
      rows
    };
  }, [operatorEntriesQuery.data]);

  if (!isAdministrator(user)) {
    return <PageState message="Извештаите се достапни само за администратор." />;
  }

  if (isLoading || operatorEntriesQuery.isLoading) {
    return <PageState message="Се вчитуваат извештаите..." />;
  }

  if (isError || !data || operatorEntriesQuery.isError) {
    return <PageState message="Не може да се вчита извештајот." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Аналитика</p>
          <h3>Извештаи за испечено и реализација</h3>
          <p className="meta">Администраторот тука вади извештај што е испечено, што е планирано и колкава е разликата.</p>
        </div>
      </header>

      <section className="admin-hero-grid">
        <article className="admin-stat-tile">
          <span>Вкупно испечено</span>
          <strong>{data.data.totals.bakedQty}</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Вкупно планирано</span>
          <strong>{data.data.totals.plannedQty}</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Реализација</span>
          <strong>{data.data.totals.realizationPct}%</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Пијара · Класа Б</span>
          <strong>{pijaraReport.totalClassB}</strong>
        </article>
      </section>

      <div className="card-list reports-grid">
        {reports.map((report) => (
          <article className="workflow-card admin-tile-card" key={report}>
            <h4>{report}</h4>
            <p>Excel и PDF извоз со фокус на испечено, разлики и реализација по маркет и артикал.</p>
            <div className="workflow-card__actions">
              <button
                className="ghost-button"
                type="button"
                disabled={exportExcel.isPending}
                onClick={() => exportExcel.mutate()}
              >
                {exportExcel.isPending ? "Генерира..." : "Excel"}
              </button>
              <button
                className="action-button"
                type="button"
                disabled={exportPdf.isPending}
                onClick={() => exportPdf.mutate()}
              >
                {exportPdf.isPending ? "Генерира..." : "PDF"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {(exportExcel.error || exportPdf.error) && (
        <div className="form-error">
          {((exportExcel.error || exportPdf.error) as Error).message}
        </div>
      )}

      <section className="panel">
        <div className="panel-header">
          <h3>Најмногу испечено</h3>
        </div>
        <div className="card-list admin-summary-grid">
          {bakedSummary.map((row) => (
            <article className="workflow-card admin-tile-card" key={`${row.locationName}-${row.itemName}`}>
              <h4>{row.itemName}</h4>
              <p>Маркет: {row.locationName}</p>
              <p>Испечено: {row.bakedQty}</p>
              <p>План: {row.plannedQty}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Преглед: План vs реализација</h3>
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

      <section className="panel">
        <div className="panel-header">
          <h3>Пијара · Класа Б извештај</h3>
        </div>

        <div className="admin-summary-grid">
          <article className="admin-stat-tile">
            <span>Пријави</span>
            <strong>{pijaraReport.totalEntries}</strong>
          </article>
          <article className="admin-stat-tile">
            <span>Вкупна количина</span>
            <strong>{pijaraReport.totalItems}</strong>
          </article>
          <article className="admin-stat-tile">
            <span>Вкупно Класа Б</span>
            <strong>{pijaraReport.totalClassB}</strong>
          </article>
        </div>

        {pijaraReport.rows.length === 0 ? (
          <div className="list-card">Сè уште нема пријави за Пијара.</div>
        ) : (
          <div className="report-table">
            {pijaraReport.rows.map((row) => (
              <div className="report-row" key={row.id}>
                <strong>{row.locationName}</strong>
                <span>{row.itemName}</span>
                <span>Количина {row.quantity}</span>
                <span>Класа Б {row.classBQuantity}</span>
                <span>{row.createdAt}</span>
                <span>{row.classBQuantity > 0 ? "Пријавено" : "Без Класа Б"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function downloadFile(fileName: string, contentType: string, contentBase64: string) {
  const blob = base64ToBlob(contentBase64, contentType);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function openPrintableDocument(fileName: string, contentType: string, contentBase64: string) {
  const blob = base64ToBlob(contentBase64, contentType);
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, "_blank", "noopener,noreferrer");

  if (popup) {
    popup.document.title = fileName;
  }
}

function base64ToBlob(contentBase64: string, contentType: string) {
  const bytes = Uint8Array.from(atob(contentBase64), (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: contentType });
}
