import { useEffect, useMemo, useRef, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useOperatorEntries, usePlanVsActualReport, useWasteEntries } from "../lib/queries";

type ReportDefinition = {
  id: string;
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
  fileName: string;
};

type PreviewState =
  | { type: "table"; report: ReportDefinition }
  | { type: "pdf"; report: ReportDefinition; url: string }
  | null;

export function ReportsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = usePlanVsActualReport();
  const operatorEntriesQuery = useOperatorEntries();
  const wasteEntriesQuery = useWasteEntries();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [preview, setPreview] = useState<PreviewState>(null);

  const bakedRows = useMemo(() => {
    const map = new Map<string, { locationName: string; itemName: string; mode: string; quantity: number; entries: number }>();
    (operatorEntriesQuery.data?.data ?? [])
      .filter((entry) => entry.mode !== "pijara")
      .forEach((entry) => {
        entry.items.forEach((item) => {
          const key = `${entry.locationName}|${item.itemName}|${entry.mode}`;
          const current = map.get(key) ?? {
            locationName: entry.locationName,
            itemName: item.itemName,
            mode: entry.mode,
            quantity: 0,
            entries: 0
          };
          current.quantity += item.quantity;
          current.entries += 1;
          map.set(key, current);
        });
      });

    return [...map.values()]
      .sort((left, right) => right.quantity - left.quantity)
      .map((row) => [
        row.locationName,
        row.mode === "pekara" ? "Пекара" : "Печењара",
        row.itemName,
        String(row.quantity),
        String(row.entries)
      ]);
  }, [operatorEntriesQuery.data]);

  const planVsActualRows = useMemo(
    () =>
      (data?.data.rows ?? []).map((row) => [
        row.locationName,
        row.itemName,
        String(row.plannedQty),
        String(row.bakedQty),
        String(row.differenceQty),
        `${row.realizationPct}%`
      ]),
    [data]
  );

  const pijaraRows = useMemo(() => {
    return (operatorEntriesQuery.data?.data ?? [])
      .filter((entry) => entry.mode === "pijara")
      .flatMap((entry) =>
        entry.items.map((item) => [
          entry.locationName,
          item.itemName,
          String(item.quantity),
          String(item.classB ? item.classBQuantity : 0),
          entry.createdAt
        ])
      );
  }, [operatorEntriesQuery.data]);

  const wasteByItemRows = useMemo(() => {
    const map = new Map<string, { itemName: string; sourceMode: string; quantity: number; entries: number }>();
    (wasteEntriesQuery.data?.data ?? []).forEach((entry) => {
      const key = `${entry.itemName}|${entry.sourceMode}`;
      const current = map.get(key) ?? {
        itemName: entry.itemName,
        sourceMode: entry.sourceMode,
        quantity: 0,
        entries: 0
      };
      current.quantity += entry.quantity;
      current.entries += 1;
      map.set(key, current);
    });

    return [...map.values()]
      .sort((left, right) => right.quantity - left.quantity)
      .map((row) => [row.itemName, sourceLabel(row.sourceMode), String(row.quantity), String(row.entries)]);
  }, [wasteEntriesQuery.data]);

  const wasteByLocationRows = useMemo(() => {
    const map = new Map<string, { locationName: string; quantity: number; entries: number }>();
    (wasteEntriesQuery.data?.data ?? []).forEach((entry) => {
      const current = map.get(entry.locationName) ?? {
        locationName: entry.locationName,
        quantity: 0,
        entries: 0
      };
      current.quantity += entry.quantity;
      current.entries += 1;
      map.set(entry.locationName, current);
    });

    return [...map.values()]
      .sort((left, right) => right.quantity - left.quantity)
      .map((row) => [row.locationName, String(row.quantity), String(row.entries)]);
  }, [wasteEntriesQuery.data]);

  const reports = useMemo<ReportDefinition[]>(
    () => [
      {
        id: "baked",
        title: "Извештај за испечено",
        description: "Преглед на испечени количини по локација, модул и артикал.",
        columns: ["Локација", "Модул", "Артикал", "Количина", "Пријави"],
        rows: bakedRows,
        fileName: "ispeceno"
      },
      {
        id: "plan-vs-actual",
        title: "Дневен план vs реализација",
        description: "План, печено и разлика по локација и артикал.",
        columns: ["Локација", "Артикал", "План", "Печено", "Разлика", "% Реализација"],
        rows: planVsActualRows,
        fileName: "plan-vs-realizacija"
      },
      {
        id: "pijara",
        title: "Пијара · Класа Б",
        description: "Преглед на пријави од Пијара и количина за Класа Б.",
        columns: ["Локација", "Артикал", "Количина", "Класа Б", "Време"],
        rows: pijaraRows,
        fileName: "pijara-klasa-b"
      },
      {
        id: "waste-item",
        title: "Отпад по артикал",
        description: "Агрегиран отпад по артикал и изворен дел.",
        columns: ["Артикал", "Оддел", "Количина", "Пријави"],
        rows: wasteByItemRows,
        fileName: "otpad-po-artikal"
      },
      {
        id: "waste-location",
        title: "Отпад по локација",
        description: "Агрегиран отпад по локација.",
        columns: ["Локација", "Количина", "Пријави"],
        rows: wasteByLocationRows,
        fileName: "otpad-po-lokacija"
      }
    ],
    [bakedRows, planVsActualRows, pijaraRows, wasteByItemRows, wasteByLocationRows]
  );

  useEffect(() => {
    return () => {
      if (preview?.type === "pdf") {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  if (!isAdministrator(user)) {
    return <PageState message="Извештаите се достапни само за администратор." />;
  }

  if (isLoading || operatorEntriesQuery.isLoading || wasteEntriesQuery.isLoading) {
    return <PageState message="Се вчитуваат извештаите..." />;
  }

  if (isError || !data || operatorEntriesQuery.isError || wasteEntriesQuery.isError) {
    return <PageState message="Не може да се вчита извештајот." />;
  }

  const totals = data.data.totals;

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Аналитика</p>
          <h3>Извештаи</h3>
          <p className="meta">Преглед, Excel и PDF preview со можност за download и враќање назад.</p>
        </div>
      </header>

      <section className="admin-hero-grid">
        <article className="admin-stat-tile">
          <span>Вкупно испечено</span>
          <strong>{totals.bakedQty}</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Вкупно планирано</span>
          <strong>{totals.plannedQty}</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Реализација</span>
          <strong>{totals.realizationPct}%</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Вкупен отпад</span>
          <strong>{wasteEntriesQuery.data?.data.reduce((sum, row) => sum + row.quantity, 0) ?? 0}</strong>
        </article>
      </section>

      {preview && (
        <section className="panel report-preview-panel">
          <div className="panel-header">
            <h3>
              {preview.report.title} · {preview.type === "pdf" ? "PDF preview" : "Табеларен preview"}
            </h3>
            <div className="workflow-card__actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  if (preview.type === "pdf") {
                    URL.revokeObjectURL(preview.url);
                  }
                  setPreview(null);
                }}
              >
                Назад
              </button>
              {preview.type === "table" && (
                <button
                  className="action-button"
                  type="button"
                  onClick={() => downloadCsv(preview.report)}
                >
                  Симни Excel
                </button>
              )}
              {preview.type === "pdf" && (
                <>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => iframeRef.current?.contentWindow?.print()}
                  >
                    Печати / Зачувај како PDF
                  </button>
                  <button
                    className="action-button"
                    type="button"
                    onClick={() => downloadBlobUrl(preview.url, `${preview.report.fileName}.html`)}
                  >
                    Симни preview
                  </button>
                </>
              )}
            </div>
          </div>

          {preview.type === "table" ? (
            <div className="report-preview-table">
              <div className="report-preview-head">
                {preview.report.columns.map((column) => (
                  <strong key={column}>{column}</strong>
                ))}
              </div>
              {preview.report.rows.length === 0 ? (
                <div className="list-card">Нема податоци за овој извештај.</div>
              ) : (
                preview.report.rows.map((row, index) => (
                  <div className="report-preview-body" key={`${preview.report.id}-${index}`}>
                    {row.map((cell, cellIndex) => (
                      <span key={`${preview.report.id}-${index}-${cellIndex}`}>{cell}</span>
                    ))}
                  </div>
                ))
              )}
            </div>
          ) : (
            <iframe ref={iframeRef} className="report-preview-frame" src={preview.url} title={preview.report.title} />
          )}
        </section>
      )}

      <div className="card-list reports-grid">
        {reports.map((report) => (
          <article className="workflow-card admin-tile-card" key={report.id}>
            <h4>{report.title}</h4>
            <p>{report.description}</p>
            <p className="meta">{report.rows.length} редови</p>
            <div className="workflow-card__actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setPreview({ type: "table", report })}
              >
                Табела
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => downloadCsv(report)}
              >
                Excel
              </button>
              <button
                className="action-button"
                type="button"
                onClick={() => {
                  const url = createPdfPreviewUrl(report);
                  setPreview((current) => {
                    if (current?.type === "pdf") {
                      URL.revokeObjectURL(current.url);
                    }
                    return { type: "pdf", report, url };
                  });
                }}
              >
                PDF
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function sourceLabel(mode: string) {
  if (mode === "pekara") {
    return "Пекара";
  }

  if (mode === "pecenjara") {
    return "Печењара";
  }

  return "Пијара";
}

function downloadCsv(report: ReportDefinition) {
  const rows = [report.columns, ...report.rows];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).split("\"").join("\"\"")}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  downloadBlobUrl(url, `${report.fileName}.csv`);
  URL.revokeObjectURL(url);
}

function createPdfPreviewUrl(report: ReportDefinition) {
  const html = `<!doctype html>
<html lang="mk">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #163f31; }
    h1 { margin: 0 0 8px; }
    p { margin: 0 0 20px; color: #537166; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #cfe0d6; padding: 10px; text-align: left; font-size: 14px; }
    th { background: #edf4ef; }
    tr:nth-child(even) td { background: #f8fbf9; }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  <p>${escapeHtml(report.description)}</p>
  <table>
    <thead>
      <tr>${report.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${report.rows.length === 0
        ? `<tr><td colspan="${report.columns.length}">Нема податоци за овој извештај.</td></tr>`
        : report.rows
            .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
            .join("")}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  return URL.createObjectURL(blob);
}

function downloadBlobUrl(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
}

function escapeHtml(value: string) {
  return value
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split("\"").join("&quot;");
}
