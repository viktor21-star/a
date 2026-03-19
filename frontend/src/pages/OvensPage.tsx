import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useLocationOvens, useLocations, useUpdateLocationOvens } from "../lib/queries";
import type { LocationOvenConfig, OvenModeConfig } from "../lib/types";

const ovenTypes = ["Нема", "Ротациона", "Камена", "Комбинирана", "Конвекциска"];

function createDefaultModeConfig(): OvenModeConfig {
  return {
    ovenType: "Нема",
    ovenCount: 0,
    ovenCapacity: 0
  };
}

export function OvensPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useLocations();
  const ovensQuery = useLocationOvens();
  const updateLocationOvens = useUpdateLocationOvens();
  const [nameSearch, setNameSearch] = useState("");
  const [codeSearch, setCodeSearch] = useState("");
  const [draft, setDraft] = useState<LocationOvenConfig[]>([]);

  useEffect(() => {
    if (!data?.data?.length) {
      return;
    }

    const existing = new Map((ovensQuery.data?.data ?? []).map((entry) => [entry.locationId, entry]));
    setDraft(
      data.data.map((location) =>
        existing.get(location.locationId) ?? {
          locationId: location.locationId,
          pekara: createDefaultModeConfig(),
          pecenjara: createDefaultModeConfig()
        }
      )
    );
  }, [data, ovensQuery.data]);

  const rows = useMemo(() => {
    const locations = data?.data ?? [];
    const nameQuery = nameSearch.trim().toLowerCase();
    const codeQuery = codeSearch.trim().toLowerCase();

    return locations.filter((location) => {
      const matchesName = !nameQuery || location.nameMk.toLowerCase().includes(nameQuery);
      const matchesCode = !codeQuery || location.code.toLowerCase().includes(codeQuery);
      return matchesName && matchesCode;
    });
  }, [codeSearch, data, nameSearch]);

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
          <p className="topbar-eyebrow">Шифарници</p>
          <h3>Печки по локација</h3>
          <p className="meta">За секоја локација посебно внеси печки за Пекара и за Печењара, со тип, број и капацитет.</p>
        </div>
        <button
          className="action-button"
          type="button"
          disabled={updateLocationOvens.isPending}
          onClick={() => {
            updateLocationOvens.mutate({ locations: draft });
          }}
        >
          {updateLocationOvens.isPending ? "Се снима..." : "Сними печки"}
        </button>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Пребарување по локација</h3>
        </div>
        {updateLocationOvens.isSuccess ? <p className="meta">Печките се успешно снимени.</p> : null}
        {updateLocationOvens.isError ? <p className="meta">Не може да се снимат печките. Провери дали серверот работи.</p> : null}
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
        </div>
      </section>

      <section className="card-list admin-summary-grid">
        {rows.map((location) => {
          const config = draft.find((entry) => entry.locationId === location.locationId) ?? {
            locationId: location.locationId,
            pekara: createDefaultModeConfig(),
            pecenjara: createDefaultModeConfig()
          };

          return (
            <article className="workflow-card admin-tile-card" key={location.locationId}>
              <div className="workflow-card__top">
                <span className="pill">{location.code}</span>
                <span className="status-chip">{location.isActive ? "Активна" : "Неактивна"}</span>
              </div>
              <h4>{location.nameMk}</h4>
              <p>Шифра: {location.code}</p>
              <p>Регион: {location.regionCode}</p>

              <section className="permission-card">
                <strong>Пекара</strong>
                <label className="permission-select">
                  <span>Тип на печка</span>
                  <select
                    value={config.pekara.ovenType}
                    onChange={(event) => {
                      const ovenType = event.target.value;
                      setDraft((current) =>
                        current.map((entry) =>
                          entry.locationId === location.locationId
                            ? { ...entry, pekara: { ...entry.pekara, ovenType } }
                            : entry
                        )
                      );
                    }}
                  >
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
                    value={config.pekara.ovenCount}
                    onChange={(event) => {
                      const ovenCount = Number(event.target.value);
                      setDraft((current) =>
                        current.map((entry) =>
                          entry.locationId === location.locationId
                            ? { ...entry, pekara: { ...entry.pekara, ovenCount } }
                            : entry
                        )
                      );
                    }}
                  />
                </label>
                <label className="permission-select">
                  <span>Капацитет по печка</span>
                  <input
                    type="number"
                    min="0"
                    value={config.pekara.ovenCapacity}
                    onChange={(event) => {
                      const ovenCapacity = Number(event.target.value);
                      setDraft((current) =>
                        current.map((entry) =>
                          entry.locationId === location.locationId
                            ? { ...entry, pekara: { ...entry.pekara, ovenCapacity } }
                            : entry
                        )
                      );
                    }}
                  />
                </label>
              </section>

              <section className="permission-card">
                <strong>Печењара</strong>
                <label className="permission-select">
                  <span>Тип на печка</span>
                  <select
                    value={config.pecenjara.ovenType}
                    onChange={(event) => {
                      const ovenType = event.target.value;
                      setDraft((current) =>
                        current.map((entry) =>
                          entry.locationId === location.locationId
                            ? { ...entry, pecenjara: { ...entry.pecenjara, ovenType } }
                            : entry
                        )
                      );
                    }}
                  >
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
                    value={config.pecenjara.ovenCount}
                    onChange={(event) => {
                      const ovenCount = Number(event.target.value);
                      setDraft((current) =>
                        current.map((entry) =>
                          entry.locationId === location.locationId
                            ? { ...entry, pecenjara: { ...entry.pecenjara, ovenCount } }
                            : entry
                        )
                      );
                    }}
                  />
                </label>
                <label className="permission-select">
                  <span>Капацитет по печка</span>
                  <input
                    type="number"
                    min="0"
                    value={config.pecenjara.ovenCapacity}
                    onChange={(event) => {
                      const ovenCapacity = Number(event.target.value);
                      setDraft((current) =>
                        current.map((entry) =>
                          entry.locationId === location.locationId
                            ? { ...entry, pecenjara: { ...entry.pecenjara, ovenCapacity } }
                            : entry
                        )
                      );
                    }}
                  />
                </label>
              </section>
            </article>
          );
        })}
      </section>
    </section>
  );
}
