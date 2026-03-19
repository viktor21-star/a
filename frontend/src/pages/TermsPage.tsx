import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useTerms, useUpdateTerms } from "../lib/queries";
import type { TermEntry } from "../lib/types";

export function TermsPage() {
  const { user } = useAuth();
  const termsQuery = useTerms();
  const updateTerms = useUpdateTerms();
  const [search, setSearch] = useState("");
  const [terms, setTerms] = useState<TermEntry[]>([]);
  const [draft, setDraft] = useState({ label: "", time: "" });

  useEffect(() => {
    setTerms(termsQuery.data?.data ?? []);
  }, [termsQuery.data]);

  const filteredTerms = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return terms;
    }

    return terms.filter((term) => [term.label, term.time].some((value) => value.toLowerCase().includes(query)));
  }, [search, terms]);

  if (!isAdministrator(user)) {
    return <PageState message="Термините ги одржува администратор." />;
  }

  if (termsQuery.isLoading) {
    return <PageState message="Се вчитуваат термините..." />;
  }

  if (termsQuery.isError) {
    return <PageState message="Не може да се вчитаат термините." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Шифарници</p>
          <h3>Термини</h3>
          <p className="meta">Тука се одржуваат часовите кога печењето треба да биде готово.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Нов термин</h3>
          <button
            className="action-button"
            type="button"
            onClick={() => {
              if (!draft.label || !draft.time) {
                return;
              }

              const next = [
                ...terms,
                {
                  id: `${draft.time}-${draft.label}`.toLowerCase().replace(/\s+/g, "-"),
                  label: draft.label,
                  time: draft.time,
                  isActive: true
                }
              ];
              setTerms(next);
              updateTerms.mutate({ terms: next });
              setDraft({ label: "", time: "" });
            }}
          >
            Додади термин
          </button>
        </div>

        <div className="admin-form-grid">
          <article className="admin-input-tile">
            <span>Назив</span>
            <input value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} placeholder="Назив на термин" />
          </article>
          <article className="admin-input-tile">
            <span>Време</span>
            <input type="time" value={draft.time} onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))} />
          </article>
          <article className="admin-input-tile">
            <span>Пребарување</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Пребарај по назив или време" />
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Листа на термини</h3>
          <span>{filteredTerms.length} термини</span>
        </div>
        {updateTerms.isSuccess ? <p className="meta">Термините се успешно снимени.</p> : null}
        {updateTerms.isError ? <p className="meta">Не може да се снимат термините. Провери дали серверот работи.</p> : null}
        <div className="card-list admin-summary-grid">
          {filteredTerms.map((term) => (
            <article className="workflow-card admin-tile-card" key={term.id}>
              <div className="workflow-card__top">
                <span className="pill">{term.time}</span>
                <span className="status-chip">{term.isActive ? "Активен" : "Неактивен"}</span>
              </div>
              <h4>{term.label}</h4>
              <div className="workflow-card__actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    const next = terms.map((entry) =>
                      entry.id === term.id ? { ...entry, isActive: !entry.isActive } : entry
                    );
                    setTerms(next);
                    updateTerms.mutate({ terms: next });
                  }}
                >
                  {term.isActive ? "Деактивирај" : "Активирај"}
                </button>
                <button
                  className="action-button"
                  type="button"
                  onClick={() => {
                    const next = terms.filter((entry) => entry.id !== term.id);
                    setTerms(next);
                    updateTerms.mutate({ terms: next });
                  }}
                >
                  Избриши
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
