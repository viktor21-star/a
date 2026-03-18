import { useEffect } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useExportPlanVsActualExcel, useExportPlanVsActualPdf, usePlanVsActualReport } from "../lib/queries";

const reports = [
  "Дневен план vs реализација",
  "Печење vs продажба",
  "Отпад по артикал",
  "Отпад по локација",
  "KPI по локација",
  "Финансиска анализа"
];

export function ReportsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = usePlanVsActualReport();
  const exportExcel = useExportPlanVsActualExcel();
  const exportPdf = useExportPlanVsActualPdf();

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

  if (!isAdministrator(user)) {
    return <PageState message="Извештаите се достапни само за администратор." />;
  }

  if (isLoading) {
    return <PageState message="Се вчитуваат извештаите..." />;
  }

  if (isError || !data) {
    return <PageState message="Не може да се вчита извештајот." />;
  }

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
