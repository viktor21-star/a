import { useMemo, useState } from "react";
import { isAdministrator, useAuth } from "../lib/auth";
import { useLocations } from "../lib/queries";
import { PageState } from "../components/PageState";

export function LocationsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useLocations();
  const [search, setSearch] = useState("");

  const filteredLocations = useMemo(() => {
    const rows = data?.data ?? [];
    const query = search.trim().toLowerCase();
    if (!query) {
      return rows;
    }

    return rows.filter((location) =>
      [location.nameMk, location.code, location.regionCode].some((value) => value.toLowerCase().includes(query))
    );
  }, [data, search]);

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
          <p className="topbar-eyebrow">Шифарници</p>
          <h3>Локации</h3>
          <p className="meta">Локациите доаѓаат директно од API. Овде нема рачен внес, туку само преглед и пребарување.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Пребарување низ локации</h3>
        </div>
        <input
          className="search-input"
          value={search}
          placeholder="Пребарај по име, код или регион"
          onChange={(event) => setSearch(event.target.value)}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Листа на локации</h3>
          <span>{filteredLocations.length} локации</span>
        </div>
        <div className="card-list admin-summary-grid">
          {filteredLocations.map((location) => (
            <article className="workflow-card admin-tile-card" key={location.locationId}>
              <div className="workflow-card__top">
                <span className="pill">{location.code}</span>
                <span className="status-chip">{location.isActive ? "Активна" : "Неактивна"}</span>
              </div>
              <h4>{location.nameMk}</h4>
              <p>Регион: {location.regionCode}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
