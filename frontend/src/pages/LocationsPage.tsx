import { useEffect, useMemo, useState } from "react";
import { isAdministrator, useAuth } from "../lib/auth";
import { useLocationOvens, useLocations, useUpdateLocation } from "../lib/queries";
import { PageState } from "../components/PageState";
import type { Location, LocationOvenConfig } from "../lib/types";

export function LocationsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useLocations(true);
  const ovensQuery = useLocationOvens();
  const updateLocation = useUpdateLocation();
  const [nameSearch, setNameSearch] = useState("");
  const [codeSearch, setCodeSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [locationsState, setLocationsState] = useState<Location[]>([]);
  const ovens = ovensQuery.data?.data ?? [];

  useEffect(() => {
    setLocationsState(data?.data ?? []);
  }, [data]);

  useEffect(() => {
    setSaveMessage(null);
    setSaveError(null);
  }, [nameSearch, codeSearch, statusFilter]);

  const filteredLocations = useMemo(() => {
    const rows = locationsState;
    const nameQuery = nameSearch.trim().toLowerCase();
    const codeQuery = codeSearch.trim().toLowerCase();

    return rows.filter((location) => {
      const matchesName = !nameQuery || [location.nameMk, location.regionCode].some((value) => value.toLowerCase().includes(nameQuery));
      const matchesCode = !codeQuery || location.code.toLowerCase().includes(codeQuery);
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? location.isActive
            : !location.isActive;
      return matchesName && matchesCode && matchesStatus;
    }).sort((left, right) => Number(right.isActive) - Number(left.isActive) || left.nameMk.localeCompare(right.nameMk));
  }, [codeSearch, locationsState, nameSearch, statusFilter]);

  const totals = useMemo(() => ({
    active: locationsState.filter((location) => location.isActive).length,
    inactive: locationsState.filter((location) => !location.isActive).length,
    withPekara: ovens.filter((entry) => entry.pekara.ovenCount > 0).length,
    withPecenjara: ovens.filter((entry) => entry.pecenjara.ovenCount > 0).length
  }), [locationsState]);

  if (!isAdministrator(user)) {
    return <PageState message="Локациите ги одржува администратор." />;
  }

  if (isLoading) {
    return <PageState message="Се вчитуваат локации..." />;
  }

  if (isError || !data) {
    return <PageState message="Не може да се вчитаат локациите." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Шифрарници</p>
          <h3>Локации</h3>
          <p className="meta">Сите локации стартуваат како неактивни. Само активните ќе се појавуваат во останатите делови на системот.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Пребарување низ локации</h3>
        </div>
        {saveMessage && <div className="sync-result">{saveMessage}</div>}
        {saveError && <div className="form-error">{saveError}</div>}
        {!saveError && updateLocation.isError && <div className="form-error">Не може да се смени статусот на локацијата.</div>}
        {ovensQuery.isError && <div className="form-error">Печките по локација моментално не се вчитани, но статусот на локациите може да се менува.</div>}
        <div className="master-form master-form--inline">
          <input
            className="search-input"
            value={nameSearch}
            placeholder="Пребарај по име или регион"
            onChange={(event) => setNameSearch(event.target.value)}
          />
          <input
            className="search-input"
            value={codeSearch}
            placeholder="Пребарај по шифра"
            onChange={(event) => setCodeSearch(event.target.value)}
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}>
            <option value="all">Сите</option>
            <option value="active">Само активни</option>
            <option value="inactive">Само неактивни</option>
          </select>
        </div>
      </section>

      <section className="admin-hero-grid">
        <article className="admin-stat-tile">
          <span>Активни локации</span>
          <strong>{totals.active}</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Неактивни локации</span>
          <strong>{totals.inactive}</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Прикажани локации</span>
          <strong>{filteredLocations.length}</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Со Пекара</span>
          <strong>{totals.withPekara}</strong>
        </article>
        <article className="admin-stat-tile">
          <span>Со Печењара</span>
          <strong>{totals.withPecenjara}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Листа на локации</h3>
          <span>{filteredLocations.length} локации</span>
        </div>
        {!filteredLocations.length && <div className="empty-state">Нема локации за избраниот филтер.</div>}
        <div className="card-list admin-summary-grid">
          {filteredLocations.map((location) => (
            <LocationCard
              key={location.locationId}
              location={location}
              ovens={ovens.find((entry) => entry.locationId === location.locationId)}
              isUpdating={updateLocation.isPending}
              onToggleActive={() => {
                setSaveMessage(null);
                setSaveError(null);
                updateLocation.mutate(
                  {
                    locationId: location.locationId,
                    payload: {
                      code: location.code,
                      nameMk: location.nameMk,
                      regionCode: location.regionCode?.trim() || "DEFAULT",
                      isActive: !location.isActive
                    }
                  },
                  {
                    onSuccess: () => {
                      const nextActiveState = !location.isActive;
                      setLocationsState((current) =>
                        current.map((entry) =>
                          entry.locationId === location.locationId
                            ? { ...entry, isActive: nextActiveState }
                            : entry
                        )
                      );
                      setSaveMessage(
                        `${location.nameMk} е ${nextActiveState ? "активирана" : "деактивирана"}.`
                      );
                      setNameSearch("");
                      setCodeSearch("");
                      setStatusFilter(nextActiveState ? "active" : "inactive");
                    },
                    onError: (error) => {
                      setSaveError(error instanceof Error ? error.message : "Не може да се смени статусот на локацијата.");
                    }
                  }
                );
              }}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

function LocationCard({
  location,
  ovens,
  onToggleActive,
  isUpdating
}: {
  location: Location;
  ovens?: LocationOvenConfig;
  onToggleActive: () => void;
  isUpdating: boolean;
}) {
  return (
    <article className="workflow-card admin-tile-card">
      <div className="workflow-card__top">
        <span className="pill">{location.code}</span>
        <span className={`status-chip ${location.isActive ? "status-chip--active" : "status-chip--inactive"}`}>
          {location.isActive ? "Активна" : "Неактивна"}
        </span>
      </div>
      <h4>{location.nameMk}</h4>
      <p>Шифра: {location.code}</p>
      <p>Регион: {location.regionCode}</p>
      <p>Работни делови: {[ovens?.pekara.ovenCount ? "Пекара" : null, ovens?.pecenjara.ovenCount ? "Печењара" : null].filter(Boolean).join(", ") || "Само Пијара / без печки"}</p>
      <p>
        Пекара: {ovens?.pekara.ovenType ?? "Нема"} · {ovens?.pekara.ovenCount ?? 0} · капацитет {ovens?.pekara.ovenCapacity ?? 0}
      </p>
      <p>
        Печењара: {ovens?.pecenjara.ovenType ?? "Нема"} · {ovens?.pecenjara.ovenCount ?? 0} · капацитет {ovens?.pecenjara.ovenCapacity ?? 0}
      </p>
      <div className="login-actions">
        <button className="action-button" type="button" disabled={isUpdating} onClick={onToggleActive}>
          {location.isActive ? "Деактивирај" : "Активирај"}
        </button>
      </div>
    </article>
  );
}
