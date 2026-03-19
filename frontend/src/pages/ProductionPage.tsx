import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useBatches, useCreateOperatorEntry, useItems, usePlans, useUserLocations, useWasteEntries } from "../lib/queries";
import { createLocalId, queuePendingOperatorEntry, shouldQueueOffline } from "../lib/operatorEntryQueue";
import type { CreateOperatorEntryRequest, Item, OperatorEntryLine } from "../lib/types";

type EntryMode = "pekara" | "pecenjara" | "pijara";

export function ProductionPage() {
  const { user } = useAuth();
  const batchesQuery = useBatches();
  const wasteQuery = useWasteEntries();
  const itemsQuery = useItems();
  const plansQuery = usePlans();
  const createEntryMutation = useCreateOperatorEntry();
  const permissionsQuery = useUserLocations(user?.id ?? null);
  const [selectedMode, setSelectedMode] = useState<EntryMode | null>(null);
  const [draft, setDraft] = useState({ note: "", photoDataUrl: "", photoName: "" });
  const [draftItems, setDraftItems] = useState<OperatorEntryLine[]>([
    { itemName: "", quantity: 10, classB: true, classBQuantity: 10 }
  ]);
  const [itemSearch, setItemSearch] = useState<string[]>([""]);
  const [saveConfirmation, setSaveConfirmation] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const photoReady = Boolean(draft.photoDataUrl);
  const itemReady = draftItems.some((entry) => Boolean(entry.itemName));
  const quantityReady = draftItems.every(
    (entry) =>
      !entry.itemName ||
      (entry.quantity > 0 && (selectedMode !== "pijara" || !entry.classB || entry.classBQuantity > 0))
  );
  const readyItems = draftItems.filter(
    (entry) => entry.itemName && entry.quantity > 0 && (selectedMode !== "pijara" || !entry.classB || entry.classBQuantity > 0)
  );
  const availableItems = useMemo(() => filterItemsForMode(itemsQuery.data?.data ?? [], selectedMode), [itemsQuery.data, selectedMode]);
  const assignedBakeLocations = useMemo(
    () => (permissionsQuery.data?.data ?? []).filter((entry) => entry.canBake),
    [permissionsQuery.data]
  );
  const activeLocation = useMemo(() => {
    if (!assignedBakeLocations.length) {
      return null;
    }

    return assignedBakeLocations.find((entry) => entry.locationId === user?.defaultLocationId) ?? assignedBakeLocations[0];
  }, [assignedBakeLocations, user?.defaultLocationId]);

  const modeAccess = useMemo(() => {
    const permission = activeLocation
      ? (permissionsQuery.data?.data ?? []).find((entry) => entry.locationId === activeLocation.locationId) ?? null
      : null;

    return {
      pekara: Boolean(permission?.canBake && permission.canUsePekara),
      pecenjara: Boolean(permission?.canBake && permission.canUsePecenjara),
      pijara: Boolean(permission?.canBake && permission.canUsePijara)
    };
  }, [activeLocation, permissionsQuery.data]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("mode");
    if (
      (requestedMode === "pekara" || requestedMode === "pecenjara" || requestedMode === "pijara") &&
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

    setSelectedMode(null);
  }, [modeAccess, selectedMode]);

  useEffect(() => {
    const firstItem = availableItems[0]?.nameMk;
    if (firstItem && !draftItems[0]?.itemName) {
      setDraftItems((current) =>
        current.map((entry, index) => (index === 0 ? { ...entry, itemName: firstItem } : entry))
      );
    }
  }, [availableItems, draftItems]);

  useEffect(() => {
    setItemSearch((current) =>
      draftItems.map((entry, index) => current[index] ?? entry.itemName ?? "")
    );
  }, [draftItems]);

  useEffect(() => {
    if (!availableItems.length) {
      return;
    }

    setDraftItems((current) =>
      current.map((entry, index) => {
        if (entry.itemName && availableItems.some((item) => item.nameMk === entry.itemName)) {
          return entry;
        }

        return index === 0
          ? { ...entry, itemName: availableItems[0]?.nameMk ?? "" }
          : { ...entry, itemName: availableItems[0]?.nameMk ?? "" };
      })
    );
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

  if (permissionsQuery.isLoading || itemsQuery.isLoading || plansQuery.isLoading) {
    return <PageState message="Се вчитуваат оперативните податоци..." />;
  }

  if (permissionsQuery.isError || itemsQuery.isError || plansQuery.isError) {
    return <PageState message="Не може да се вчита оперативниот модул." />;
  }

  if (selectedMode && !availableItems.length) {
    return <PageState message="Нема активни артикли за избраниот модул." />;
  }

  if (!modeAccess.pekara && !modeAccess.pecenjara && !modeAccess.pijara) {
    return <PageState message="Корисникот нема дозвола за внес во Пекара, Печењара или Пијара." />;
  }

  if (!isAdministrator(user) && !activeLocation) {
    return <PageState message="Операторот нема доделена работна локација за печење." />;
  }

  const activePlan = !isAdministrator(user) && selectedMode && selectedMode !== "pijara"
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
                    : "Избери тип на внес"}
            </h3>
            <p className="meta">
              {selectedMode
                ? "Овој модул е на цел екран. Со Назад се враќаш на двете големи кочки."
                : "Операторот гледа Пекара, Печењара и Пијара. После изборот внесува артикли, количини и задолжителна слика."}
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
          </section>
        )}

        {selectedMode && (
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
                    <strong>{selectedMode === "pijara" ? "Додади артикли за пријава" : "Додади артикли за печење"}</strong>
                  </div>
                  <div className="operator-lines-grid">
                    {draftItems.map((entry, index) => (
                      <div className="operator-line-row" key={`${entry.itemName}-${index}`}>
                        <input
                          className="search-input"
                          value={itemSearch[index] ?? ""}
                          placeholder="Пребарај по име или шифра"
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setItemSearch((current) =>
                              current.map((value, valueIndex) => (valueIndex === index ? nextValue : value))
                            );
                          }}
                        />
                        <select
                          value={entry.itemName}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setDraftItems((current) =>
                              current.map((line, lineIndex) =>
                                lineIndex === index ? { ...line, itemName: nextValue } : line
                              )
                            );
                            const selected = availableItems.find((item) => item.nameMk === nextValue);
                            setItemSearch((current) =>
                              current.map((value, valueIndex) =>
                                valueIndex === index ? `${selected?.code ?? ""} ${nextValue}`.trim() : value
                              )
                            );
                          }}
                        >
                          {availableItems
                            .filter((item) => {
                              const query = (itemSearch[index] ?? "").trim().toLowerCase();
                              if (!query) {
                                return true;
                              }

                              return [item.nameMk, item.code].some((value) => value.toLowerCase().includes(query));
                            })
                            .map((item) => (
                              <option key={item.itemId} value={item.nameMk}>
                                {item.code} · {item.nameMk}
                              </option>
                            ))}
                        </select>
                        <span className="meta">
                          Артикал шифра: {availableItems.find((item) => item.nameMk === entry.itemName)?.code ?? "-"}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={entry.quantity}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            setDraftItems((current) =>
                              current.map((line, lineIndex) =>
                                lineIndex === index ? { ...line, quantity: nextValue } : line
                              )
                            );
                          }}
                          placeholder={selectedMode === "pijara" ? "Вкупна количина" : "Количина"}
                        />
                        {selectedMode === "pijara" && (
                          <>
                            <label className="operator-classb-toggle">
                              <input
                                type="checkbox"
                                checked={entry.classB}
                                onChange={(event) => {
                                  const checked = event.target.checked;
                                  setDraftItems((current) =>
                                    current.map((line, lineIndex) =>
                                      lineIndex === index
                                        ? { ...line, classB: checked, classBQuantity: checked ? Math.max(line.classBQuantity, 1) : 0 }
                                        : line
                                    )
                                  );
                                }}
                              />
                              <span>Класа Б пријава</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={entry.classB ? entry.classBQuantity : 0}
                              onChange={(event) => {
                                const nextValue = Number(event.target.value);
                                setDraftItems((current) =>
                                  current.map((line, lineIndex) =>
                                    lineIndex === index
                                      ? { ...line, classB: nextValue > 0 || line.classB, classBQuantity: nextValue }
                                      : line
                                  )
                                );
                              }}
                              placeholder="Количина за Класа Б"
                              disabled={!entry.classB}
                            />
                          </>
                        )}
                        {draftItems.length > 1 && (
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={() => {
                              setDraftItems((current) => current.filter((_, lineIndex) => lineIndex !== index));
                              setItemSearch((current) => current.filter((_, lineIndex) => lineIndex !== index));
                            }}
                          >
                            Тргни
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      const fallbackItem = availableItems[0]?.nameMk ?? "";
                      setDraftItems((current) => [
                        ...current,
                        {
                          itemName: fallbackItem,
                          quantity: 10,
                          classB: selectedMode === "pijara",
                          classBQuantity: selectedMode === "pijara" ? 10 : 0
                        }
                      ]);
                      setItemSearch((current) => [...current, fallbackItem]);
                    }}
                  >
                    Додади уште артикал
                  </button>
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
                          setDraftItems([
                            {
                              itemName: availableItems[0]?.nameMk ?? "",
                              quantity: 10,
                              classB: selectedMode === "pijara",
                              classBQuantity: selectedMode === "pijara" ? 10 : 0
                            }
                          ]);
                          setItemSearch([availableItems[0]?.nameMk ?? ""]);
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
                            setDraftItems([
                              {
                                itemName: availableItems[0]?.nameMk ?? "",
                                quantity: 10,
                                classB: selectedMode === "pijara",
                                classBQuantity: selectedMode === "pijara" ? 10 : 0
                              }
                            ]);
                            setItemSearch([availableItems[0]?.nameMk ?? ""]);
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

function filterItemsForMode(items: Item[], mode: EntryMode | null) {
  if (!mode) {
    return items;
  }

  return items.filter((item) => matchesMode(item, mode));
}

function matchesMode(item: Item, mode: EntryMode) {
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
