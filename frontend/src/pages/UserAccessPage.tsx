import { useEffect, useState } from "react";
import { PageState } from "../components/PageState";
import { useUpdateUserLocations, useUserLocations, useUsers } from "../lib/queries";
import type { UserLocationPermission } from "../lib/types";

type PermissionField =
  | "canPlan"
  | "canBake"
  | "canRecordWaste"
  | "canViewReports"
  | "canApprovePlan"
  | "canUsePekara"
  | "canUsePecenjara";

export function UserAccessPage() {
  const usersQuery = useUsers();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const locationsQuery = useUserLocations(selectedUserId);
  const updateMutation = useUpdateUserLocations();
  const [draft, setDraft] = useState<UserLocationPermission[]>([]);

  useEffect(() => {
    if (!selectedUserId && usersQuery.data?.data.length) {
      setSelectedUserId(usersQuery.data.data[0].userId);
    }
  }, [selectedUserId, usersQuery.data]);

  useEffect(() => {
    if (locationsQuery.data?.data) {
      setDraft(locationsQuery.data.data);
    }
  }, [locationsQuery.data]);

  if (usersQuery.isLoading) {
    return <PageState message="Се вчитуваат корисници..." />;
  }

  if (usersQuery.isError || !usersQuery.data) {
    return <PageState message="Не може да се вчитаат корисниците." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Администрација</p>
          <h3>Корисници и привилегии по локација</h3>
        </div>
      </header>

      <div className="panel-grid panel-grid--production">
        <aside className="panel">
          <div className="panel-header">
            <h3>Корисници</h3>
          </div>
          <div className="card-list">
            {usersQuery.data.data.map((user) => (
              <button
                key={user.userId}
                className={`ghost-button user-list-button${selectedUserId === user.userId ? " user-list-button--active" : ""}`}
                type="button"
                onClick={() => setSelectedUserId(user.userId)}
              >
                {user.fullName} · {user.roleCode}
              </button>
            ))}
          </div>
        </aside>

        <section className="panel">
          <div className="panel-header">
            <h3>Дозволени локации</h3>
            <button
              className="action-button"
              type="button"
              disabled={!selectedUserId}
              onClick={() => {
                if (!selectedUserId) {
                  return;
                }

                updateMutation.mutate({
                  userId: selectedUserId,
                  payload: { locations: draft }
                });
              }}
            >
              Сними привилегии
            </button>
          </div>

          {locationsQuery.isLoading && <div className="list-card">Се вчитуваат привилегии...</div>}

          {draft.map((entry, index) => (
            <div className="permission-card" key={`${entry.locationId}-${entry.locationName}`}>
              <strong>{entry.locationName}</strong>
              <label><input type="checkbox" checked={entry.canPlan} onChange={() => toggle(index, "canPlan")} /> Планирање</label>
              <label><input type="checkbox" checked={entry.canBake} onChange={() => toggle(index, "canBake")} /> Печење</label>
              <label><input type="checkbox" checked={entry.canRecordWaste} onChange={() => toggle(index, "canRecordWaste")} /> Отпад</label>
              <label><input type="checkbox" checked={entry.canViewReports} onChange={() => toggle(index, "canViewReports")} /> Извештаи</label>
              <label><input type="checkbox" checked={entry.canApprovePlan} onChange={() => toggle(index, "canApprovePlan")} /> Одобрување</label>
              <div className="mode-grid">
                <button
                  className={`mode-tile${entry.canUsePekara ? " mode-tile--active" : ""}`}
                  type="button"
                  onClick={() => toggle(index, "canUsePekara")}
                >
                  Пекара
                </button>
                <button
                  className={`mode-tile${entry.canUsePecenjara ? " mode-tile--active" : ""}`}
                  type="button"
                  onClick={() => toggle(index, "canUsePecenjara")}
                >
                  Печењара
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </section>
  );

  function toggle(index: number, field: PermissionField) {
    setDraft((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, [field]: !entry[field] } : entry
      )
    );
  }
}
