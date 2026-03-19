import { useMemo, useState } from "react";
import { isAdministrator, useAuth } from "../lib/auth";
import { useLocationOvens, useLocations } from "../lib/queries";
import { PageState } from "../components/PageState";
import type { LocationOvenConfig } from "../lib/types";

export function LocationsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useLocations();
  const ovensQuery = useLocationOvens();
  const [nameSearch, setNameSearch] = useState("");
  const [codeSearch, setCodeSearch] = useState("");
  const ovens = ovensQuery.data?.data ?? [];

  const filteredLocations = useMemo(() => {
    const rows = data?.data ?? [];
    const nameQuery = nameSearch.trim().toLowerCase();
    const codeQuery = codeSearch.trim().toLowerCase();

    return rows.filter((location) => {
      const matchesName = !nameQuery || [location.nameMk, location.regionCode].some((value) => value.toLowerCase().includes(nameQuery));
      const matchesCode = !codeQuery || location.code.toLowerCase().includes(codeQuery);
      return matchesName && matchesCode;
    });
  }, [codeSearch, data, nameSearch]);

  if (!isAdministrator(user)) {
    return <PageState message="Локациите ги одржува администратор." />;
  }

  if (isLoading || ovensQuery.isLoading) {
    return <PageState message="Се вчитуваат локации..." />;
  }

  if (isError || ovensQuery.isError || !data) {
    return <PageState message="Не може да се вчитаат локациите." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Шифарници</p>
          <h3>Локации</h3>
          <p className="meta">Локациите доаѓаат директно од API. Овде нема рачен внес, туку само преглед и пребарување.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Пребарување низ локации</h3>
        </div>
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
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Листа на локации</h3>
          <span>{filteredLocations.length} локации</span>
        </div>
        <div className="card-list admin-summary-grid">
          {filteredLocations.map((location) => (
            <LocationCard key={location.locationId} location={location} ovens={ovens.find((entry) => entry.locationId === location.locationId)} />
          ))}
        </div>
      </section>
    </section>
  );
}

function LocationCard({
  location,
  ovens
}: {
  location: { locationId: number; code: string; nameMk: string; regionCode: string; isActive: boolean };
  ovens?: LocationOvenConfig;
}) {
  return (
    <article className="workflow-card admin-tile-card">
      <div className="workflow-card__top">
        <span className="pill">{location.code}</span>
        <span className="status-chip">{location.isActive ? "Активна" : "Неактивна"}</span>
      </div>
      <h4>{location.nameMk}</h4>
      <p>Шифра: {location.code}</p>
      <p>Регион: {location.regionCode}</p>
      <p>
        Пекара: {ovens?.pekara.ovenType ?? "Нема"} · {ovens?.pekara.ovenCount ?? 0} · капацитет {ovens?.pekara.ovenCapacity ?? 0}
      </p>
      <p>
        Печењара: {ovens?.pecenjara.ovenType ?? "Нема"} · {ovens?.pecenjara.ovenCount ?? 0} · капацитет {ovens?.pecenjara.ovenCapacity ?? 0}
      </p>
    </article>
  );
}
