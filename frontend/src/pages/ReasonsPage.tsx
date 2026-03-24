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
  const [draft, setDraft] = useState({ name: "" });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const nextReasonCode = useMemo(() => getNextReasonCode(reasons), [reasons]);

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
          <p className="topbar-eyebrow">Шифрарници</p>
          <h3>Причини</h3>
          <p className="meta">Шифрата се пополнува автоматски како прва слободна. Се внесува само назив на причина.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Нова причина</h3>
          <button
            className="action-button"
            type="button"
            onClick={() => {
              setSaveMessage(null);
              setSaveError(null);

              if (!draft.name.trim()) {
                setSaveError("Внеси назив на причина.");
                return;
              }

              const generatedCode = getNextReasonCode(reasons);
              const newReason: ReasonEntry = {
                id: `${generatedCode}-${draft.name}`.toLowerCase().replace(/\s+/g, "-"),
                code: generatedCode,
                name: draft.name.trim(),
                category: "отпад",
                isActive: true
              };
              const next = [
                ...reasons,
                newReason
              ];
              setReasons(next);
              updateReasons.mutate(
                { reasons: next },
                {
                  onSuccess: () => {
                    setDraft({ name: "" });
                    setSearch("");
                    setSaveMessage(`Успешно е додадена причина: ${generatedCode}.`);
                  },
                  onError: (error) => {
                    setSaveError(error instanceof Error ? error.message : "Причините не може да се снимат.");
                  }
                }
              );
            }}
          >
            Додади причина
          </button>
        </div>
        {saveMessage && <div className="sync-result">{saveMessage}</div>}
        {saveError && <div className="form-error">{saveError}</div>}

        <div className="admin-form-grid">
          <article className="admin-input-tile">
            <span>Шифра</span>
            <input value={nextReasonCode} readOnly />
          </article>
          <article className="admin-input-tile">
            <span>Назив</span>
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Назив на причина" />
          </article>
          <article className="admin-input-tile">
            <span>Пребарување</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Пребарај по шифра или назив" />
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Листа на причини</h3>
          <span>{filteredReasons.length} причини</span>
        </div>
        <div className="card-list admin-summary-grid">
          {filteredReasons.map((reason) => (
            <article className="workflow-card admin-tile-card" key={reason.id}>
              <div className="workflow-card__top">
                <span className="pill">{reason.code}</span>
                <span className="status-chip">{reason.isActive ? "Активна" : "Неактивна"}</span>
              </div>
              <h4>{reason.name}</h4>
              <div className="workflow-card__actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setSaveMessage(null);
                    setSaveError(null);
                    const next = reasons.map((entry) =>
                      entry.id === reason.id ? { ...entry, isActive: !entry.isActive } : entry
                    );
                    setReasons(next);
                    updateReasons.mutate(
                      { reasons: next },
                      {
                        onSuccess: () => {
                          setSaveMessage(`Успешно е ${reason.isActive ? "деактивирана" : "активирана"} причина: ${reason.code}.`);
                        },
                        onError: (error) => {
                          setSaveError(error instanceof Error ? error.message : "Причините не може да се снимат.");
                        }
                      }
                    );
                  }}
                >
                  {reason.isActive ? "Деактивирај" : "Активирај"}
                </button>
                <button
                  className="action-button"
                  type="button"
                  onClick={() => {
                    setSaveMessage(null);
                    setSaveError(null);
                    const next = reasons.filter((entry) => entry.id !== reason.id);
                    setReasons(next);
                    updateReasons.mutate(
                      { reasons: next },
                      {
                        onSuccess: () => {
                          setSaveMessage(`Успешно е избришана причина: ${reason.code}.`);
                        },
                        onError: (error) => {
                          setSaveError(error instanceof Error ? error.message : "Причините не може да се снимат.");
                        }
                      }
                    );
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

function getNextReasonCode(reasons: ReasonEntry[]) {
  const usedNumbers = new Set(
    reasons
      .map((entry) => /^R(\d+)$/i.exec(entry.code.trim()))
      .filter((match): match is RegExpExecArray => Boolean(match))
      .map((match) => Number(match[1]))
      .filter((value) => Number.isFinite(value) && value > 0)
  );

  let candidate = 1;
  while (usedNumbers.has(candidate)) {
    candidate += 1;
  }

  return `R${String(candidate).padStart(3, "0")}`;
}
