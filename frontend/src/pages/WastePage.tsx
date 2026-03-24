import { useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { useWasteEntries } from "../lib/queries";

export function WastePage() {
  const { user } = useAuth();
  const wasteQuery = useWasteEntries();
  const [previewPhoto, setPreviewPhoto] = useState<{ src: string; title: string } | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"pekara" | "pecenjara" | "pijara">("pekara");
  const [reasonFilter, setReasonFilter] = useState("all");
  const wasteEntries = wasteQuery.data?.data ?? [];
  const reasons = useMemo(
    () => [...new Set(wasteEntries.map((entry) => entry.reason).filter(Boolean))].sort((left, right) => left.localeCompare(right, "mk-MK")),
    [wasteEntries]
  );
  const filteredWaste = useMemo(() => {
    const locationQuery = locationSearch.trim().toLowerCase();
    const itemQuery = itemSearch.trim().toLowerCase();

    return wasteEntries.filter((entry) => {
      const matchesLocation = !locationQuery || entry.locationName.toLowerCase().includes(locationQuery);
      const matchesItem = !itemQuery || entry.itemName.toLowerCase().includes(itemQuery);
      const matchesSource = entry.sourceMode === sourceFilter;
      const matchesReason = reasonFilter === "all" || entry.reason === reasonFilter;
      return matchesLocation && matchesItem && matchesSource && matchesReason;
    });
  }, [itemSearch, locationSearch, reasonFilter, sourceFilter, wasteEntries]);
  const totals = useMemo(
    () => ({
      entries: filteredWaste.length,
      quantity: filteredWaste.reduce((sum, entry) => sum + Number(entry.quantity ?? 0), 0)
    }),
    [filteredWaste]
  );
  const totalsBySource = useMemo(
    () => ({
      pekara: wasteEntries.filter((entry) => entry.sourceMode === "pekara").length,
      pecenjara: wasteEntries.filter((entry) => entry.sourceMode === "pecenjara").length,
      pijara: wasteEntries.filter((entry) => entry.sourceMode === "pijara").length
    }),
    [wasteEntries]
  );

  if (!isAdministrator(user)) {
    return <PageState message="Отпадот е достапен само за администратор." />;
  }

  if (wasteQuery.isLoading) {
    return <PageState message="Се вчитува отпад..." />;
  }

  if (wasteQuery.isError || !wasteQuery.data) {
    return <PageState message="Не може да се вчита отпадот." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Администрација</p>
          <h3>Отпад</h3>
          <p className="meta">Преглед на пријавен отпад по локација, артикал, количина и причина.</p>
        </div>
      </header>

      <div className="operator-explainer">
        <strong>Како се користи овој дел:</strong>
        <span>1. Прво одбери дали гледаш отпад од Пекара, Печењара или Пијара.</span>
        <span>2. После филтрирај по локација, артикал и причина.</span>
        <span>3. Во листата се гледаат оператор, време и точната количина.</span>
        <span>4. За агрегати и export користи `Извештаи`.</span>
      </div>

      <section className="operator-mode-grid">
        <button
          type="button"
          className={`operator-mode-card${sourceFilter === "pekara" ? " operator-mode-card--active" : ""}`}
          onClick={() => setSourceFilter("pekara")}
        >
          <strong>Пекара</strong>
          <span>{totalsBySource.pekara} записи</span>
        </button>
        <button
          type="button"
          className={`operator-mode-card${sourceFilter === "pecenjara" ? " operator-mode-card--active" : ""}`}
          onClick={() => setSourceFilter("pecenjara")}
        >
          <strong>Печењара</strong>
          <span>{totalsBySource.pecenjara} записи</span>
        </button>
        <button
          type="button"
          className={`operator-mode-card${sourceFilter === "pijara" ? " operator-mode-card--active" : ""}`}
          onClick={() => setSourceFilter("pijara")}
        >
          <strong>Пијара</strong>
          <span>{totalsBySource.pijara} записи</span>
        </button>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Филтри</h3>
          <span>{sourceLabel(sourceFilter)}</span>
        </div>
        <div className="master-form master-form--inline">
          <input
            className="search-input"
            value={locationSearch}
            placeholder="Пребарај по локација"
            onChange={(event) => setLocationSearch(event.target.value)}
          />
          <input
            className="search-input"
            value={itemSearch}
            placeholder="Пребарај по артикал"
            onChange={(event) => setItemSearch(event.target.value)}
          />
          <select value={reasonFilter} onChange={(event) => setReasonFilter(event.target.value)}>
            <option value="all">Сите причини</option>
            {reasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="admin-hero-grid">
        <article className="admin-stat-tile">
          <span>Прикажани записи</span>
          <strong>{totals.entries}</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Вкупна количина</span>
          <strong>{totals.quantity}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Листа на отпад · {sourceLabel(sourceFilter)}</h3>
          <span>{filteredWaste.length} записи</span>
        </div>

        {filteredWaste.length === 0 ? (
          <div className="list-card">Нема записи за {sourceLabel(sourceFilter)}.</div>
        ) : (
          <div className="report-table">
            {filteredWaste.map((entry) => (
              <article className="waste-entry-card" key={entry.wasteEntryId}>
                <div className="waste-entry-card__top">
                  <div>
                    <strong>{entry.locationName}</strong>
                    <p>{sourceLabel(entry.sourceMode)}</p>
                  </div>
                  <span className="status-chip">{entry.quantity}</span>
                </div>
                <div className="waste-entry-card__main">
                  <h4>{entry.itemName}</h4>
                  <p>Причина: {entry.reason}</p>
                </div>
                <div className="waste-entry-card__meta">
                  <span>Оператор: {entry.operatorName}</span>
                  <span>Време: {formatWasteTimestamp(entry.createdAt)}</span>
                </div>
                {entry.photoName ? (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={async () => {
                      setPreviewLoadingId(entry.wasteEntryId);
                      try {
                        const response = await api.getWastePhoto<{ data: { photoDataUrl: string; photoName: string } }>(entry.wasteEntryId);
                        setPreviewPhoto({
                          src: response.data.photoDataUrl,
                          title: `${sourceLabel(entry.sourceMode)} · ${entry.locationName} · ${entry.itemName}`
                        });
                      } finally {
                        setPreviewLoadingId(null);
                      }
                    }}
                  >
                    {previewLoadingId === entry.wasteEntryId ? "Се отвора..." : "Отвори слика"}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      {previewPhoto && (
        <div className="image-lightbox" role="dialog" aria-modal="true" onClick={() => setPreviewPhoto(null)}>
          <div className="image-lightbox__content" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <h3>{previewPhoto.title}</h3>
              <button type="button" className="ghost-button" onClick={() => setPreviewPhoto(null)}>
                Затвори
              </button>
            </div>
            <div className="operator-photo-preview image-lightbox__preview">
              <img src={previewPhoto.src} alt={previewPhoto.title} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function sourceLabel(mode: "pekara" | "pecenjara" | "pijara") {
  if (mode === "pekara") {
    return "Пекара";
  }

  if (mode === "pecenjara") {
    return "Печењара";
  }

  return "Пијара";
}

function formatWasteTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return `${String(parsed.getDate()).padStart(2, "0")}.${String(parsed.getMonth() + 1).padStart(2, "0")}.${parsed.getFullYear()} ${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
}
