import { useEffect, useMemo, useRef, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useLocations, useOperatorEntries, usePlanVsActualReport, useWasteEntries } from "../lib/queries";

type ReportDefinition = {
  id: string;
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
  fileName: string;
};

type ReportSection = "pekara" | "pecenjara" | "pijara";
type DatePreset = "today" | "all" | "custom";

type PreviewState =
  | { type: "table"; report: ReportDefinition }
  | { type: "pdf"; report: ReportDefinition; url: string }
  | null;

export function ReportsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = usePlanVsActualReport();
  const operatorEntriesQuery = useOperatorEntries();
  const wasteEntriesQuery = useWasteEntries();
  const locationsQuery = useLocations(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [selectedSection, setSelectedSection] = useState<ReportSection>("pekara");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [fromDate, setFromDate] = useState(getTodayDateValue());
  const [toDate, setToDate] = useState(getTodayDateValue());

  const operatorEntries = operatorEntriesQuery.data?.data ?? [];
  const wasteEntries = wasteEntriesQuery.data?.data ?? [];
  const planRows = data?.data.rows ?? [];
  const locations = locationsQuery.data?.data ?? [];

  const locationLabelById = useMemo(() => {
    return new Map(
      locations.map((location) => [
        location.locationId,
        formatLocationLabel(location.code, location.nameMk)
      ])
    );
  }, [locations]);

  const locationLabelByCode = useMemo(() => {
    return new Map(
      locations.map((location) => [
        normalizeLocationCode(location.code),
        formatLocationLabel(location.code, location.nameMk)
      ])
    );
  }, [locations]);

  const locationLabelByName = useMemo(() => {
    return new Map(
      locations.map((location) => [
        normalizeName(location.nameMk),
        formatLocationLabel(location.code, location.nameMk)
      ])
    );
  }, [locations]);

  const resolveLocationLabel = (locationName: string, locationId?: number) => {
    if (typeof locationId === "number") {
      const byId = locationLabelById.get(locationId);
      if (byId) {
        return byId;
      }
    }

    const parsedCode = extractLocationCode(locationName);
    if (parsedCode) {
      const byCode = locationLabelByCode.get(parsedCode);
      if (byCode) {
        return byCode;
      }
    }

    const byName = locationLabelByName.get(normalizeName(locationName));
    if (byName) {
      return byName;
    }

    return parsedCode || locationName;
  };

  const availableLocations = useMemo(() => {
    return Array.from(
      new Set([
        ...operatorEntries.map((entry) => resolveLocationLabel(entry.locationName, entry.locationId)),
        ...wasteEntries.map((entry) => resolveLocationLabel(entry.locationName, entry.locationId)),
        ...planRows.map((entry) => resolveLocationLabel(entry.locationName))
      ].filter(Boolean))
    ).sort((left, right) => left.localeCompare(right, "mk-MK"));
  }, [operatorEntries, planRows, wasteEntries, locationLabelByCode, locationLabelById, locationLabelByName]);

  useEffect(() => {
    if (selectedLocation === "all") {
      return;
    }

    if (!availableLocations.includes(selectedLocation)) {
      setSelectedLocation("all");
    }
  }, [availableLocations, selectedLocation]);

  useEffect(() => {
    return () => {
      if (preview?.type === "pdf") {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  const filteredOperatorEntries = useMemo(
    () =>
      operatorEntries.filter(
        (entry) =>
          (selectedLocation === "all" || resolveLocationLabel(entry.locationName, entry.locationId) === selectedLocation) &&
          matchesDateFilter(extractDateOnly(entry.createdAt), datePreset, fromDate, toDate)
      ),
    [datePreset, fromDate, operatorEntries, selectedLocation, toDate, locationLabelByCode, locationLabelById, locationLabelByName]
  );

  const filteredWasteEntries = useMemo(
    () =>
      wasteEntries.filter(
        (entry) =>
          (selectedLocation === "all" || resolveLocationLabel(entry.locationName, entry.locationId) === selectedLocation) &&
          matchesDateFilter(extractDateOnly(entry.createdAt), datePreset, fromDate, toDate)
      ),
    [datePreset, fromDate, selectedLocation, toDate, wasteEntries, locationLabelByCode, locationLabelById, locationLabelByName]
  );

  const filteredPlanRows = useMemo(
    () =>
      planRows.filter(
        (row) =>
          (selectedLocation === "all" || resolveLocationLabel(row.locationName) === selectedLocation) &&
          matchesDateFilter(row.planDate, datePreset, fromDate, toDate)
      ),
    [datePreset, fromDate, planRows, selectedLocation, toDate, locationLabelByCode, locationLabelById, locationLabelByName]
  );

  const bakedRowsBySection = useMemo<Record<ReportSection, string[][]>>(() => {
    const grouped: Record<ReportSection, string[][]> = {
      pekara: [],
      pecenjara: [],
      pijara: []
    };

    const rowsByMode = new Map<string, { date: string; locationName: string; itemName: string; quantity: number; entries: number }>();

    filteredOperatorEntries
      .filter((entry) => entry.mode !== "pijara")
      .forEach((entry) => {
        const date = extractDateOnly(entry.createdAt);
        entry.items.forEach((item) => {
          const key = `${entry.mode}|${date}|${entry.locationName}|${item.itemName}`;
          const current = rowsByMode.get(key) ?? {
            date,
            locationName: resolveLocationLabel(entry.locationName, entry.locationId),
            itemName: item.itemName,
            quantity: 0,
            entries: 0
          };
          current.quantity += item.quantity;
          current.entries += 1;
          rowsByMode.set(key, current);
        });
      });

    for (const [key, value] of rowsByMode.entries()) {
      const [mode] = key.split("|");
      if (mode !== "pekara" && mode !== "pecenjara") {
        continue;
      }

      grouped[mode].push([
        formatDateLabel(value.date),
        value.locationName,
        value.itemName,
        String(value.quantity),
        String(value.entries)
      ]);
    }

    grouped.pekara.sort(compareReportRows);
    grouped.pecenjara.sort(compareReportRows);
    return grouped;
  }, [filteredOperatorEntries]);

  const planVsActualRowsBySection = useMemo<Record<ReportSection, string[][]>>(
    () => ({
      pekara: filteredPlanRows
        .filter((row) => row.mode === "pekara")
        .sort(comparePlanRows)
        .map((row) => [
          formatDateLabel(row.planDate),
          resolveLocationLabel(row.locationName),
          row.itemName,
          row.plannedTime,
          row.actualTime ?? "-",
          row.delayMinutes != null ? String(row.delayMinutes) : "-",
          row.timingStatus,
          String(row.plannedQty),
          String(row.bakedQty),
          String(row.differenceQty),
          `${row.realizationPct}%`
        ]),
      pecenjara: filteredPlanRows
        .filter((row) => row.mode === "pecenjara")
        .sort(comparePlanRows)
        .map((row) => [
          formatDateLabel(row.planDate),
          resolveLocationLabel(row.locationName),
          row.itemName,
          row.plannedTime,
          row.actualTime ?? "-",
          row.delayMinutes != null ? String(row.delayMinutes) : "-",
          row.timingStatus,
          String(row.plannedQty),
          String(row.bakedQty),
          String(row.differenceQty),
          `${row.realizationPct}%`
        ]),
      pijara: []
    }),
    [filteredPlanRows]
  );

  const pijaraRows = useMemo(
    () =>
      filteredOperatorEntries
        .filter((entry) => entry.mode === "pijara")
        .sort((left, right) => compareDescByTimestamp(left.createdAt, right.createdAt))
        .flatMap((entry) =>
          entry.items.map((item) => [
            formatDateLabel(extractDateOnly(entry.createdAt)),
            resolveLocationLabel(entry.locationName, entry.locationId),
            item.itemName,
            String(item.quantity),
            String(item.classB ? item.classBQuantity : 0),
            formatTimeOnly(entry.createdAt)
          ])
        ),
    [filteredOperatorEntries]
  );

  const wasteByItemRowsBySection = useMemo<Record<ReportSection, string[][]>>(() => {
    const grouped = new Map<string, { date: string; itemName: string; sourceMode: string; quantity: number; entries: number }>();

    filteredWasteEntries.forEach((entry) => {
      const date = extractDateOnly(entry.createdAt);
      const key = `${entry.sourceMode}|${date}|${entry.itemName}`;
      const current = grouped.get(key) ?? {
        date,
        itemName: entry.itemName,
        sourceMode: entry.sourceMode,
        quantity: 0,
        entries: 0
      };
      current.quantity += entry.quantity;
      current.entries += 1;
      grouped.set(key, current);
    });

    return {
      pekara: mapWasteRows(grouped, "pekara", "item"),
      pecenjara: mapWasteRows(grouped, "pecenjara", "item"),
      pijara: mapWasteRows(grouped, "pijara", "item")
    };
  }, [filteredWasteEntries]);

  const wasteByLocationRowsBySection = useMemo<Record<ReportSection, string[][]>>(() => {
    const grouped = new Map<string, { date: string; locationName: string; sourceMode: string; quantity: number; entries: number }>();

    filteredWasteEntries.forEach((entry) => {
      const date = extractDateOnly(entry.createdAt);
      const key = `${entry.sourceMode}|${date}|${entry.locationName}`;
      const current = grouped.get(key) ?? {
        date,
        locationName: resolveLocationLabel(entry.locationName, entry.locationId),
        sourceMode: entry.sourceMode,
        quantity: 0,
        entries: 0
      };
      current.quantity += entry.quantity;
      current.entries += 1;
      grouped.set(key, current);
    });

    return {
      pekara: mapWasteRows(grouped, "pekara", "location"),
      pecenjara: mapWasteRows(grouped, "pecenjara", "location"),
      pijara: mapWasteRows(grouped, "pijara", "location")
    };
  }, [filteredWasteEntries]);

  const reportsBySection = useMemo<Record<ReportSection, ReportDefinition[]>>(
    () => ({
      pekara: [
        {
          id: "baked-pekara",
          title: "Извештај за испечено",
          description: "Преглед на испечени количини за Пекара по ден, локација и артикал.",
          columns: ["Датум", "Локација", "Артикал", "Количина", "Пријави"],
          rows: bakedRowsBySection.pekara,
          fileName: "pekara-ispeceno"
        },
        {
          id: "plan-vs-actual-pekara",
          title: "План vs реализација",
          description: "План, печено и разлика за Пекара.",
          columns: ["Датум", "Локација", "Артикал", "Планирано време", "Реално време", "Доцнење (мин)", "Статус", "План", "Печено", "Разлика", "% Реализација"],
          rows: planVsActualRowsBySection.pekara,
          fileName: "pekara-plan-vs-realizacija"
        },
        {
          id: "waste-item-pekara",
          title: "Отпад по артикал",
          description: "Отпад за Пекара по артикал.",
          columns: ["Датум", "Артикал", "Оддел", "Количина", "Пријави"],
          rows: wasteByItemRowsBySection.pekara,
          fileName: "pekara-otpad-po-artikal"
        },
        {
          id: "waste-location-pekara",
          title: "Отпад по локација",
          description: "Отпад за Пекара по локација.",
          columns: ["Датум", "Локација", "Оддел", "Количина", "Пријави"],
          rows: wasteByLocationRowsBySection.pekara,
          fileName: "pekara-otpad-po-lokacija"
        }
      ],
      pecenjara: [
        {
          id: "baked-pecenjara",
          title: "Извештај за испечено",
          description: "Преглед на испечени количини за Печењара по ден, локација и артикал.",
          columns: ["Датум", "Локација", "Артикал", "Количина", "Пријави"],
          rows: bakedRowsBySection.pecenjara,
          fileName: "pecenjara-ispeceno"
        },
        {
          id: "plan-vs-actual-pecenjara",
          title: "План vs реализација",
          description: "План, печено и разлика за Печењара.",
          columns: ["Датум", "Локација", "Артикал", "Планирано време", "Реално време", "Доцнење (мин)", "Статус", "План", "Печено", "Разлика", "% Реализација"],
          rows: planVsActualRowsBySection.pecenjara,
          fileName: "pecenjara-plan-vs-realizacija"
        },
        {
          id: "waste-item-pecenjara",
          title: "Отпад по артикал",
          description: "Отпад за Печењара по артикал.",
          columns: ["Датум", "Артикал", "Оддел", "Количина", "Пријави"],
          rows: wasteByItemRowsBySection.pecenjara,
          fileName: "pecenjara-otpad-po-artikal"
        },
        {
          id: "waste-location-pecenjara",
          title: "Отпад по локација",
          description: "Отпад за Печењара по локација.",
          columns: ["Датум", "Локација", "Оддел", "Количина", "Пријави"],
          rows: wasteByLocationRowsBySection.pecenjara,
          fileName: "pecenjara-otpad-po-lokacija"
        }
      ],
      pijara: [
        {
          id: "pijara",
          title: "Пријави од Пијара",
          description: "Преглед на сите пријавени артикли од Пијара, со вкупна количина и Класа Б.",
          columns: ["Датум", "Локација", "Артикал", "Вкупна количина", "Класа Б количина", "Време"],
          rows: pijaraRows,
          fileName: "pijara-prijavi"
        },
        {
          id: "waste-item-pijara",
          title: "Отпад по артикал",
          description: "Отпад за Пијара по артикал.",
          columns: ["Датум", "Артикал", "Оддел", "Количина", "Пријави"],
          rows: wasteByItemRowsBySection.pijara,
          fileName: "pijara-otpad-po-artikal"
        },
        {
          id: "waste-location-pijara",
          title: "Отпад по локација",
          description: "Отпад за Пијара по локација.",
          columns: ["Датум", "Локација", "Оддел", "Количина", "Пријави"],
          rows: wasteByLocationRowsBySection.pijara,
          fileName: "pijara-otpad-po-lokacija"
        }
      ]
    }),
    [bakedRowsBySection, planVsActualRowsBySection, pijaraRows, wasteByItemRowsBySection, wasteByLocationRowsBySection]
  );

  const reports = reportsBySection[selectedSection];

  const totals = useMemo(() => {
    const sectionMode = selectedSection;
    const baked = filteredOperatorEntries
      .filter((entry) => entry.mode === sectionMode)
      .reduce((sum, entry) => sum + entry.items.reduce((entrySum, item) => entrySum + Number(item.quantity ?? 0), 0), 0);
    const planned = selectedSection === "pijara"
      ? 0
      : filteredPlanRows
          .filter((row) => row.mode === selectedSection)
          .reduce((sum, row) => sum + Number(row.plannedQty ?? 0), 0);
    const waste = filteredWasteEntries
      .filter((entry) => entry.sourceMode === sectionMode)
      .reduce((sum, entry) => sum + Number(entry.quantity ?? 0), 0);
    const rows = reports.reduce((sum, report) => sum + report.rows.length, 0);

    return { baked, planned, waste, rows };
  }, [filteredOperatorEntries, filteredPlanRows, filteredWasteEntries, reports, selectedSection]);

  const pijaraSummary = useMemo(() => {
    const rows = filteredOperatorEntries.filter((entry) => entry.mode === "pijara");
    return {
      reportedQty: rows.reduce(
        (sum, entry) => sum + entry.items.reduce((entrySum, item) => entrySum + Number(item.quantity ?? 0), 0),
        0
      ),
      classBQty: rows.reduce(
        (sum, entry) => sum + entry.items.reduce((entrySum, item) => entrySum + Number(item.classB ? item.classBQuantity ?? 0 : 0), 0),
        0
      ),
      reportedItems: rows.reduce((sum, entry) => sum + entry.items.length, 0)
    };
  }, [filteredOperatorEntries]);

  const filterSummary = useMemo(() => {
    const locationLabel = selectedLocation === "all" ? "Сите локации" : selectedLocation;
    const dateLabel =
      datePreset === "today"
        ? "Само денес"
        : datePreset === "all"
          ? "Сите датуми"
          : `${formatDateLabel(fromDate)} - ${formatDateLabel(toDate)}`;

    return `${locationLabel} · ${dateLabel}`;
  }, [datePreset, fromDate, selectedLocation, toDate]);

  const exportFileNameFor = (report: ReportDefinition) =>
    buildReportExportFileName(report.fileName, selectedLocation, datePreset, fromDate, toDate);

  if (!isAdministrator(user)) {
    return <PageState message="Извештаите се достапни само за администратор." />;
  }

  if (isLoading || operatorEntriesQuery.isLoading || wasteEntriesQuery.isLoading) {
    return <PageState message="Се вчитуваат извештаите..." />;
  }

  const loadingErrorParts = [
    isError || !data ? "plan-vs-realizacija" : null,
    operatorEntriesQuery.isError ? "operatorski-vnesovi" : null,
    wasteEntriesQuery.isError ? "otpad" : null
  ].filter(Boolean);

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Аналитика</p>
          <h3>Извештаи</h3>
          <p className="meta">Филтрирај по денес, период и локација. Секцијата одредува дали гледаш Пекара, Печењара или Пијара.</p>
        </div>
      </header>

      {loadingErrorParts.length > 0 && (
        <div className="form-error">
          Не се вчитани сите извештаи: {loadingErrorParts.join(", ")}. Прикажани се само достапните податоци.
        </div>
      )}

      <section className="panel">
        <div className="panel-header">
          <h3>Филтри</h3>
          <span className="meta">{filterSummary}</span>
        </div>
        <div className="admin-form-grid">
          <label>
            Секција
            <select value={selectedSection} onChange={(event) => setSelectedSection(event.target.value as ReportSection)} className="search-input">
              <option value="pekara">Пекара</option>
              <option value="pecenjara">Печењара</option>
              <option value="pijara">Пијара</option>
            </select>
          </label>
          <label>
            Локација
            <select value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)} className="search-input">
              <option value="all">Сите локации</option>
              {availableLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>
          <label>
            Приказ
            <div className="workflow-card__actions" style={{ marginTop: 8 }}>
              <button
                type="button"
                className={datePreset === "today" ? "action-button" : "ghost-button"}
                onClick={() => setDatePreset("today")}
              >
                Денес
              </button>
              <button
                type="button"
                className={datePreset === "all" ? "action-button" : "ghost-button"}
                onClick={() => setDatePreset("all")}
              >
                Сите
              </button>
              <button
                type="button"
                className={datePreset === "custom" ? "action-button" : "ghost-button"}
                onClick={() => setDatePreset("custom")}
              >
                Период
              </button>
            </div>
          </label>
        </div>
        {datePreset === "custom" && (
          <div className="admin-form-grid">
            <label>
              Од датум
              <input className="search-input report-date-input" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label>
              До датум
              <input className="search-input report-date-input" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
          </div>
        )}
      </section>

      <section className="admin-hero-grid">
        {selectedSection === "pijara" ? (
          <>
            <article className="admin-stat-tile">
              <span>Вкупно пријавено</span>
              <strong>{pijaraSummary.reportedQty}</strong>
            </article>
            <article className="admin-stat-tile">
              <span>Вкупно Класа Б</span>
              <strong>{pijaraSummary.classBQty}</strong>
            </article>
            <article className="admin-stat-tile">
              <span>Пријавени артикли</span>
              <strong>{pijaraSummary.reportedItems}</strong>
            </article>
            <article className="admin-stat-tile">
              <span>Прикажани редови</span>
              <strong>{totals.rows}</strong>
            </article>
          </>
        ) : (
          <>
            <article className="admin-stat-tile">
              <span>Вкупно испечено</span>
              <strong>{totals.baked}</strong>
            </article>
            <article className="admin-stat-tile">
              <span>Вкупно планирано</span>
              <strong>{totals.planned}</strong>
            </article>
            <article className="admin-stat-tile">
              <span>Вкупен отпад</span>
              <strong>{totals.waste}</strong>
            </article>
            <article className="admin-stat-tile">
              <span>Прикажани редови</span>
              <strong>{totals.rows}</strong>
            </article>
          </>
        )}
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
                  onClick={() => downloadCsv(preview.report, exportFileNameFor(preview.report))}
                  disabled={preview.report.rows.length === 0}
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
                    disabled={preview.report.rows.length === 0}
                  >
                    Печати / Зачувај како PDF
                  </button>
                  <button
                    className="action-button"
                    type="button"
                    onClick={() => downloadBlobUrl(preview.url, `${exportFileNameFor(preview.report)}.html`)}
                  >
                    Симни preview
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="list-card">{filterSummary}</div>

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
            <div className="workflow-card__top">
              <span className="pill">{report.rows.length} редови</span>
              <span className={`status-chip${report.rows.length === 0 ? " status-chip--empty" : ""}`}>
                {report.rows.length === 0 ? "Нема податоци" : "Подготвен"}
              </span>
            </div>
            <div className="list-card">{filterSummary}</div>
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
                onClick={() => downloadCsv(report, exportFileNameFor(report))}
                disabled={report.rows.length === 0}
              >
                Excel
              </button>
              <button
                className="action-button"
                type="button"
                onClick={() => {
                  if (report.rows.length === 0) {
                    setPreview({ type: "table", report });
                    return;
                  }
                  const url = createPdfPreviewUrl(report, filterSummary);
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

function mapWasteRows<T extends { date: string; sourceMode: string; quantity: number; entries: number }>(
  rows: Map<string, T & ({ itemName: string } | { locationName: string })>,
  mode: ReportSection,
  kind: "item" | "location"
) {
  return [...rows.values()]
    .filter((row) => row.sourceMode === mode)
    .sort((left, right) => {
      const dateCompare = left.date.localeCompare(right.date);
      if (dateCompare !== 0) {
        return dateCompare;
      }

      const leftValue = kind === "item" ? ("itemName" in left ? left.itemName : "") : ("locationName" in left ? left.locationName : "");
      const rightValue = kind === "item" ? ("itemName" in right ? right.itemName : "") : ("locationName" in right ? right.locationName : "");
      return leftValue.localeCompare(rightValue, "mk-MK");
    })
    .map((row) =>
      kind === "item"
        ? [formatDateLabel(row.date), "itemName" in row ? row.itemName : "-", sourceLabel(row.sourceMode), String(row.quantity), String(row.entries)]
        : [formatDateLabel(row.date), "locationName" in row ? row.locationName : "-", sourceLabel(row.sourceMode), String(row.quantity), String(row.entries)]
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

function compareReportRows(left: string[], right: string[]) {
  return left.join("|").localeCompare(right.join("|"), "mk-MK");
}

function comparePlanRows(
  left: { planDate: string; plannedTime: string; locationName: string; itemName: string },
  right: { planDate: string; plannedTime: string; locationName: string; itemName: string }
) {
  return (
    left.planDate.localeCompare(right.planDate) ||
    left.locationName.localeCompare(right.locationName, "mk-MK") ||
    left.plannedTime.localeCompare(right.plannedTime, "mk-MK") ||
    left.itemName.localeCompare(right.itemName, "mk-MK")
  );
}

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function extractDateOnly(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLocationLabel(code: string | undefined, name: string) {
  const normalizedName = isGenericLocationName(name) ? "" : name;
  if (code && normalizedName) {
    return `${normalizeLocationCode(code)} · ${normalizedName}`;
  }

  return normalizeLocationCode(code) || normalizedName || name;
}

function extractLocationCode(name: string) {
  const match = name.match(/(\d{2,})/);
  return match ? normalizeLocationCode(match[1]) : "";
}

function normalizeLocationCode(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return "";
  }

  return /^\d+$/.test(trimmed) ? String(Number(trimmed)) : trimmed;
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function isGenericLocationName(name: string) {
  return /^локација\s+\d+$/i.test(name.trim());
}

function formatDateLabel(value: string) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}.${month}.${year}`;
}

function formatTimeOnly(value: string) {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const hours = String(parsed.getHours()).padStart(2, "0");
    const minutes = String(parsed.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  const match = value.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? value;
}

function matchesDateFilter(dateValue: string, preset: DatePreset, fromDate: string, toDate: string) {
  if (!dateValue) {
    return preset === "all";
  }

  if (preset === "all") {
    return true;
  }

  if (preset === "today") {
    return dateValue === getTodayDateValue();
  }

  if (!fromDate || !toDate) {
    return true;
  }

  return dateValue >= fromDate && dateValue <= toDate;
}

function downloadCsv(report: ReportDefinition, fileName?: string) {
  const rows = [report.columns, ...report.rows];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).split("\"").join("\"\"")}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  downloadBlobUrl(url, `${fileName ?? report.fileName}.csv`);
  URL.revokeObjectURL(url);
}

function createPdfPreviewUrl(report: ReportDefinition, filterSummary: string) {
  const html = `<!doctype html>
<html lang="mk">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #163f31; }
    h1 { margin: 0 0 8px; }
    p { margin: 0 0 20px; color: #537166; }
    .meta { margin-bottom: 16px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #cfe0d6; padding: 10px; text-align: left; font-size: 14px; }
    th { background: #edf4ef; }
    tr:nth-child(even) td { background: #f8fbf9; }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  <p>${escapeHtml(report.description)}</p>
  <div class="meta">${escapeHtml(filterSummary)}</div>
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

function compareDescByTimestamp(left: string, right: string) {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
    return right.localeCompare(left);
  }

  return rightTime - leftTime;
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

function buildReportExportFileName(base: string, selectedLocation: string, preset: DatePreset, fromDate: string, toDate: string) {
  const locationPart = selectedLocation === "all" ? "site-lokacii" : slugify(selectedLocation);
  const datePart =
    preset === "today"
      ? `denes-${getTodayDateValue()}`
      : preset === "all"
        ? "site-datumi"
        : `${fromDate || "od"}_do_${toDate || "do"}`;

  return `${base}-${locationPart}-${datePart}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\s*\·\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0400-\u04ff-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
