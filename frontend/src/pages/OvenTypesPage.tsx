import { useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";

const STORAGE_KEY = "pecenje-oven-types";
const defaultTypes = ["Ротациона", "Камена", "Комбинирана", "Конвекциска", "Етажна"];

function readTypes() {
  if (typeof window === "undefined") {
    return defaultTypes;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultTypes;
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return parsed.length ? parsed : defaultTypes;
  } catch {
    return defaultTypes;
  }
}

export function OvenTypesPage() {
  const { user } = useAuth();
  const [types, setTypes] = useState<string[]>(readTypes());
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (!isAdministrator(user)) {
    return <PageState message="Типови на печка ги одржува администратор." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Шифрарници</p>
          <h3>Типови на печка</h3>
          <p className="meta">Овде се одржува листата на типови на печки што потоа се користат во `Печки по локација`.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Нов тип на печка</h3>
        </div>
        {message && <div className="sync-result">{message}</div>}
        <div className="master-form master-form--inline">
          <input value={draft} placeholder="Внеси тип на печка" onChange={(event) => setDraft(event.target.value)} />
          <button
            className="action-button"
            type="button"
            onClick={() => {
              const value = draft.trim();
              if (!value || types.includes(value)) {
                return;
              }

              const next = [...types, value].sort((left, right) => left.localeCompare(right, "mk-MK"));
              setTypes(next);
              setDraft("");
              setMessage(`Успешно е додаден тип: ${value}`);
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            }}
          >
            Додади тип
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Постоечки типови</h3>
        </div>
        <div className="card-list admin-summary-grid">
          {types.map((type) => (
            <article className="workflow-card admin-tile-card" key={type}>
              <h4>{type}</h4>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  const next = types.filter((entry) => entry !== type);
                  setTypes(next);
                  setMessage(`Избришан тип: ${type}`);
                  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                }}
              >
                Избриши
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
