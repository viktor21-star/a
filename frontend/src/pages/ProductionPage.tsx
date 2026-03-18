import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useBatches, useItems, useUserLocations, useWasteEntries } from "../lib/queries";

type EntryMode = "pekara" | "pecenjara";

type OperatorEntry = {
  id: string;
  mode: EntryMode;
  itemName: string;
  quantity: number;
  note: string;
  photoDataUrl: string;
  photoName: string;
  createdAt: string;
};

const STORAGE_KEY = "pecenje-operator-entries";

function createEntryId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ProductionPage() {
  const { user } = useAuth();
  const batchesQuery = useBatches();
  const wasteQuery = useWasteEntries();
  const itemsQuery = useItems();
  const permissionsQuery = useUserLocations(user?.id ?? null);
  const [selectedMode, setSelectedMode] = useState<EntryMode | null>(null);
  const [entries, setEntries] = useState<OperatorEntry[]>([]);
  const [draft, setDraft] = useState({ itemName: "", quantity: 10, note: "", photoDataUrl: "", photoName: "" });
  const [saveConfirmation, setSaveConfirmation] = useState<string | null>(null);
  const photoReady = Boolean(draft.photoDataUrl);
  const itemReady = Boolean(draft.itemName);
  const quantityReady = draft.quantity > 0;

  const modeAccess = useMemo(() => {
    const permissions = permissionsQuery.data?.data ?? [];

    return {
      pekara: permissions.some((entry) => entry.canBake && entry.canUsePekara),
      pecenjara: permissions.some((entry) => entry.canBake && entry.canUsePecenjara)
    };
  }, [permissionsQuery.data]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      setEntries(JSON.parse(raw) as OperatorEntry[]);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("mode");
    if (requestedMode === "pekara" || requestedMode === "pecenjara") {
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

    setSelectedMode(null);
  }, [modeAccess, selectedMode]);

  useEffect(() => {
    const firstItem = itemsQuery.data?.data[0]?.nameMk;
    if (firstItem && !draft.itemName) {
      setDraft((current) => ({ ...current, itemName: firstItem }));
    }
  }, [draft.itemName, itemsQuery.data]);

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

  if (permissionsQuery.isLoading || itemsQuery.isLoading) {
    return <PageState message="Се вчитуваат оперативните податоци..." />;
  }

  if (permissionsQuery.isError || itemsQuery.isError) {
    return <PageState message="Не може да се вчита оперативниот модул." />;
  }

  if (!modeAccess.pekara && !modeAccess.pecenjara) {
    return <PageState message="Корисникот нема дозвола за внес во Пекара или Печењара." />;
  }

  if (!isAdministrator(user)) {
    return (
      <section className="page-grid operator-fullscreen-page">
        <header className="page-header">
          <div>
            <p className="topbar-eyebrow">Оператор</p>
            <h3>{selectedMode === "pekara" ? "Пекара" : selectedMode === "pecenjara" ? "Печењара" : "Избери тип на внес"}</h3>
            <p className="meta">
              {selectedMode
                ? "Овој модул е на цел екран. Со Назад се враќаш на двете големи кочки."
                : "Операторот гледа само Пекара и Печењара. После изборот внесува количина и артикал."}
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
          </section>
        )}

        {selectedMode && (
          <section className="panel operator-entry-panel">
            <div className="panel-header">
              <h3>Внес за {selectedMode === "pekara" ? "Пекара" : "Печењара"}</h3>
            </div>

            {saveConfirmation && (
              <div className="operator-success-banner">
                <strong>Успешно снимено</strong>
                <span>{saveConfirmation}</span>
              </div>
            )}

            <div className="operator-step-grid">
              <article className={`operator-step-card${photoReady ? " operator-step-card--done" : ""}`}>
                <div className="operator-step-card__header">
                  <span className="pill">Чекор 1</span>
                  <strong>Сликај печење</strong>
                </div>
                <label className="operator-photo-field">
                  <span>Задолжителна слика од печењето</span>
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
                    <strong>Избери артикал</strong>
                  </div>
                  <select
                    value={draft.itemName}
                    onChange={(event) => setDraft((current) => ({ ...current, itemName: event.target.value }))}
                  >
                    {itemsQuery.data?.data.map((item) => (
                      <option key={item.itemId} value={item.nameMk}>
                        {item.nameMk}
                      </option>
                    ))}
                  </select>
                </article>
              )}

              {photoReady && itemReady && (
                <article className={`operator-step-card${quantityReady ? " operator-step-card--done" : ""}`}>
                  <div className="operator-step-card__header">
                    <span className="pill">Чекор 3</span>
                    <strong>Внеси количина</strong>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={draft.quantity}
                    onChange={(event) => setDraft((current) => ({ ...current, quantity: Number(event.target.value) }))}
                    placeholder="Количина"
                  />
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
                      if (!draft.itemName || draft.quantity <= 0 || !draft.photoDataUrl) {
                        return;
                      }

                      const nextEntry: OperatorEntry = {
                        id: createEntryId(),
                        mode: selectedMode,
                        itemName: draft.itemName,
                        quantity: draft.quantity,
                        note: draft.note,
                        photoDataUrl: draft.photoDataUrl,
                        photoName: draft.photoName,
                        createdAt: new Date().toLocaleString("mk-MK")
                      };
                      const next = [nextEntry, ...entries];
                      setEntries(next);
                      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                      setDraft((current) => ({
                        ...current,
                        quantity: 10,
                        note: "",
                        photoDataUrl: "",
                        photoName: ""
                      }));
                      triggerSuccessFeedback();
                      setSaveConfirmation(
                        `${selectedMode === "pekara" ? "Пекара" : "Печењара"} · ${nextEntry.itemName} · ${nextEntry.quantity}`
                      );
                    }}
                  >
                    Сними внес
                  </button>
                </article>
              )}
            </div>
          </section>
        )}

        {selectedMode && (
          <section className="panel">
            <div className="panel-header">
              <h3>Последни внесови</h3>
            </div>

            <div className="card-list">
              {entries
                .filter((entry) => !selectedMode || entry.mode === selectedMode)
                .map((entry) => (
                  <article className="workflow-card" key={entry.id}>
                    <div className="workflow-card__top">
                      <span className="pill">{entry.mode === "pekara" ? "Пекара" : "Печењара"}</span>
                      <span className="meta">{entry.createdAt}</span>
                    </div>
                    <h4>{entry.itemName}</h4>
                    <p>Количина: {entry.quantity}</p>
                    <p>Забелешка: {entry.note || "Нема"}</p>
                    <p>Слика: {entry.photoName || "Прикачена"}</p>
                    <div className="operator-photo-preview operator-photo-preview--small">
                      <img src={entry.photoDataUrl} alt={`Слика за ${entry.itemName}`} />
                    </div>
                  </article>
                ))}
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

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Сликата не може да се вчита."));
    reader.readAsDataURL(file);
  });
}

function triggerSuccessFeedback() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.([120, 40, 120]);
  }

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
