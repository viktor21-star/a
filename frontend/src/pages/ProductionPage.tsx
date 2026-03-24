import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { playFeedback } from "../lib/feedback";
import { useCreateOperatorEntry, useCreateWasteEntry, useItems, useLocations, useOperatorEntries, usePlans, useReasons, useUserLocations, useWasteEntries } from "../lib/queries";
import { createLocalId, queuePendingOperatorEntry, queuePendingWasteEntry, shouldQueueOffline } from "../lib/operatorEntryQueue";
import type { CreateOperatorEntryRequest, CreateWasteEntryRequest, Item, OperatorEntryLine } from "../lib/types";

type ItemMode = "pekara" | "pecenjara" | "pijara";
type EntryMode = ItemMode | "waste";

function formatClassBLabel(code?: string | null, name?: string | null) {
  const normalizedCode = (code ?? "").trim();
  const normalizedName = (name ?? "").trim();

  if (normalizedCode && normalizedName) {
    return `${normalizedCode} · ${normalizedName}`;
  }

  return normalizedCode || normalizedName || "";
}

export function ProductionPage() {
  const { user } = useAuth();
  const operatorEntriesQuery = useOperatorEntries();
  const wasteQuery = useWasteEntries();
  const itemsQuery = useItems();
  const plansQuery = usePlans();
  const reasonsQuery = useReasons();
  const locationsQuery = useLocations(true);
  const createEntryMutation = useCreateOperatorEntry();
  const createWasteMutation = useCreateWasteEntry();
  const permissionsQuery = useUserLocations(user?.id ?? null);
  const [adminMode, setAdminMode] = useState<ItemMode>("pekara");
  const [previewPhoto, setPreviewPhoto] = useState<{ src: string; title: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<EntryMode | null>(null);
  const [draft, setDraft] = useState({ note: "", photoDataUrl: "", photoName: "" });
  const [draftItems, setDraftItems] = useState<OperatorEntryLine[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [wasteSource, setWasteSource] = useState<ItemMode | null>(null);
  const [wasteItemSearch, setWasteItemSearch] = useState("");
  const [wasteItemName, setWasteItemName] = useState("");
  const [wasteQuantity, setWasteQuantity] = useState(1);
  const [wasteReason, setWasteReason] = useState("");
  const [saveConfirmation, setSaveConfirmation] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const adminQueryMode = useMemo(() => {
    const mode = new URLSearchParams(window.location.search).get("adminMode");
    return mode === "pijara" ? "pijara" : null;
  }, []);
  const photoReady = Boolean(draft.photoDataUrl);
  const itemReady = draftItems.length > 0;
  const quantityReady = draftItems.every(
    (entry) =>
      !entry.itemName ||
      (entry.quantity > 0 && (selectedMode !== "pijara" || !entry.classB || entry.classBQuantity > 0))
  );
  const readyItems = draftItems.filter(
    (entry) =>
      entry.itemName &&
      entry.quantity > 0 &&
      (selectedMode !== "pijara" || !entry.classB || entry.classBQuantity > 0)
  );
  const effectiveItemMode = selectedMode === "waste" ? wasteSource : selectedMode;
  const availableItems = useMemo(() => filterItemsForMode(itemsQuery.data?.data ?? [], effectiveItemMode), [itemsQuery.data, effectiveItemMode]);
  const filteredSelectableItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return availableItems
      .filter((item) => [item.nameMk, item.code].some((value) => value.toLowerCase().includes(query)))
      .slice(0, 24);
  }, [availableItems, itemSearch]);
  const wasteReasons = useMemo(
    () => (reasonsQuery.data?.data ?? []).filter((entry) => entry.isActive && entry.category === "отпад"),
    [reasonsQuery.data]
  );
  const assignedLocations = permissionsQuery.data?.data ?? [];
  const activeLocation = useMemo(() => {
    if (!assignedLocations.length) {
      return null;
    }

    return assignedLocations.find((entry) => entry.locationId === user?.defaultLocationId) ?? assignedLocations[0];
  }, [assignedLocations, user?.defaultLocationId]);

  const activeLocationLabel = useMemo(() => {
    if (!activeLocation) {
      return "Нема";
    }

    const matchedLocation = locationsQuery.data?.data.find((entry) => entry.locationId === activeLocation.locationId);
    return formatLocationLabel(matchedLocation?.code, matchedLocation?.nameMk ?? activeLocation.locationName);
  }, [activeLocation, locationsQuery.data]);

  const needsReasons = selectedMode === "waste";
  const needsPlans = selectedMode !== null && selectedMode !== "pijara" && selectedMode !== "waste";
  const needsItems = selectedMode !== null;

  const modeAccess = useMemo(() => {
    const permission = activeLocation
      ? (permissionsQuery.data?.data ?? []).find((entry) => entry.locationId === activeLocation.locationId) ?? null
      : null;

    return {
      pekara: Boolean(permission?.canBake && permission.canUsePekara),
      pecenjara: Boolean(permission?.canBake && permission.canUsePecenjara),
      pijara: Boolean(permission?.canBake && permission.canUsePijara),
      waste: Boolean(
        permission?.canRecordWaste ||
        permission?.canUsePekara ||
        permission?.canUsePecenjara ||
        permission?.canUsePijara
      )
    };
  }, [activeLocation, permissionsQuery.data]);

  function resetSharedDraftState() {
    setDraft({ note: "", photoDataUrl: "", photoName: "" });
    setSaveError(null);
    setSaveConfirmation(null);
  }

  function resetEntryState() {
    resetSharedDraftState();
    setDraftItems([]);
    setItemSearch("");
  }

  function resetWasteState() {
    resetSharedDraftState();
    setWasteSource(null);
    setWasteItemSearch("");
    setWasteItemName("");
    setWasteQuantity(1);
    setWasteReason("");
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("mode");
    if (
      (requestedMode === "pekara" || requestedMode === "pecenjara" || requestedMode === "pijara" || requestedMode === "waste") &&
      modeAccess[requestedMode]
    ) {
      setSelectedMode(requestedMode);
      return;
    }

    if (selectedMode && modeAccess[selectedMode]) {
      return;
    }

    if (modeAccess.pekara) {
      setSelectedMode("pekara");
      return;
    }

    if (modeAccess.pecenjara) {
      setSelectedMode("pecenjara");
      return;
    }

    if (modeAccess.pijara) {
      setSelectedMode("pijara");
      return;
    }

    if (modeAccess.waste) {
      setSelectedMode("waste");
      return;
    }

    setSelectedMode(null);
  }, [modeAccess, selectedMode]);

  useEffect(() => {
    if (!selectedMode) {
      resetEntryState();
      setWasteSource(null);
      return;
    }

    if (selectedMode === "waste") {
      resetWasteState();
      return;
    }

    resetEntryState();
  }, [selectedMode]);

  useEffect(() => {
    if (!selectedMode) {
      return;
    }

    const nextUrl = `/production?mode=${selectedMode}`;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  }, [selectedMode]);

  useEffect(() => {
    if (selectedMode === "waste") {
      return;
    }
  }, [availableItems, selectedMode]);

  useEffect(() => {
    if (selectedMode === "waste") {
      if (wasteItemName && !availableItems.some((item) => item.nameMk === wasteItemName)) {
        setWasteItemName("");
      }

      if (wasteItemSearch && !availableItems.some((item) => [item.nameMk, item.code].some((value) => value.toLowerCase().includes(wasteItemSearch.trim().toLowerCase())))) {
        setWasteItemSearch("");
      }
      return;
    }

    setDraftItems((current) => current.filter((entry) => availableItems.some((item) => item.nameMk === entry.itemName)));
  }, [availableItems, selectedMode]);

  useEffect(() => {
    if (!saveConfirmation) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSaveConfirmation(null);
      setSelectedMode(null);
      window.history.replaceState({}, "", "/production");
      window.location.href = "/";
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [saveConfirmation]);

  if (
    permissionsQuery.isLoading ||
    (needsItems && itemsQuery.isLoading) ||
    (needsPlans && plansQuery.isLoading) ||
    (needsReasons && reasonsQuery.isLoading)
  ) {
    const loadingParts = [
      permissionsQuery.isLoading ? "привилегии" : null,
      needsItems && itemsQuery.isLoading ? "артикли" : null,
      needsPlans && plansQuery.isLoading ? "планови" : null,
      needsReasons && reasonsQuery.isLoading ? "причини" : null
    ].filter(Boolean);

    return <PageState message={`Се вчитуваат оперативните податоци${loadingParts.length ? `: ${loadingParts.join(", ")}` : "..."}`} />;
  }

  if (
    permissionsQuery.isError ||
    (needsItems && itemsQuery.isError) ||
    (needsPlans && plansQuery.isError) ||
    (needsReasons && reasonsQuery.isError)
  ) {
    const errorParts = [
      permissionsQuery.isError ? "привилегии" : null,
      needsItems && itemsQuery.isError ? "артикли" : null,
      needsPlans && plansQuery.isError ? "планови" : null,
      needsReasons && reasonsQuery.isError ? "причини" : null
    ].filter(Boolean);

    return <PageState message={`Не може да се вчита оперативниот модул${errorParts.length ? `: ${errorParts.join(", ")}` : "."}`} />;
  }

  if (selectedMode && selectedMode !== "waste" && !availableItems.length) {
    return <PageState message="Нема активни артикли за избраниот модул." />;
  }

  if (!modeAccess.pekara && !modeAccess.pecenjara && !modeAccess.pijara && !modeAccess.waste) {
    return <PageState message="Корисникот нема дозвола за внес во Пекара, Печењара, Пијара или Отпад." />;
  }

  if (!isAdministrator(user) && !activeLocation) {
    return <PageState message="Операторот нема доделена работна локација." />;
  }

  const activePlan = !isAdministrator(user) && selectedMode && selectedMode !== "pijara" && selectedMode !== "waste"
    ? (plansQuery.data?.data ?? [])
        .filter((entry) => entry.mode === selectedMode && entry.locationId === activeLocation?.locationId)
        .sort((left, right) => left.termLabel.localeCompare(right.termLabel))
    : [];
  const adminDisplayMode = adminQueryMode ?? adminMode;

  if (!isAdministrator(user)) {
    return (
      <section className="page-grid operator-fullscreen-page">
        <header className="page-header">
          <div>
            <p className="topbar-eyebrow">Оператор</p>
            <h3>
              {selectedMode === "pekara"
                ? "Пекара"
                : selectedMode === "pecenjara"
                  ? "Печењара"
                  : selectedMode === "pijara"
                    ? "Пијара"
                    : selectedMode === "waste"
                      ? "Отпад"
                    : "Избери тип на внес"}
            </h3>
          </div>
        </header>

        {!selectedMode && (
          <section className="operator-mode-grid">
            {modeAccess.pekara && (
              <button
                type="button"
                className="operator-mode-card"
                onClick={() => setSelectedMode("pekara")}
              >
                <strong>Пекара</strong>
                <span>Леб, бурек, кифли, печива</span>
              </button>
            )}

            {modeAccess.pecenjara && (
              <button
                type="button"
                className="operator-mode-card"
                onClick={() => setSelectedMode("pecenjara")}
              >
                <strong>Печењара</strong>
                <span>Пилешко, месо и rotisserie</span>
              </button>
            )}

            {modeAccess.pijara && (
              <button
                type="button"
                className="operator-mode-card"
                onClick={() => setSelectedMode("pijara")}
              >
                <strong>Пијара</strong>
                <span>Пријава на артикли што одат како Класа Б.</span>
              </button>
            )}

            {modeAccess.waste && (
              <button
                type="button"
                className="operator-mode-card"
                onClick={() => setSelectedMode("waste")}
              >
                <strong>Отпад</strong>
                <span>Пријава на отпад со избор од кој дел доаѓа отпадот.</span>
              </button>
            )}
          </section>
        )}

        {selectedMode && selectedMode !== "waste" && (
          <section className="panel operator-entry-panel">
            <div className="panel-header">
              <h3>
                Внес за{" "}
                {selectedMode === "pekara"
                  ? "Пекара"
                  : selectedMode === "pecenjara"
                    ? "Печењара"
                    : "Пијара · Пријава"}
              </h3>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  resetEntryState();
                  setSelectedMode(null);
                  window.history.replaceState({}, "", "/production");
                  window.location.href = "/";
                }}
              >
                Назад
              </button>
            </div>

            <div className="operator-explainer">
              <strong>Како се внесува:</strong>
              <span>Работна локација: {activeLocationLabel}</span>
              {selectedMode === "pijara" ? (
                <>
                  <span>1. Една пријава е една слика. Без слика не може да се сними.</span>
                  <span>2. Избери артикал. Под артикалот се прикажува неговата шифра, само за идентификација.</span>
                  <span>3. Поле „Количина“ е вкупната пријавена количина за тој артикал.</span>
                  <span>4. Поле „Класа Б“ е по default вклучено и „Количина за Класа Б“ е количината што оди во Класа Б.</span>
                </>
              ) : (
                <>
                  <span>1. Сликај го печењето.</span>
                  <span>2. Додади еден или повеќе артикли што се испечени.</span>
                  <span>3. За секој артикал внеси количина.</span>
                  <span>4. Ако треба, додади забелешка и сними.</span>
                </>
              )}
            </div>

            {selectedMode && selectedMode !== "pijara" && (
              <div className="operator-explainer">
                <strong>План за печење</strong>
                {activePlan.length === 0 ? (
                  <span>Нема внесен план за оваа локација и модул.</span>
                ) : (
                  activePlan.map((entry, index) => (
                    <span key={`${entry.planHeaderId}-${entry.locationId}-${entry.termLabel}-${index}`}>
                      {entry.termLabel} · {entry.correctedQty} парчиња
                    </span>
                  ))
                )}
              </div>
            )}

            {saveConfirmation && (
              <div className="operator-success-banner">
                <strong>Успешно снимено</strong>
                <span>{saveConfirmation}</span>
              </div>
            )}

            {saveError && <div className="form-error">{saveError}</div>}

            <div className="operator-step-grid">
              <article className={`operator-step-card${photoReady ? " operator-step-card--done" : ""}`}>
                <div className="operator-step-card__header">
                  <span className="pill">Чекор 1</span>
                  <strong>{selectedMode === "pijara" ? "Сликај артикал" : "Сликај печење"}</strong>
                </div>
                <label className="operator-photo-field">
                  <span>{selectedMode === "pijara" ? "Задолжителна слика од артикалот" : "Задолжителна слика од печењето"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (event) => {
                      setSaveError(null);
                      const file = event.target.files?.[0];
                      if (!file) {
                        setDraft((current) => ({ ...current, photoDataUrl: "", photoName: "" }));
                        return;
                      }

                      const photoDataUrl = await fileToDataUrl(file);
                      setDraft((current) => ({
                        ...current,
                        photoDataUrl,
                        photoName: file.name
                      }));
                    }}
                  />
                </label>

                {draft.photoDataUrl && (
                  <div className="operator-photo-preview">
                    <img src={draft.photoDataUrl} alt="Слика од печење" />
                  </div>
                )}
              </article>

              {photoReady && (
                <article className={`operator-step-card${itemReady ? " operator-step-card--done" : ""}`}>
                  <div className="operator-step-card__header">
                    <span className="pill">Чекор 2</span>
                    <strong>{selectedMode === "pijara" ? "Избери артикли за пријава" : "Избери артикли за печење"}</strong>
                  </div>
                  <input
                    className="search-input"
                    value={itemSearch}
                    placeholder="Пребарај по име или шифра"
                    onChange={(event) => setItemSearch(event.target.value)}
                  />
                  {!itemSearch.trim() ? (
                    <div className="list-card">Внеси име или шифра за да ги видиш артиклите.</div>
                  ) : filteredSelectableItems.length === 0 ? (
                    <div className="list-card">Нема артикли што одговараат на пребарувањето.</div>
                  ) : (
                    <div className="operator-lines-grid">
                      {filteredSelectableItems.map((item) => {
                        const selectedItem = draftItems.some((entry) => entry.itemName === item.nameMk);

                        return (
                          <div className="operator-line-row operator-line-row--checkbox" key={item.itemId}>
                            <label className="operator-item-toggle">
                              <input
                                type="checkbox"
                                checked={selectedItem}
                                onChange={(event) => {
                                  const checked = event.target.checked;
                                  setDraftItems((current) => {
                                    if (checked) {
                                      if (current.some((entry) => entry.itemName === item.nameMk)) {
                                        return current;
                                      }

                                      return [
                                        ...current,
                                        {
                                          itemName: item.nameMk,
                                          quantity: 1,
                                          classB: selectedMode === "pijara",
                                          classBItemName:
                                            selectedMode === "pijara" && (item.classBCode || item.classBName)
                                              ? formatClassBLabel(item.classBCode, item.classBName)
                                              : "",
                                          classBQuantity: selectedMode === "pijara" ? 1 : 0
                                        }
                                      ];
                                    }

                                    return current.filter((entry) => entry.itemName !== item.nameMk);
                                  });
                                }}
                              />
                              <span>
                                <strong>{item.nameMk}</strong>
                                <small>Шифра: {item.code}</small>
                              </span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {draftItems.length > 0 && (
                    <div className="operator-selected-items">
                      <strong>Избрани артикли · {draftItems.length}</strong>
                      <div className="operator-lines-grid">
                        {draftItems.map((entry) => (
                          <div
                            className={`operator-line-row operator-line-row--checkbox${selectedMode === "pijara" ? " operator-line-row--pijara" : ""}`}
                            key={`selected-${entry.itemName}`}
                          >
                            <div className="operator-item-toggle">
                              <span>
                                <strong>{entry.itemName}</strong>
                                <small>
                                  Шифра: {availableItems.find((item) => item.nameMk === entry.itemName)?.code ?? "-"}
                                </small>
                              </span>
                            </div>
                            {selectedMode === "pijara" ? <div className="operator-field-label">Вкупна количина</div> : null}
                            <input
                              type="number"
                              min="0"
                              value={entry.quantity}
                              onChange={(event) => {
                                const nextValue = Number(event.target.value);
                                setDraftItems((current) =>
                                  current.map((line) =>
                                    line.itemName === entry.itemName
                                          ? {
                                              ...line,
                                              quantity: nextValue,
                                              classBQuantity: line.classB ? Math.min(line.classBQuantity, nextValue) : line.classBQuantity
                                        }
                                      : line
                                  )
                                );
                              }}
                              aria-label={selectedMode === "pijara" ? "Вкупна количина" : "Количина"}
                              placeholder={selectedMode === "pijara" ? "Вкупна количина" : "Количина"}
                            />
                            {selectedMode === "pijara" ? (
                              <>
                                <label className="operator-classb-toggle">
                                  <input
                                    type="checkbox"
                                    checked={entry.classB}
                                    onChange={(event) => {
                                      const checked = event.target.checked;
                                      setDraftItems((current) =>
                                        current.map((line) =>
                                          line.itemName === entry.itemName
                                            ? {
                                                ...line,
                                                classB: checked,
                                                classBItemName:
                                                  checked
                                                    ? line.classBItemName ||
                                                      formatClassBLabel(
                                                        availableItems.find((item) => item.nameMk === line.itemName)?.classBCode,
                                                        availableItems.find((item) => item.nameMk === line.itemName)?.classBName
                                                      )
                                                    : "",
                                                classBQuantity: checked ? Math.max(line.classBQuantity, 1) : 0
                                              }
                                            : line
                                        )
                                      );
                                    }}
                                  />
                                  <span>Класа Б</span>
                                </label>
                                <div className="operator-field-label">Од тоа Класа Б</div>
                                <span className="meta">
                                  Б-класа артикал:{" "}
                                  {entry.classBItemName || "Нема поврзан Б-класа артикал во source."}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  value={entry.classB ? entry.classBQuantity : 0}
                                  onChange={(event) => {
                                    const nextValue = Number(event.target.value);
                                    setDraftItems((current) =>
                                      current.map((line) =>
                                        line.itemName === entry.itemName
                                          ? {
                                              ...line,
                                              classB: nextValue > 0 || line.classB,
                                              classBItemName:
                                                line.classBItemName ||
                                                formatClassBLabel(
                                                  availableItems.find((item) => item.nameMk === line.itemName)?.classBCode,
                                                  availableItems.find((item) => item.nameMk === line.itemName)?.classBName
                                                ),
                                              classBQuantity: Math.min(nextValue, line.quantity)
                                            }
                                          : line
                                      )
                                    );
                                  }}
                                  aria-label="Од тоа Класа Б"
                                  placeholder="Од тоа Класа Б"
                                  disabled={!entry.classB}
                                />
                              </>
                            ) : (
                              <button
                                className="ghost-button"
                                type="button"
                                onClick={() => {
                                  setDraftItems((current) => current.filter((line) => line.itemName !== entry.itemName));
                                }}
                              >
                                Тргни
                              </button>
                            )}
                            {selectedMode === "pijara" && (
                              <button
                                className="ghost-button"
                                type="button"
                                onClick={() => {
                                  setDraftItems((current) => current.filter((line) => line.itemName !== entry.itemName));
                                }}
                              >
                                Тргни
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {selectedMode === "pijara" && (
                        <div className="list-card">
                          Вкупна количина е целата количина за пријавениот артикал. Од тоа Класа Б е делот што се ослободува по пријава, а Б-класа артикалот се повлекува автоматски од source.
                        </div>
                      )}
                    </div>
                  )}
                </article>
              )}

              {photoReady && itemReady && (
                <article className={`operator-step-card${quantityReady ? " operator-step-card--done" : ""}`}>
                  <div className="operator-step-card__header">
                    <span className="pill">Чекор 3</span>
                    <strong>{selectedMode === "pijara" ? "Провери Класа Б и внеси забелешка" : "Провери количини и внеси забелешка"}</strong>
                  </div>
                  <input
                    value={draft.note}
                    onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
                    placeholder="Забелешка"
                  />
                </article>
              )}

              {photoReady && itemReady && quantityReady && (
                <article className="operator-step-card operator-step-card--done">
                  <div className="operator-step-card__header">
                    <span className="pill">Чекор 4</span>
                    <strong>{selectedMode === "pijara" ? "Сними пријава" : "Сними внес"}</strong>
                  </div>
                  <button
                    className="action-button"
                    type="button"
                    disabled={createEntryMutation.isPending}
                    onClick={() => {
                      if (readyItems.length === 0 || !draft.photoDataUrl) {
                        return;
                      }

                      setSaveError(null);

                      const nextEntry: CreateOperatorEntryRequest = {
                        mode: selectedMode,
                        locationId: activeLocation?.locationId ?? 0,
                        locationName: activeLocation?.locationName ?? "Непозната локација",
                        items: readyItems,
                        note: draft.note,
                        photoDataUrl: draft.photoDataUrl,
                        photoName: draft.photoName,
                        createdAt: new Date().toLocaleString("mk-MK")
                      };
                      createEntryMutation.mutate(nextEntry, {
                        onSuccess: () => {
                          resetEntryState();
                          playFeedback("success", "Успешен внес");
                          setSaveConfirmation(
                            `${selectedMode === "pekara" ? "Пекара" : selectedMode === "pecenjara" ? "Печењара" : "Пијара"} · ${readyItems.length} артикли`
                          );
                        },
                        onError: (error) => {
                          if (shouldQueueOffline(error)) {
                            queuePendingOperatorEntry({
                              ...nextEntry,
                              localId: createLocalId()
                            });
                            resetEntryState();
                            playFeedback("offline", "Снимено локално");
                            setSaveConfirmation("Нема интернет. Внесот е снимен локално и ќе се испрати автоматски.");
                            return;
                          }

                          setSaveError("Неуспешен внес. Провери дали интернетот и серверот работат, па пробај повторно. Ако проблемот остане, контактирај администратор.");
                          playFeedback("error", "Неуспешен внес");
                        }
                      });
                    }}
                  >
                    {createEntryMutation.isPending ? "Се снима..." : selectedMode === "pijara" ? "Сними пријава" : "Сними внес"}
                  </button>
                </article>
              )}
            </div>
          </section>
        )}

        {selectedMode === "waste" && (
          <section className="panel operator-entry-panel">
            <div className="panel-header">
              <h3>Пријава на отпад</h3>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  resetWasteState();
                  setSelectedMode(null);
                  window.history.replaceState({}, "", "/production");
                  window.location.href = "/";
                }}
              >
                Назад
              </button>
            </div>

            <div className="operator-explainer">
              <strong>Како се пријавува отпад:</strong>
              <span>Работна локација: {activeLocationLabel}</span>
              <span>1. Избери од кој дел е отпадот: Пекара, Печењара или Пијара.</span>
              <span>2. Сликај го отпадот. Една пријава е една слика.</span>
              <span>3. Избери артикал. Ќе се прикажат само артиклите за избраниот дел.</span>
              <span>4. Внеси количина и причина за отпад.</span>
              <span>5. Сними. По успешно снимање ќе се вратиш на почетниот екран.</span>
            </div>

            {saveConfirmation && (
              <div className="operator-success-banner">
                <strong>Успешно снимено</strong>
                <span>{saveConfirmation}</span>
              </div>
            )}

            {saveError && <div className="form-error">{saveError}</div>}

            <div className="operator-step-grid">
              <article className={`operator-step-card${wasteSource ? " operator-step-card--done" : ""}`}>
                <div className="operator-step-card__header">
                  <span className="pill">Чекор 1</span>
                  <strong>Избери од кој дел е отпадот</strong>
                </div>
                <div className="operator-mode-grid">
                  {(["pekara", "pecenjara", "pijara"] as const)
                    .filter((mode) => modeAccess[mode])
                    .map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`operator-mode-card${wasteSource === mode ? " operator-mode-card--active" : ""}`}
                        onClick={() => {
                          setSaveError(null);
                          setWasteSource(mode);
                          setWasteItemName("");
                          setWasteItemSearch("");
                        }}
                      >
                        <strong>{mode === "pekara" ? "Пекара" : mode === "pecenjara" ? "Печењара" : "Пијара"}</strong>
                        <span>
                          {mode === "pekara"
                            ? "Отпад од пекарски производи."
                            : mode === "pecenjara"
                              ? "Отпад од печењара."
                              : "Отпад од Пијара."}
                        </span>
                      </button>
                    ))}
                </div>
              </article>

              {wasteSource && (
                <article className={`operator-step-card${photoReady ? " operator-step-card--done" : ""}`}>
                  <div className="operator-step-card__header">
                    <span className="pill">Чекор 2</span>
                    <strong>Сликај отпад</strong>
                  </div>
                  <label className="operator-photo-field">
                    <span>Задолжителна слика од отпадот</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={async (event) => {
                        setSaveError(null);
                        const file = event.target.files?.[0];
                        if (!file) {
                          setDraft((current) => ({ ...current, photoDataUrl: "", photoName: "" }));
                          return;
                        }

                        const photoDataUrl = await fileToDataUrl(file);
                        setDraft((current) => ({
                          ...current,
                          photoDataUrl,
                          photoName: file.name
                        }));
                      }}
                    />
                  </label>

                  {draft.photoDataUrl && (
                    <div className="operator-photo-preview">
                      <img src={draft.photoDataUrl} alt="Слика од отпад" />
                    </div>
                  )}
                </article>
              )}

              {wasteSource && photoReady && (
                <article className={`operator-step-card${Boolean(wasteItemName) ? " operator-step-card--done" : ""}`}>
                  <div className="operator-step-card__header">
                    <span className="pill">Чекор 3</span>
                    <strong>Избери артикал</strong>
                  </div>
                  {availableItems.length === 0 ? (
                    <div className="list-card">Нема активни артикли за избраниот дел.</div>
                  ) : (
                    <>
                      <input
                        className="search-input"
                        value={wasteItemSearch}
                        placeholder="Пребарај по име или шифра"
                        onChange={(event) => setWasteItemSearch(event.target.value)}
                      />
                      {!wasteItemSearch.trim() ? (
                        <div className="list-card">Внеси име или шифра за да ги видиш артиклите.</div>
                      ) : (
                        <div className="operator-lines-grid">
                          {availableItems
                            .filter((item) => [item.nameMk, item.code].some((value) => value.toLowerCase().includes(wasteItemSearch.trim().toLowerCase())))
                            .slice(0, 24)
                            .map((item) => (
                              <label className="operator-line-row operator-line-row--checkbox operator-item-toggle" key={item.itemId}>
                                <input
                                  type="checkbox"
                                  checked={wasteItemName === item.nameMk}
                                  onChange={(event) => setWasteItemName(event.target.checked ? item.nameMk : "")}
                                />
                                <span>
                                  <strong>{item.nameMk}</strong>
                                  <small>Шифра: {item.code}</small>
                                </span>
                              </label>
                            ))}
                        </div>
                      )}
                      {wasteItemName && (
                        <span className="meta">
                          Артикал шифра: {availableItems.find((item) => item.nameMk === wasteItemName)?.code ?? "-"}
                        </span>
                      )}
                    </>
                  )}
                </article>
              )}

              {wasteSource && photoReady && wasteItemName && (
                <article className={`operator-step-card${wasteQuantity > 0 && Boolean(wasteReason) ? " operator-step-card--done" : ""}`}>
                  <div className="operator-step-card__header">
                    <span className="pill">Чекор 4</span>
                    <strong>Количина и причина</strong>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={wasteQuantity}
                    onChange={(event) => setWasteQuantity(Number(event.target.value))}
                    placeholder="Количина"
                  />
                  <select value={wasteReason} onChange={(event) => setWasteReason(event.target.value)}>
                    <option value="">Избери причина</option>
                    {wasteReasons.map((entry) => (
                      <option key={entry.id} value={entry.name}>
                        {entry.code} · {entry.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={draft.note}
                    onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
                    placeholder="Забелешка"
                  />
                </article>
              )}

              {wasteSource && photoReady && wasteItemName && wasteQuantity > 0 && Boolean(wasteReason) && (
                <article className="operator-step-card operator-step-card--done">
                  <div className="operator-step-card__header">
                    <span className="pill">Чекор 5</span>
                    <strong>Сними отпад</strong>
                  </div>
                  <button
                    className="action-button"
                    type="button"
                    disabled={createWasteMutation.isPending}
                    onClick={() => {
                      if (!wasteSource || !draft.photoDataUrl || !wasteItemName || !wasteReason || wasteQuantity <= 0) {
                        return;
                      }

                      setSaveError(null);

                      const request: CreateWasteEntryRequest = {
                        sourceMode: wasteSource,
                        locationId: activeLocation?.locationId ?? 0,
                        locationName: activeLocation?.locationName ?? "Непозната локација",
                        itemName: wasteItemName,
                        quantity: wasteQuantity,
                        reason: wasteReason,
                        note: draft.note,
                        photoDataUrl: draft.photoDataUrl,
                        photoName: draft.photoName,
                        createdAt: new Date().toISOString()
                      };

                      createWasteMutation.mutate(request, {
                        onSuccess: () => {
                          resetWasteState();
                          playFeedback("success", "Успешна пријава на отпад");
                          setSaveConfirmation(`Отпад · ${request.locationName} · ${request.itemName}`);
                        },
                        onError: (error) => {
                          if (shouldQueueOffline(error)) {
                            queuePendingWasteEntry({
                              ...request,
                              localId: createLocalId()
                            });
                            resetWasteState();
                            playFeedback("offline", "Отпад снимен локално");
                            setSaveConfirmation("Нема интернет. Отпадот е снимен локално и ќе се испрати автоматски.");
                            return;
                          }

                          setSaveError("Неуспешна пријава на отпад. Провери дали интернетот и серверот работат, па пробај повторно. Ако проблемот остане, контактирај администратор.");
                          playFeedback("error", "Неуспешна пријава на отпад");
                        }
                      });
                    }}
                  >
                    {createWasteMutation.isPending ? "Се снима..." : "Сними отпад"}
                  </button>
                </article>
              )}
            </div>
          </section>
        )}
      </section>
    );
  }

  if (operatorEntriesQuery.isLoading) {
    return <PageState message="Се вчитуваат внесовите..." />;
  }

  if (operatorEntriesQuery.isError || !operatorEntriesQuery.data) {
    return <PageState message="Не може да се вчита реалното печење." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Администратор</p>
          <h3>{adminQueryMode === "pijara" ? "Пријави од Пијара" : "Преглед на реално печење"}</h3>
          <p className="meta">
            {adminQueryMode === "pijara"
              ? "Посебен преглед на пријавени артикли од Пијара, со количина, Класа Б и време."
              : "Администраторот ги гледа вистинските операторски внесови за Пекара и Печењара, по локација, модул и време."}
          </p>
        </div>
      </header>

      {!adminQueryMode && (
        <section className="operator-mode-grid">
          <button
            type="button"
            className={`operator-mode-card${adminMode === "pekara" ? " operator-mode-card--active" : ""}`}
            onClick={() => setAdminMode("pekara")}
          >
            <strong>Пекара</strong>
            <span>Преглед на внесови за пекарските производи.</span>
          </button>
          <button
            type="button"
            className={`operator-mode-card${adminMode === "pecenjara" ? " operator-mode-card--active" : ""}`}
            onClick={() => setAdminMode("pecenjara")}
          >
            <strong>Печењара</strong>
            <span>Преглед на внесови за печењара.</span>
          </button>
        </section>
      )}

      <div className="operator-explainer">
        <strong>Како се користи овој дел:</strong>
        <span>{adminQueryMode === "pijara" ? "1. Лево се гледаат сите последни пријави од Пијара." : "1. Одбери дали гледаш Пекара или Печењара."}</span>
        <span>{adminQueryMode === "pijara" ? "2. За секоја пријава се гледаат локација, оператор, време и артикли." : "2. Лево се гледаат сите последни операторски внесови за избраниот модул."}</span>
        <span>{adminQueryMode === "pijara" ? "3. За Пијара се гледа и Класа Б по артикал." : "3. За секој внес се проверува локација, оператор, време и точните артикли."}</span>
        <span>{adminQueryMode === "pijara" ? "4. Десно се гледа последно пријавениот отпад за брз увид." : "4. Десно се гледа последно пријавениот отпад за брз увид."}</span>
        <span>5. За споредба и анализа продолжи во `Извештаи`.</span>
      </div>

      <div className="panel-grid panel-grid--production">
        <div className="card-list">
          {operatorEntriesQuery.data.data.filter((entry) => entry.mode === adminDisplayMode).length === 0 && (
            <div className="empty-state">Нема снимени внесови за {adminDisplayMode === "pekara" ? "Пекара" : adminDisplayMode === "pecenjara" ? "Печењара" : "Пијара"}.</div>
          )}
          {operatorEntriesQuery.data.data.filter((entry) => entry.mode === adminDisplayMode).map((entry) => (
            <article className="workflow-card" key={entry.id}>
              <div className="workflow-card__top">
                <span className="pill">
                  {entry.mode === "pekara" ? "Пекара" : entry.mode === "pecenjara" ? "Печењара" : "Пијара"}
                </span>
                <span className="meta">{entry.operatorName}</span>
              </div>
              <h4>
                {formatLocationLabel(
                  locationsQuery.data?.data.find((location) => location.locationId === entry.locationId)?.code,
                  locationsQuery.data?.data.find((location) => location.locationId === entry.locationId)?.nameMk ?? entry.locationName
                )}
              </h4>
              <p>Модул: {entry.mode === "pekara" ? "Пекара" : entry.mode === "pecenjara" ? "Печењара" : "Пијара"}</p>
              <p>Време: {formatAdminTimestamp(entry.createdAt)}</p>
              <p>Артикли: {entry.items.map((item) => `${item.itemName} (${item.quantity})`).join(", ")}</p>
              {entry.mode === "pijara" ? (
                <p>
                  Класа Б:{" "}
                  {entry.items
                    .filter((item) => item.classB && item.classBQuantity > 0)
                    .map((item) => `${item.itemName} (${item.classBQuantity})`)
                    .join(", ") || "Нема"}
                </p>
              ) : null}
              {entry.photoName ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={async () => {
                    setPreviewLoading(true);
                    try {
                      const response = await api.getOperatorEntryPhoto<{ data: { photoDataUrl: string; photoName: string } }>(entry.id);
                      setPreviewPhoto({
                        src: response.data.photoDataUrl,
                        title: `${entry.mode === "pekara" ? "Пекара" : entry.mode === "pecenjara" ? "Печењара" : "Пијара"} · ${entry.locationName}`
                      });
                    } catch {
                      setSaveError("Сликата не може да се отвори.");
                    } finally {
                      setPreviewLoading(false);
                    }
                  }}
                >
                  {previewLoading ? "Се отвора..." : "Отвори слика"}
                </button>
              ) : null}
              {entry.note ? <p>Забелешка: {entry.note}</p> : null}
            </article>
          ))}
        </div>

        <aside className="panel">
          <div className="panel-header">
            <h3>Последен отпад</h3>
          </div>
          {wasteQuery.data?.data.map((entry) => (
            <div className="list-card" key={entry.wasteEntryId}>
              {entry.locationName} · {entry.itemName} · {entry.quantity} · {entry.reason}
            </div>
          ))}
        </aside>
      </div>

      {previewPhoto && (
        <div className="image-lightbox" role="dialog" aria-modal="true" onClick={() => setPreviewPhoto(null)}>
          <div className="image-lightbox__content" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <h3>{previewPhoto.title}</h3>
              <button type="button" className="ghost-button" onClick={() => setPreviewPhoto(null)}>
                Затвори
              </button>
            </div>
            <div className="operator-photo-preview image-lightbox__preview">
              <img src={previewPhoto.src} alt={previewPhoto.title} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function filterItemsForMode(items: Item[], mode: ItemMode | null) {
  if (!mode) {
    return items;
  }

  return items.filter((item) => matchesMode(item, mode));
}

function matchesMode(item: Item, mode: ItemMode) {
  const groupCode = item.groupCode?.trim();
  const groupName = item.groupName?.trim().toLowerCase() ?? "";

  if (mode === "pekara") {
    return groupCode === "260" || groupName.includes("пек");
  }

  if (mode === "pecenjara") {
    return groupCode === "251" || groupName.includes("печ");
  }

  return groupCode === "220" || groupCode === "221" || groupName.includes("пиј");
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const originalDataUrl = String(reader.result);
      const image = new Image();

      image.onload = () => {
        const maxDimension = 1280;
        const quality = 0.8;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          resolve(originalDataUrl);
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed || originalDataUrl);
      };

      image.onerror = () => resolve(originalDataUrl);
      image.src = originalDataUrl;
    };
    reader.onerror = () => reject(new Error("Сликата не може да се вчита."));
    reader.readAsDataURL(file);
  });
}

function formatAdminTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return `${String(parsed.getDate()).padStart(2, "0")}.${String(parsed.getMonth() + 1).padStart(2, "0")}.${parsed.getFullYear()} ${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
}

function formatLocationLabel(code: string | undefined, name: string) {
  const normalizedName = isGenericLocationName(name) ? "" : name;
  if (code && normalizedName) {
    return `${code} · ${normalizedName}`;
  }

  return code || normalizedName || name;
}

function isGenericLocationName(name: string) {
  return /^локација\s+\d+$/i.test(name.trim());
}
