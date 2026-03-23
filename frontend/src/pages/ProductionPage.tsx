import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useBatches, useCreateOperatorEntry, useCreateWasteEntry, useItems, usePlans, useReasons, useUserLocations, useWasteEntries } from "../lib/queries";
import { createLocalId, queuePendingOperatorEntry, queuePendingWasteEntry, shouldQueueOffline } from "../lib/operatorEntryQueue";
import type { CreateOperatorEntryRequest, CreateWasteEntryRequest, Item, OperatorEntryLine } from "../lib/types";

type ItemMode = "pekara" | "pecenjara" | "pijara";
type EntryMode = ItemMode | "waste";

export function ProductionPage() {
  const { user } = useAuth();
  const batchesQuery = useBatches();
  const wasteQuery = useWasteEntries();
  const itemsQuery = useItems();
  const plansQuery = usePlans();
  const reasonsQuery = useReasons();
  const createEntryMutation = useCreateOperatorEntry();
  const createWasteMutation = useCreateWasteEntry();
  const permissionsQuery = useUserLocations(user?.id ?? null);
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
  const photoReady = Boolean(draft.photoDataUrl);
  const itemReady = draftItems.length > 0;
  const quantityReady = draftItems.every(
    (entry) =>
      !entry.itemName ||
      (entry.quantity > 0 && (selectedMode !== "pijara" || !entry.classB || entry.classBQuantity > 0))
  );
  const readyItems = draftItems.filter(
    (entry) => entry.itemName && entry.quantity > 0 && (selectedMode !== "pijara" || !entry.classB || entry.classBQuantity > 0)
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
    if (selectedMode === "waste") {
      return;
    }
  }, [availableItems, selectedMode]);

  useEffect(() => {
    if (selectedMode === "waste") {
      const firstItem = availableItems[0]?.nameMk ?? "";
      if (!wasteItemName || !availableItems.some((item) => item.nameMk === wasteItemName)) {
        setWasteItemName(firstItem);
        setWasteItemSearch(firstItem);
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

  if (permissionsQuery.isLoading || itemsQuery.isLoading || plansQuery.isLoading || reasonsQuery.isLoading) {
    return <PageState message="Се вчитуваат оперативните податоци..." />;
  }

  if (permissionsQuery.isError || itemsQuery.isError || plansQuery.isError || reasonsQuery.isError) {
    return <PageState message="Не може да се вчита оперативниот модул." />;
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
            <p className="meta">
              {selectedMode
                ? "Овој модул е на цел екран. Со Назад се враќаш на двете големи кочки."
                : "Операторот гледа Пекара, Печењара, Пијара и Отпад. После изборот внесува артикли, количини и задолжителна слика."}
            </p>
          </div>
          {selectedMode && (
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Назад
            </button>
          )}
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
                    : "Пијара"}
              </h3>
            </div>

            <div className="operator-explainer">
              <strong>Како се внесува:</strong>
              <span>Работна локација: {activeLocation?.locationName}</span>
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
                      <strong>Избрани артикли</strong>
                      <div className="operator-lines-grid">
                        {draftItems.map((entry) => (
                          <div className="operator-line-row operator-line-row--checkbox" key={`selected-${entry.itemName}`}>
                            <div className="operator-item-toggle">
                              <span>
                                <strong>{entry.itemName}</strong>
                                <small>
                                  Шифра: {availableItems.find((item) => item.nameMk === entry.itemName)?.code ?? "-"}
                                </small>
                              </span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={entry.quantity}
                              onChange={(event) => {
                                const nextValue = Number(event.target.value);
                                setDraftItems((current) =>
                                  current.map((line) =>
                                    line.itemName === entry.itemName ? { ...line, quantity: nextValue } : line
                                  )
                                );
                              }}
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
                                            ? { ...line, classB: checked, classBQuantity: checked ? Math.max(line.classBQuantity, 1) : 0 }
                                            : line
                                        )
                                      );
                                    }}
                                  />
                                  <span>Класа Б</span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={entry.classB ? entry.classBQuantity : 0}
                                  onChange={(event) => {
                                    const nextValue = Number(event.target.value);
                                    setDraftItems((current) =>
                                      current.map((line) =>
                                        line.itemName === entry.itemName
                                          ? { ...line, classB: nextValue > 0 || line.classB, classBQuantity: nextValue }
                                          : line
                                      )
                                    );
                                  }}
                                  placeholder="Количина за Класа Б"
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
                    <strong>Сними внес</strong>
                  </div>
                  <button
                    className="action-button"
                    type="button"
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
                          setDraft({ note: "", photoDataUrl: "", photoName: "" });
                          setDraftItems([]);
                          setItemSearch("");
                          triggerSuccessFeedback("Успешен внес");
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
                            setDraft({ note: "", photoDataUrl: "", photoName: "" });
                            setDraftItems([]);
                            setItemSearch("");
                            triggerSuccessFeedback("Снимено локално");
                            setSaveConfirmation("Нема интернет. Внесот е снимен локално и ќе се испрати автоматски.");
                            return;
                          }

                          setSaveError("Неуспешен внес. Провери дали интернетот и серверот работат, па пробај повторно. Ако проблемот остане, контактирај администратор.");
                          triggerErrorFeedback("Неуспешен внес");
                        }
                      });
                    }}
                  >
                    {createEntryMutation.isPending ? "Се снима..." : "Сними внес"}
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
            </div>

            <div className="operator-explainer">
              <strong>Како се пријавува отпад:</strong>
              <span>Работна локација: {activeLocation?.locationName}</span>
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
                          setDraft({ note: "", photoDataUrl: "", photoName: "" });
                          setWasteSource(null);
                          setWasteItemSearch("");
                          setWasteItemName("");
                          setWasteQuantity(1);
                          setWasteReason("");
                          triggerSuccessFeedback("Успешна пријава на отпад");
                          setSaveConfirmation(`Отпад · ${request.locationName} · ${request.itemName}`);
                        },
                        onError: (error) => {
                          if (shouldQueueOffline(error)) {
                            queuePendingWasteEntry({
                              ...request,
                              localId: createLocalId()
                            });
                            setDraft({ note: "", photoDataUrl: "", photoName: "" });
                            setWasteSource(null);
                            setWasteItemSearch("");
                            setWasteItemName("");
                            setWasteQuantity(1);
                            setWasteReason("");
                            triggerSuccessFeedback("Отпад снимен локално");
                            setSaveConfirmation("Нема интернет. Отпадот е снимен локално и ќе се испрати автоматски.");
                            return;
                          }

                          setSaveError("Неуспешна пријава на отпад. Провери дали интернетот и серверот работат, па пробај повторно. Ако проблемот остане, контактирај администратор.");
                          triggerErrorFeedback("Неуспешна пријава на отпад");
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

  if (batchesQuery.isLoading) {
    return <PageState message="Се вчитуваат турите..." />;
  }

  if (batchesQuery.isError || !batchesQuery.data) {
    return <PageState message="Не може да се вчитаат турите." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Администратор</p>
          <h3>Преглед на реално печење</h3>
          <p className="meta">Администраторот ги гледа турите, отпадот и дисциплината по локации.</p>
        </div>
      </header>

      <div className="panel-grid panel-grid--production">
        <div className="card-list">
          {batchesQuery.data.data.map((batch) => (
            <article className="workflow-card" key={`${batch.itemName}-${batch.operatorName}-${batch.startTime}`}>
              <div className="workflow-card__top">
                <span className="pill">{batch.status}</span>
                <span className="meta">{batch.operatorName}</span>
              </div>
              <h4>{batch.itemName}</h4>
              <p>Локација: {batch.locationName}</p>
              <p>Термин: {batch.termLabel}</p>
              <p>Испечено: {batch.actualQty}</p>
              <p>Почеток: {batch.startTime}</p>
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

  if (mode === "pekara") {
    return groupCode === "260";
  }

  if (mode === "pecenjara") {
    return groupCode === "251";
  }

  return groupCode === "220" || groupCode === "221";
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Сликата не може да се вчита."));
    reader.readAsDataURL(file);
  });
}

function triggerSuccessFeedback(message = "Успешен внес") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.([120, 40, 120]);
  }

  speakFeedback(message);

  if (typeof window === "undefined") {
    return;
  }

  const AudioContextConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) {
    return;
  }

  try {
    const audioContext = new AudioContextConstructor();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.22);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.24);
    oscillator.onended = () => {
      void audioContext.close();
    };
  } catch {
    // Ignore audio feedback failures and keep save flow successful.
  }
}

function triggerErrorFeedback(message = "Неуспешен внес") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.([220, 80, 220, 80, 220]);
  }

  speakFeedback(message);

  if (typeof window === "undefined") {
    return;
  }

  const AudioContextConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) {
    return;
  }

  try {
    const audioContext = new AudioContextConstructor();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.36);
    oscillator.onended = () => {
      void audioContext.close();
    };
  } catch {
    // Ignore audio feedback failures.
  }
}

function speakFeedback(message: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "mk-MK";
    utterance.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis failures.
  }
}
