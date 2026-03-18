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
  const [draft, setDraft] = useState({ itemName: "", quantity: 10, note: "" });

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
      <section className="page-grid">
        <header className="page-header">
          <div>
            <p className="topbar-eyebrow">Оператор</p>
            <h3>Избери тип на внес</h3>
            <p className="meta">Операторот гледа само Пекара и Печењара. После изборот внесува количина и артикал.</p>
          </div>
        </header>

        <section className="operator-mode-grid">
          {modeAccess.pekara && (
            <button
              type="button"
              className={`operator-mode-card${selectedMode === "pekara" ? " operator-mode-card--active" : ""}`}
              onClick={() => setSelectedMode("pekara")}
            >
              <strong>Пекара</strong>
              <span>Леб, бурек, кифли, печива</span>
            </button>
          )}

          {modeAccess.pecenjara && (
            <button
              type="button"
              className={`operator-mode-card${selectedMode === "pecenjara" ? " operator-mode-card--active" : ""}`}
              onClick={() => setSelectedMode("pecenjara")}
            >
              <strong>Печењара</strong>
              <span>Пилешко, месо и rotisserie</span>
            </button>
          )}
        </section>

        {selectedMode && (
          <section className="panel">
            <div className="panel-header">
              <h3>Внес за {selectedMode === "pekara" ? "Пекара" : "Печењара"}</h3>
            </div>

            <div className="master-form master-form--operator">
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

              <button
                className="action-button"
                type="button"
                onClick={() => {
                  if (!draft.itemName || draft.quantity <= 0) {
                    return;
                  }

                  const nextEntry: OperatorEntry = {
                    id: createEntryId(),
                    mode: selectedMode,
                    itemName: draft.itemName,
                    quantity: draft.quantity,
                    note: draft.note,
                    createdAt: new Date().toLocaleString("mk-MK")
                  };
                  const next = [nextEntry, ...entries];
                  setEntries(next);
                  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                  setDraft((current) => ({ ...current, quantity: 10, note: "" }));
                }}
              >
                Сними внес
              </button>
            </div>
          </section>
        )}

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
                </article>
              ))}
          </div>
        </section>
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
