import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useReasons, useUpdateReasons } from "../lib/queries";
import type { ReasonEntry } from "../lib/types";

export function ReasonsPage() {
  const { user } = useAuth();
  const reasonsQuery = useReasons();
  const updateReasons = useUpdateReasons();
  const [search, setSearch] = useState("");
  const [reasons, setReasons] = useState<ReasonEntry[]>([]);
  const [draft, setDraft] = useState({ code: "", name: "", category: "разлика" as ReasonEntry["category"] });

  useEffect(() => {
    setReasons(reasonsQuery.data?.data ?? []);
  }, [reasonsQuery.data]);

  const filteredReasons = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return reasons;
    }

    return reasons.filter((reason) => [reason.code, reason.name, reason.category].some((value) => value.toLowerCase().includes(query)));
  }, [reasons, search]);

  if (!isAdministrator(user)) {
    return <PageState message="Причините ги одржува администратор." />;
  }

  if (reasonsQuery.isLoading) {
    return <PageState message="Се вчитуваат причините..." />;
  }

  if (reasonsQuery.isError) {
    return <PageState message="Не може да се вчитаат причините." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Шифарници</p>
          <h3>Причини</h3>
          <p className="meta">Причини за разлика, отпад и доцнење што се користат низ системот.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Нова причина</h3>
          <button
            className="action-button"
            type="button"
            onClick={() => {
              if (!draft.code || !draft.name) {
                return;
              }

              const next = [
                ...reasons,
                {
                  id: `${draft.code}-${draft.name}`.toLowerCase().replace(/\s+/g, "-"),
                  code: draft.code,
                  name: draft.name,
                  category: draft.category,
                  isActive: true
                }
              ];
              setReasons(next);
              updateReasons.mutate({ reasons: next });
              setDraft({ code: "", name: "", category: "разлика" });
            }}
          >
            Додади причина
          </button>
        </div>

        <div className="admin-form-grid">
          <article className="admin-input-tile">
            <span>Шифра</span>
            <input value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))} placeholder="R004" />
          </article>
          <article className="admin-input-tile">
            <span>Назив</span>
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Назив на причина" />
          </article>
          <article className="admin-input-tile">
            <span>Категорија</span>
            <select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as ReasonEntry["category"] }))}>
              <option value="разлика">Разлика</option>
              <option value="отпад">Отпад</option>
              <option value="доцнење">Доцнење</option>
            </select>
          </article>
          <article className="admin-input-tile">
            <span>Пребарување</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Пребарај по шифра, назив или категорија" />
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Листа на причини</h3>
          <span>{filteredReasons.length} причини</span>
        </div>
        {updateReasons.isSuccess ? <p className="meta">Причините се успешно снимени.</p> : null}
        {updateReasons.isError ? <p className="meta">Не може да се снимат причините. Провери дали серверот работи.</p> : null}
        <div className="card-list admin-summary-grid">
          {filteredReasons.map((reason) => (
            <article className="workflow-card admin-tile-card" key={reason.id}>
              <div className="workflow-card__top">
                <span className="pill">{reason.code}</span>
                <span className="status-chip">{reason.isActive ? "Активна" : "Неактивна"}</span>
              </div>
              <h4>{reason.name}</h4>
              <p>Категорија: {reason.category}</p>
              <div className="workflow-card__actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    const next = reasons.map((entry) =>
                      entry.id === reason.id ? { ...entry, isActive: !entry.isActive } : entry
                    );
                    setReasons(next);
                    updateReasons.mutate({ reasons: next });
                  }}
                >
                  {reason.isActive ? "Деактивирај" : "Активирај"}
                </button>
                <button
                  className="action-button"
                  type="button"
                  onClick={() => {
                    const next = reasons.filter((entry) => entry.id !== reason.id);
                    setReasons(next);
                    updateReasons.mutate({ reasons: next });
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
