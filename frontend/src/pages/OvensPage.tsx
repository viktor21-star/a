import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useLocationOvens, useLocations, useUpdateLocationOvens } from "../lib/queries";
import type { LocationOvenConfig, OvenModeConfig } from "../lib/types";
import { Link } from "react-router-dom";

const OVEN_TYPES_STORAGE_KEY = "pecenje-oven-types";

function getSuggestedOvenTypes() {
  if (typeof window === "undefined") {
    return ["Ротациона", "Камена", "Комбинирана", "Конвекциска", "Етажна"];
  }

  const raw = window.localStorage.getItem(OVEN_TYPES_STORAGE_KEY);
  if (!raw) {
    return ["Ротациона", "Камена", "Комбинирана", "Конвекциска", "Етажна"];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return parsed.length ? parsed : ["Ротациона", "Камена", "Комбинирана", "Конвекциска", "Етажна"];
  } catch {
    return ["Ротациона", "Камена", "Комбинирана", "Конвекциска", "Етажна"];
  }
}

function createEmptyMode(): OvenModeConfig {
  return {
    ovenType: "",
    ovenCount: 0,
    ovenCapacity: 0
  };
}

function createLocationConfig(locationId: number): LocationOvenConfig {
  return {
    locationId,
    pekara: createEmptyMode(),
    pecenjara: createEmptyMode()
  };
}

function hasOven(mode: OvenModeConfig) {
  return Boolean(mode.ovenType.trim()) || mode.ovenCount > 0 || mode.ovenCapacity > 0;
}

function normalizeMode(enabled: boolean, mode: OvenModeConfig): OvenModeConfig {
  if (!enabled) {
    return createEmptyMode();
  }

  return {
    ovenType: mode.ovenType.trim(),
    ovenCount: Math.max(0, mode.ovenCount),
    ovenCapacity: Math.max(0, mode.ovenCapacity)
  };
}

export function OvensPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useLocations();
  const ovensQuery = useLocationOvens();
  const updateLocationOvens = useUpdateLocationOvens();
  const [nameSearch, setNameSearch] = useState("");
  const [codeSearch, setCodeSearch] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [draft, setDraft] = useState<LocationOvenConfig[]>([]);
  const [enabledModes, setEnabledModes] = useState<Record<string, boolean>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const ovenTypes = useMemo(() => getSuggestedOvenTypes(), []);

  useEffect(() => {
    if (!data?.data?.length) {
      return;
    }

    const existing = new Map((ovensQuery.data?.data ?? []).map((entry) => [entry.locationId, entry]));
    const nextDraft = data.data.map((location) => existing.get(location.locationId) ?? createLocationConfig(location.locationId));
    setDraft(nextDraft);
    setEnabledModes(
      Object.fromEntries(
        nextDraft.flatMap((entry) => [
          [`${entry.locationId}:pekara`, hasOven(entry.pekara)],
          [`${entry.locationId}:pecenjara`, hasOven(entry.pecenjara)]
        ])
      )
    );

    if (!selectedLocationId) {
      setSelectedLocationId(data.data[0].locationId);
    }
  }, [data, ovensQuery.data, selectedLocationId]);

  const filteredLocations = useMemo(() => {
    const rows = data?.data ?? [];
    const nameQuery = nameSearch.trim().toLowerCase();
    const codeQuery = codeSearch.trim().toLowerCase();

    return rows.filter((location) => {
      const matchesName = !nameQuery || location.nameMk.toLowerCase().includes(nameQuery);
      const matchesCode = !codeQuery || location.code.toLowerCase().includes(codeQuery);
      return matchesName && matchesCode;
    });
  }, [codeSearch, data, nameSearch]);

  useEffect(() => {
    if (!filteredLocations.length) {
      return;
    }

    if (!selectedLocationId || !filteredLocations.some((location) => location.locationId === selectedLocationId)) {
      setSelectedLocationId(filteredLocations[0].locationId);
    }
  }, [filteredLocations, selectedLocationId]);

  const selectedLocation = filteredLocations.find((location) => location.locationId === selectedLocationId) ?? null;
  const selectedConfig = draft.find((entry) => entry.locationId === selectedLocationId) ?? (selectedLocationId ? createLocationConfig(selectedLocationId) : null);
  const pekaraEnabled = selectedLocationId ? Boolean(enabledModes[`${selectedLocationId}:pekara`]) : false;
  const pecenjaraEnabled = selectedLocationId ? Boolean(enabledModes[`${selectedLocationId}:pecenjara`]) : false;
  const ovenOverview = useMemo(() =>
    (data?.data ?? [])
      .map((location) => ({
        location,
        config: draft.find((entry) => entry.locationId === location.locationId) ?? createLocationConfig(location.locationId)
      }))
      .sort((left, right) => left.location.nameMk.localeCompare(right.location.nameMk)),
    [data, draft]
  );

  useEffect(() => {
    setSaveMessage(null);
    setSaveError(null);
  }, [selectedLocationId]);

  if (!isAdministrator(user)) {
    return <PageState message="Печките по локација ги одржува администратор." />;
  }

  if (isLoading || ovensQuery.isLoading) {
    return <PageState message="Се вчитуваат локации за печки..." />;
  }

  if (isError || ovensQuery.isError || !data) {
    return <PageState message="Не може да се вчитаат печките по локација." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Шифрарници</p>
          <h3>Печки по локација</h3>
          <p className="meta">Прво избери една локација. Потоа за неа внеси дали има печка за Пекара и дали има печка за Печењара.</p>
        </div>
        <Link className="ghost-button link-button" to="/master-data/oven-types">
          Типови на печка
        </Link>
      </header>

      <div className="operator-explainer">
        <strong>Како се користи овој дел:</strong>
        <span>1. Пребарај и избери една локација.</span>
        <span>2. За `Пекара` избери дали има печка и внеси тип, број и капацитет.</span>
        <span>3. За `Печењара` избери дали има печка и внеси тип, број и капацитет.</span>
        <span>4. Типовите се одржуваат во посебен шифарник `Типови на печка`.</span>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>Избор на локација</h3>
        </div>
        {saveMessage && <div className="sync-result">{saveMessage}</div>}
        {saveError && <div className="form-error">{saveError}</div>}
        {!saveError && updateLocationOvens.isError && <div className="form-error">Не може да се снимат печките. Провери дали серверот работи.</div>}
        <div className="master-form master-form--inline">
          <input
            className="search-input"
            value={nameSearch}
            placeholder="Пребарај по име"
            onChange={(event) => setNameSearch(event.target.value)}
          />
          <input
            className="search-input"
            value={codeSearch}
            placeholder="Пребарај по шифра"
            onChange={(event) => setCodeSearch(event.target.value)}
          />
          <select
            value={selectedLocationId ?? ""}
            onChange={(event) => setSelectedLocationId(Number(event.target.value))}
          >
            {filteredLocations.map((location) => (
              <option key={location.locationId} value={location.locationId}>
                {location.code} · {location.nameMk}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Преглед на печки по локација</h3>
          <span>{ovenOverview.length} локации</span>
        </div>
        <div className="card-list admin-summary-grid">
          {ovenOverview.map(({ location, config }) => (
            <article className="workflow-card admin-tile-card" key={`overview-${location.locationId}`}>
              <div className="workflow-card__top">
                <span className="pill">{location.code}</span>
                <span className="status-chip">
                  {[config.pekara.ovenCount > 0 ? "Пекара" : null, config.pecenjara.ovenCount > 0 ? "Печењара" : null].filter(Boolean).join(" · ") || "Без печки"}
                </span>
              </div>
              <h4>{location.nameMk}</h4>
              <p>Пекара: {config.pekara.ovenType || "Нема"} · {config.pekara.ovenCount} · капацитет {config.pekara.ovenCapacity}</p>
              <p>Печењара: {config.pecenjara.ovenType || "Нема"} · {config.pecenjara.ovenCount} · капацитет {config.pecenjara.ovenCapacity}</p>
              <div className="login-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setSelectedLocationId(location.locationId);
                    setSaveMessage(null);
                    setSaveError(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Измени
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {!selectedLocation || !selectedConfig ? (
        <section className="panel">
          <div className="list-card">Нема избрана локација.</div>
        </section>
      ) : (
        <>
          <section className="panel">
            <div className="panel-header">
              <h3>{selectedLocation.nameMk}</h3>
              <span>{selectedLocation.code}</span>
            </div>
            <div className="admin-form-grid">
              <article className="admin-input-tile">
                <span>Шифра</span>
                <strong>{selectedLocation.code}</strong>
              </article>
              <article className="admin-input-tile">
                <span>Локација</span>
                <strong>{selectedLocation.nameMk}</strong>
              </article>
              <article className="admin-input-tile">
                <span>Регион</span>
                <strong>{selectedLocation.regionCode}</strong>
              </article>
            </div>
          </section>

          <section className="card-list admin-summary-grid">
            <article className="workflow-card admin-tile-card">
              <div className="panel-header">
                <h3>Пекара</h3>
              </div>
              <div className="mode-grid">
                <button className={`mode-tile${pekaraEnabled ? " mode-tile--active" : ""}`} type="button" onClick={() => toggleEnabled("pekara", true)}>
                  Има печка
                </button>
                <button className={`mode-tile${!pekaraEnabled ? " mode-tile--active" : ""}`} type="button" onClick={() => toggleEnabled("pekara", false)}>
                  Нема печка
                </button>
              </div>

              {pekaraEnabled && (
                <div className="admin-form-grid">
                  <label className="permission-select">
                    <span>Тип на печка</span>
                    <select value={selectedConfig.pekara.ovenType} onChange={(event) => updateMode("pekara", { ovenType: event.target.value })}>
                      <option value="">Избери тип</option>
                      {ovenTypes.map((ovenType) => (
                        <option key={ovenType} value={ovenType}>
                          {ovenType}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="permission-select">
                    <span>Број на печки</span>
                    <input
                      type="number"
                      min="0"
                      value={selectedConfig.pekara.ovenCount}
                      onChange={(event) => updateMode("pekara", { ovenCount: Number(event.target.value) })}
                    />
                  </label>
                  <label className="permission-select">
                    <span>Капацитет по печка</span>
                    <input
                      type="number"
                      min="0"
                      disabled={selectedConfig.pekara.ovenCount <= 0}
                      value={selectedConfig.pekara.ovenCapacity}
                      onChange={(event) => updateMode("pekara", { ovenCapacity: Number(event.target.value) })}
                    />
                  </label>
                </div>
              )}
            </article>

            <article className="workflow-card admin-tile-card">
              <div className="panel-header">
                <h3>Печењара</h3>
              </div>
              <div className="mode-grid">
                <button className={`mode-tile${pecenjaraEnabled ? " mode-tile--active" : ""}`} type="button" onClick={() => toggleEnabled("pecenjara", true)}>
                  Има печка
                </button>
                <button className={`mode-tile${!pecenjaraEnabled ? " mode-tile--active" : ""}`} type="button" onClick={() => toggleEnabled("pecenjara", false)}>
                  Нема печка
                </button>
              </div>

              {pecenjaraEnabled && (
                <div className="admin-form-grid">
                  <label className="permission-select">
                    <span>Тип на печка</span>
                    <select value={selectedConfig.pecenjara.ovenType} onChange={(event) => updateMode("pecenjara", { ovenType: event.target.value })}>
                      <option value="">Избери тип</option>
                      {ovenTypes.map((ovenType) => (
                        <option key={ovenType} value={ovenType}>
                          {ovenType}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="permission-select">
                    <span>Број на печки</span>
                    <input
                      type="number"
                      min="0"
                      value={selectedConfig.pecenjara.ovenCount}
                      onChange={(event) => updateMode("pecenjara", { ovenCount: Number(event.target.value) })}
                    />
                  </label>
                  <label className="permission-select">
                    <span>Капацитет по печка</span>
                    <input
                      type="number"
                      min="0"
                      disabled={selectedConfig.pecenjara.ovenCount <= 0}
                      value={selectedConfig.pecenjara.ovenCapacity}
                      onChange={(event) => updateMode("pecenjara", { ovenCapacity: Number(event.target.value) })}
                    />
                  </label>
                </div>
              )}
            </article>
          </section>

          <div className="login-actions">
            <button
              className="action-button"
              type="button"
              disabled={updateLocationOvens.isPending}
              onClick={() => {
                setSaveMessage(null);
                setSaveError(null);
                const validationError = validateSelectedLocation();
                if (validationError) {
                  setSaveError(validationError);
                  return;
                }
                updateLocationOvens.mutate(
                  { locations: draft },
                  {
                    onSuccess: () => {
                      setSaveMessage(`Успешно се снимени печките за ${selectedLocation.nameMk}.`);
                      setNameSearch("");
                      setCodeSearch("");
                    }
                  }
                );
              }}
            >
              {updateLocationOvens.isPending ? "Се снима..." : "Сними печки за оваа локација"}
            </button>
          </div>
        </>
      )}
    </section>
  );

  function updateMode(mode: "pekara" | "pecenjara", patch: Partial<OvenModeConfig>) {
    if (!selectedLocation) {
      return;
    }

    setDraft((current) =>
      current.map((entry) =>
        entry.locationId === selectedLocation.locationId
          ? {
              ...entry,
              [mode]: {
                ...entry[mode],
                ...patch,
                ...(patch.ovenCount !== undefined && Number(patch.ovenCount) <= 0 ? { ovenCapacity: 0 } : {})
              }
            }
          : entry
      )
    );
  }

  function toggleEnabled(mode: "pekara" | "pecenjara", enabled: boolean) {
    if (!selectedLocation) {
      return;
    }

    setEnabledModes((current) => ({
      ...current,
      [`${selectedLocation.locationId}:${mode}`]: enabled
    }));

    setDraft((current) =>
      current.map((entry) =>
        entry.locationId === selectedLocation.locationId
          ? { ...entry, [mode]: enabled ? normalizeMode(true, entry[mode]) : createEmptyMode() }
          : entry
      )
    );
  }

  function validateSelectedLocation() {
    if (!selectedLocationId) {
      return "Избери локација.";
    }

    const currentConfig = draft.find((entry) => entry.locationId === selectedLocationId);
    if (!currentConfig) {
      return "Нема податоци за избраната локација.";
    }

    const validations: Array<{ label: string; enabled: boolean; mode: OvenModeConfig }> = [
      { label: "Пекара", enabled: Boolean(enabledModes[`${selectedLocationId}:pekara`]), mode: currentConfig.pekara },
      { label: "Печењара", enabled: Boolean(enabledModes[`${selectedLocationId}:pecenjara`]), mode: currentConfig.pecenjara }
    ];

    for (const entry of validations) {
      if (!entry.enabled) {
        continue;
      }

      if (!entry.mode.ovenType.trim()) {
        return `Избери тип на печка за ${entry.label}.`;
      }

      if (entry.mode.ovenCount <= 0) {
        return `Внеси број на печки поголем од 0 за ${entry.label}.`;
      }

      if (entry.mode.ovenCapacity <= 0) {
        return `Внеси капацитет поголем од 0 за ${entry.label}.`;
      }
    }

    return null;
  }
}
