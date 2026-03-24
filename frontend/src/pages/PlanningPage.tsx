import { useEffect, useMemo, useRef, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useActivatePlan, useCreatePlan, useDeactivatePlan, useDeletePlan, useLocations, usePlans, useTerms, useUpdatePlan } from "../lib/queries";

type PlanningMode = "pekara" | "pecenjara";

type ManualPlanEntry = {
  mode: PlanningMode;
  locationId: number;
  plannedTime: string;
  plannedQty: number;
};

function formatTime24h(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return trimmed;
  }

  const hours = match[1].padStart(2, "0");
  return `${hours}:${match[2]}`;
}

function isPlanActive(status: string) {
  return status.trim().toLowerCase() !== "неактивен";
}

export function PlanningPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = usePlans();
  const locationsQuery = useLocations();
  const termsQuery = useTerms();
  const createPlanMutation = useCreatePlan();
  const updatePlanMutation = useUpdatePlan();
  const deletePlanMutation = useDeletePlan();
  const deactivatePlanMutation = useDeactivatePlan();
  const activatePlanMutation = useActivatePlan();
  const [selectedMode, setSelectedMode] = useState<PlanningMode | null>(null);
  const [nameSearch, setNameSearch] = useState("");
  const [codeSearch, setCodeSearch] = useState("");
  const [reviewLocationId, setReviewLocationId] = useState<number | "all">("all");
  const [reviewMode, setReviewMode] = useState<PlanningMode | "all">("all");
  const [reviewStatus, setReviewStatus] = useState<"active" | "inactive" | "all">("all");
  const [draft, setDraft] = useState<ManualPlanEntry>({
    mode: "pekara",
    locationId: 1,
    plannedTime: "07:00",
    plannedQty: 12
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const planFormRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("mode");
    if (requestedMode === "pekara" || requestedMode === "pecenjara") {
      setSelectedMode(requestedMode);
      setDraft((current) => ({ ...current, mode: requestedMode }));
    }
  }, []);

  const locations = locationsQuery.data?.data ?? [];
  const activeTerms = useMemo(
    () => [...(termsQuery.data?.data ?? [])].filter((term) => term.isActive).sort((left, right) => left.time.localeCompare(right.time)),
    [termsQuery.data]
  );
  const filteredLocations = useMemo(() => {
    const nameQuery = nameSearch.trim().toLowerCase();
    const codeQuery = codeSearch.trim().toLowerCase();

    return locations.filter((location) => {
      const matchesName = !nameQuery || location.nameMk.toLowerCase().includes(nameQuery);
      const matchesCode = !codeQuery || location.code.toLowerCase().includes(codeQuery);
      return matchesName && matchesCode;
    });
  }, [codeSearch, locations, nameSearch]);

  useEffect(() => {
    if (!filteredLocations.length) {
      return;
    }

    setDraft((current) => {
      if (filteredLocations.some((location) => location.locationId === current.locationId)) {
        return current;
      }

      return { ...current, locationId: filteredLocations[0].locationId };
    });
  }, [filteredLocations]);

  useEffect(() => {
    if (!activeTerms.length) {
      return;
    }

    setDraft((current) => {
      if (activeTerms.some((term) => term.time === current.plannedTime)) {
        return current;
      }

      return {
        ...current,
        plannedTime: activeTerms[0].time
      };
    });
  }, [activeTerms]);

  const totals = useMemo(() => {
    const rows = selectedMode ? (data?.data ?? []).filter((entry) => entry.mode === selectedMode) : (data?.data ?? []);
    return rows.reduce(
      (summary, entry) => ({
        markets: new Set([...summary.markets, entry.locationId]),
        qty: summary.qty + Number(entry.correctedQty)
      }),
      { markets: new Set<number>(), qty: 0 }
    );
  }, [data, selectedMode]);

  const visiblePlans = useMemo(() => {
    const rows = selectedMode ? (data?.data ?? []).filter((entry) => entry.mode === selectedMode) : (data?.data ?? []);
    return [...rows].sort((left, right) => left.termLabel.localeCompare(right.termLabel));
  }, [data, selectedMode]);

  const reviewedPlans = useMemo(() => {
    const rows = [...(data?.data ?? [])];
    return rows
      .filter((entry) => reviewMode === "all" || entry.mode === reviewMode)
      .filter((entry) => reviewLocationId === "all" || entry.locationId === reviewLocationId)
      .filter((entry) => {
        const isActive = isPlanActive(entry.status);
        if (reviewStatus === "all") {
          return true;
        }

        return reviewStatus === "active" ? isActive : !isActive;
      })
      .sort((left, right) => {
        if (left.locationName !== right.locationName) {
          return left.locationName.localeCompare(right.locationName);
        }

        return left.termLabel.localeCompare(right.termLabel);
      });
  }, [data, reviewLocationId, reviewMode, reviewStatus]);

  if (isLoading || locationsQuery.isLoading || termsQuery.isLoading) {
    return <PageState message="Се вчитува планот..." />;
  }

  if (isError || !data || locationsQuery.isError || termsQuery.isError) {
    return <PageState message="Не може да се вчита планот." />;
  }

  if (!isAdministrator(user)) {
    return <PageState message="Планот на печење го внесува и следи администратор." />;
  }

  if (!locations.length) {
    return <PageState message="Нема активни локации. Прво активирај локација во Шифрарници > Локации." />;
  }

  if (!activeTerms.length) {
    return <PageState message="Нема активни термини. Прво додади и активирај термин во Шифрарници > Термини." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Планирање</p>
          <h3>{selectedMode ? `План за ${selectedMode === "pekara" ? "Пекара" : "Печењара"}` : "Избери дел за планирање"}</h3>
          <p className="meta">
            {selectedMode
              ? "Администраторот внесува само време, локација и количина. Артикал не се избира."
              : "Планот се дели на две големи кочки: Пекара и Печењара."}
          </p>
        </div>
        {selectedMode && (
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              setSelectedMode(null);
              setDraft((current) => ({ ...current, mode: "pekara" }));
              window.history.replaceState({}, "", "/planning");
            }}
          >
            Назад
          </button>
        )}
      </header>

      {(saveMessage || saveError) && (
        <section className="panel">
          {saveMessage && <div className="sync-result">{saveMessage}</div>}
          {saveError && <div className="form-error">{saveError}</div>}
        </section>
      )}

      {!selectedMode && (
        <section className="operator-mode-grid">
          <button
            type="button"
            className="operator-mode-card"
            onClick={() => {
              setSelectedMode("pekara");
              setDraft((current) => ({ ...current, mode: "pekara" }));
              window.history.replaceState({}, "", "/planning?mode=pekara");
            }}
          >
            <strong>Пекара</strong>
            <span>План по локација, време и количина за пекарски производи.</span>
          </button>

          <button
            type="button"
            className="operator-mode-card"
            onClick={() => {
              setSelectedMode("pecenjara");
              setDraft((current) => ({ ...current, mode: "pecenjara" }));
              window.history.replaceState({}, "", "/planning?mode=pecenjara");
            }}
          >
            <strong>Печењара</strong>
            <span>План по локација, време и количина за печењара.</span>
          </button>
        </section>
      )}

      {selectedMode && (
        <>
          <div className="operator-explainer">
            <strong>Како се внесува план:</strong>
            <span>1. Одбери локација.</span>
            <span>2. Одбери термин.</span>
            <span>3. Внеси количина во парчиња.</span>
            <span>4. Кликни `Додади план` за да се запише.</span>
            <span>5. Најдолу се гледа прегледот на сите планови со филтри.</span>
          </div>

          <section className="admin-hero-grid">
            <article className="admin-stat-tile">
              <span>Локации во план</span>
              <strong>{totals.markets.size}</strong>
            </article>
            <article className="admin-stat-tile">
              <span>Вкупно планирани парчиња</span>
              <strong>{totals.qty}</strong>
            </article>
            <article className="admin-stat-tile">
              <span>Системски редови</span>
              <strong>{data.data.filter((card) => card.mode === selectedMode).length}</strong>
            </article>
          </section>

          <section ref={planFormRef} className="admin-form-grid planning-form-grid">
            <article className="admin-input-tile planning-input-tile planning-input-tile--location">
              <span>1. Одбери локација</span>
              <input
                className="search-input"
                value={nameSearch}
                placeholder="Филтер по име на локација"
                onChange={(event) => setNameSearch(event.target.value)}
              />
              <input
                className="search-input"
                value={codeSearch}
                placeholder="Филтер по шифра на локација"
                onChange={(event) => setCodeSearch(event.target.value)}
              />
              <select
                value={draft.locationId}
                onChange={(event) => setDraft((current) => ({ ...current, locationId: Number(event.target.value) }))}
              >
                {filteredLocations.map((location) => (
                  <option key={location.locationId} value={location.locationId}>
                    {location.code} · {location.nameMk}
                  </option>
                ))}
              </select>
            </article>

            <article className="admin-input-tile planning-input-tile">
              <span>2. Термин</span>
              <select
                value={draft.plannedTime}
                onChange={(event) => setDraft((current) => ({ ...current, plannedTime: event.target.value }))}
              >
                {activeTerms.map((term) => (
                  <option key={term.id} value={term.time}>
                    {term.label} · {formatTime24h(term.time)}
                  </option>
                ))}
              </select>
            </article>

            <article className="admin-input-tile planning-input-tile">
              <span>3. Количина</span>
              <input
                type="number"
                min="0"
                value={draft.plannedQty}
                onChange={(event) => setDraft((current) => ({ ...current, plannedQty: Number(event.target.value) }))}
              />
            </article>

            <article className="admin-input-tile admin-input-tile--action planning-input-tile planning-input-tile--action">
              <span>4. Сними</span>
              <button
                className="action-button"
                type="button"
                disabled={createPlanMutation.isPending || updatePlanMutation.isPending || deletePlanMutation.isPending}
                onClick={() => {
                  setSaveMessage(null);
                  setSaveError(null);

                  if (!draft.locationId || !draft.plannedTime || draft.plannedQty <= 0) {
                    setSaveError("Одбери локација и внеси валидно време и количина.");
                    return;
                  }

                  const payload = {
                    mode: selectedMode,
                    locationId: draft.locationId,
                    plannedTime: draft.plannedTime,
                    plannedQty: draft.plannedQty
                  };

                  const onSuccess = () => {
                    const locationName = locations.find((location) => location.locationId === draft.locationId)?.nameMk ?? "избраната локација";
                    setSaveMessage(editingPlanId ? `Успешно е изменет планот за ${locationName}.` : `Успешно е снимен план за ${locationName}.`);
                    setEditingPlanId(null);
                    setDraft((current) => ({
                      ...current,
                      locationId: filteredLocations[0]?.locationId ?? current.locationId,
                      plannedTime: "07:00",
                      plannedQty: 12
                    }));
                    setNameSearch("");
                    setCodeSearch("");
                  };

                  const onError = (error: unknown) => {
                    setSaveError(error instanceof Error ? error.message : "Планот не може да се сними.");
                  };

                  if (editingPlanId) {
                    updatePlanMutation.mutate({ planHeaderId: editingPlanId, payload }, { onSuccess, onError });
                    return;
                  }

                  createPlanMutation.mutate(payload, {
                    onSuccess: () => {
                      onSuccess();
                    },
                    onError
                  });
                }}
              >
                {createPlanMutation.isPending || updatePlanMutation.isPending ? "Снима..." : editingPlanId ? "Сними измена" : "Додади план"}
              </button>
              {editingPlanId && (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setEditingPlanId(null);
                    setSaveMessage(null);
                    setSaveError(null);
                    setDraft((current) => ({
                      ...current,
                      plannedTime: "07:00",
                      plannedQty: 12
                    }));
                  }}
                >
                  Откажи измена
                </button>
              )}
            </article>
          </section>

        </>
      )}

      <section className="panel">
        <div className="panel-header">
          <h3>Преглед на планови</h3>
        </div>
        <div className="master-form master-form--inline">
          <select value={reviewMode} onChange={(event) => setReviewMode(event.target.value as PlanningMode | "all")}>
            <option value="all">Сите делови</option>
            <option value="pekara">Пекара</option>
            <option value="pecenjara">Печењара</option>
          </select>
          <select
            value={reviewLocationId}
            onChange={(event) => {
              const nextValue = event.target.value;
              setReviewLocationId(nextValue === "all" ? "all" : Number(nextValue));
            }}
          >
            <option value="all">Сите локации</option>
            {locations.map((location) => (
              <option key={location.locationId} value={location.locationId}>
                {location.code} · {location.nameMk}
              </option>
            ))}
          </select>
          <select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value as "active" | "inactive" | "all")}>
            <option value="active">Само активни</option>
            <option value="inactive">Само неактивни</option>
            <option value="all">Сите статуси</option>
          </select>
        </div>
        <div className="admin-hero-grid">
          <article className="admin-stat-tile">
            <span>Прикажани планови</span>
            <strong>{reviewedPlans.length}</strong>
          </article>
          <article className="admin-stat-tile">
            <span>Активни планови</span>
            <strong>{reviewedPlans.filter((entry) => isPlanActive(entry.status)).length}</strong>
          </article>
          <article className="admin-stat-tile">
            <span>Неактивни планови</span>
            <strong>{reviewedPlans.filter((entry) => !isPlanActive(entry.status)).length}</strong>
          </article>
        </div>
        {!reviewedPlans.length && <div className="empty-state">Нема планови за избраниот филтер.</div>}
        <div className="card-list admin-summary-grid">
          {reviewedPlans.map((entry) => (
            <article className="workflow-card admin-tile-card" key={`review-${entry.planHeaderId}`}>
              <div className="workflow-card__top">
                <span className="pill">{formatTime24h(entry.termLabel)}</span>
                <span className={`status-chip ${isPlanActive(entry.status) ? "status-chip--active" : "status-chip--inactive"}`}>
                  {isPlanActive(entry.status) ? "Активен" : "Неактивен"}
                </span>
              </div>
              <h4>{entry.locationName}</h4>
              <p>Дел: {entry.mode === "pekara" ? "Пекара" : "Печењара"}</p>
              <p>Време: {formatTime24h(entry.termLabel)}</p>
              <p>Количина: {entry.correctedQty}</p>
              <div className="login-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setEditingPlanId(Number(entry.planHeaderId));
                    setSelectedMode(entry.mode as PlanningMode);
                    setDraft({
                      mode: entry.mode as PlanningMode,
                      locationId: entry.locationId,
                      plannedTime: entry.termLabel,
                      plannedQty: Number(entry.correctedQty)
                    });
                    setSaveMessage(null);
                    setSaveError(null);
                    window.history.replaceState({}, "", `/planning?mode=${entry.mode}`);
                    window.setTimeout(() => {
                      planFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 0);
                  }}
                >
                  Измени
                </button>
                {!isPlanActive(entry.status) ? (
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={activatePlanMutation.isPending}
                    onClick={() => {
                      setSaveMessage(null);
                      setSaveError(null);
                      activatePlanMutation.mutate(Number(entry.planHeaderId), {
                        onSuccess: () => {
                          setReviewStatus("all");
                          setSaveMessage(`Успешно е активиран планот за ${entry.locationName}.`);
                        },
                        onError: (error: unknown) => {
                          setSaveError(error instanceof Error ? error.message : "Планот не може да се активира.");
                        }
                      });
                    }}
                  >
                    {activatePlanMutation.isPending ? "Активира..." : "Активирај"}
                  </button>
                ) : (
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={deactivatePlanMutation.isPending}
                    onClick={() => {
                      setSaveMessage(null);
                      setSaveError(null);
                      deactivatePlanMutation.mutate(Number(entry.planHeaderId), {
                        onSuccess: () => {
                          if (editingPlanId === Number(entry.planHeaderId)) {
                            setEditingPlanId(null);
                          }
                          setReviewStatus("all");
                          setSaveMessage(`Успешно е деактивиран планот за ${entry.locationName}.`);
                        },
                        onError: (error: unknown) => {
                          setSaveError(error instanceof Error ? error.message : "Планот не може да се деактивира.");
                        }
                      });
                    }}
                  >
                    {deactivatePlanMutation.isPending ? "Деактивира..." : "Деактивирај"}
                  </button>
                )}
                <button
                  className="ghost-button"
                  type="button"
                  disabled={deletePlanMutation.isPending}
                  onClick={() => {
                    setSaveMessage(null);
                    setSaveError(null);
                    deletePlanMutation.mutate(Number(entry.planHeaderId), {
                      onSuccess: () => {
                        if (editingPlanId === Number(entry.planHeaderId)) {
                          setEditingPlanId(null);
                          setDraft((current) => ({
                            ...current,
                            locationId: filteredLocations[0]?.locationId ?? current.locationId,
                            plannedTime: "07:00",
                            plannedQty: 12
                          }));
                        }
                        setSaveMessage(`Успешно е избришан планот за ${entry.locationName}.`);
                      },
                      onError: (error: unknown) => {
                        setSaveError(error instanceof Error ? error.message : "Планот не може да се избрише.");
                      }
                    });
                  }}
                >
                  {deletePlanMutation.isPending ? "Брише..." : "Избриши"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
