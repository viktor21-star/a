import { useMemo, useState } from "react";
import { isAdministrator, useAuth } from "../lib/auth";
import { useItems } from "../lib/queries";
import { PageState } from "../components/PageState";
import type { Item } from "../lib/types";

export function ItemsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useItems();
  const [nameSearch, setNameSearch] = useState("");
  const [codeSearch, setCodeSearch] = useState("");

  const filteredItems = useMemo(() => {
    const rows = data?.data ?? [];
    const nameQuery = nameSearch.trim().toLowerCase();
    const codeQuery = codeSearch.trim().toLowerCase();

    return rows.filter((item) => {
      const matchesName = !nameQuery || [item.nameMk, item.groupName].some((value) => value.toLowerCase().includes(nameQuery));
      const matchesCode = !codeQuery || item.code.toLowerCase().includes(codeQuery);
      return matchesName && matchesCode;
    });
  }, [codeSearch, data, nameSearch]);

  if (!isAdministrator(user)) {
    return <PageState message="Артиклите ги одржува администратор." />;
  }

  if (isLoading) {
    return <PageState message="Се вчитуваат артикли..." />;
  }

  if (isError || !data) {
    return <PageState message="Не може да се вчитаат артиклите." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Шифарници</p>
          <h3>Артикли</h3>
          <p className="meta">Артиклите доаѓаат директно од API. Овде нема рачен внес, туку само преглед и пребарување.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Пребарување низ артикли</h3>
        </div>
        <div className="master-form master-form--inline">
          <input
            className="search-input"
            value={nameSearch}
            placeholder="Пребарај по име или група"
            onChange={(event) => setNameSearch(event.target.value)}
          />
          <input
            className="search-input"
            value={codeSearch}
            placeholder="Пребарај по шифра"
            onChange={(event) => setCodeSearch(event.target.value)}
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Листа на артикли</h3>
          <span>{filteredItems.length} артикли</span>
        </div>
        <div className="card-list admin-summary-grid">
          {filteredItems.map((item) => (
            <article className="workflow-card admin-tile-card" key={item.itemId}>
              <div className="workflow-card__top">
                <span className="pill">{item.code}</span>
                <span className="status-chip">{item.isActive ? "Активен" : "Неактивен"}</span>
              </div>
              <h4>{item.nameMk}</h4>
              <p>Шифра: {item.code}</p>
              <p>Група код: {item.groupCode || "-"}</p>
              <p>Група: {item.groupName}</p>
              <p>Се користи во: {describeItemModes(item)}</p>
              <p>Цена: {item.salesPrice}</p>
              <p>Лимит отпад: {item.wasteLimitPct}%</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function describeItemModes(item: Item) {
  const modes = [
    itemMatchesMode(item, "pekara") ? "Пекара" : null,
    itemMatchesMode(item, "pecenjara") ? "Печењара" : null,
    item.groupCode?.trim() === "220" || item.groupCode?.trim() === "221" ? "Пијара" : null
  ].filter(Boolean);

  return modes.length > 0 ? modes.join(", ") : "Не се користи";
}

function itemMatchesMode(item: Item, mode: "pekara" | "pecenjara") {
  const groupCode = item.groupCode?.trim();

  if (mode === "pekara") {
    return groupCode === "260";
  }

  return groupCode === "251";
}
