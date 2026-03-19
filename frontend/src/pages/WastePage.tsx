import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useWasteEntries } from "../lib/queries";

export function WastePage() {
  const { user } = useAuth();
  const wasteQuery = useWasteEntries();

  if (!isAdministrator(user)) {
    return <PageState message="Отпадот е достапен само за администратор." />;
  }

  if (wasteQuery.isLoading) {
    return <PageState message="Се вчитува отпад..." />;
  }

  if (wasteQuery.isError || !wasteQuery.data) {
    return <PageState message="Не може да се вчита отпадот." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Администрација</p>
          <h3>Отпад</h3>
          <p className="meta">Преглед на пријавен отпад по локација, артикал, количина и причина.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Листа на отпад</h3>
          <span>{wasteQuery.data.data.length} записи</span>
        </div>

        {wasteQuery.data.data.length === 0 ? (
          <div className="list-card">Нема записи за отпад.</div>
        ) : (
          <div className="report-table">
            {wasteQuery.data.data.map((entry) => (
              <div className="report-row" key={entry.wasteEntryId}>
                <strong>{entry.locationName}</strong>
                <span>
                  {entry.sourceMode === "pekara"
                    ? "Од Пекара"
                    : entry.sourceMode === "pecenjara"
                      ? "Од Печењара"
                      : "Од Пијара"}
                </span>
                <span>{entry.itemName}</span>
                <span>Количина {entry.quantity}</span>
                <span>Причина {entry.reason}</span>
                <span>Оператор {entry.operatorName}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
