import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useCreateUser, useLocations, useUpdateUserLocations, useUserLocations, useUsers } from "../lib/queries";
import type { CreateUserRequest, UserLocationPermission } from "../lib/types";

type PermissionField =
  | "canPlan"
  | "canBake"
  | "canRecordWaste"
  | "canViewReports"
  | "canApprovePlan"
  | "canUsePekara"
  | "canUsePecenjara"
  | "canUsePijara";

const ovenTypes = ["Нема", "Ротациона", "Камена", "Комбинирана", "Конвекциска"];

const emptyUser: CreateUserRequest = {
  defaultLocationId: 0,
  username: "",
  fullName: "",
  password: "",
  roleCode: "operator",
  isActive: true,
  canUsePekara: false,
  canUsePecenjara: false,
  canUsePijara: false,
  pekaraOvenType: "Нема",
  pecenjaraOvenType: "Нема"
};

export function UserAccessPage() {
  const { user } = useAuth();
  const usersQuery = useUsers();
  const locationsListQuery = useLocations();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const locationsQuery = useUserLocations(selectedUserId);
  const updateMutation = useUpdateUserLocations();
  const createUserMutation = useCreateUser();
  const [draft, setDraft] = useState<UserLocationPermission[]>([]);
  const [newUser, setNewUser] = useState<CreateUserRequest>(emptyUser);
  const selectedUser = usersQuery.data?.data.find((entry) => entry.userId === selectedUserId) ?? null;
  const operatorUserSelected = selectedUser?.roleCode === "operator";

  useEffect(() => {
    if (!selectedUserId && usersQuery.data?.data.length) {
      setSelectedUserId(usersQuery.data.data[0].userId);
    }
  }, [selectedUserId, usersQuery.data]);

  useEffect(() => {
    if (locationsListQuery.data?.data.length && !newUser.defaultLocationId) {
      setNewUser((current) => ({
        ...current,
        defaultLocationId: locationsListQuery.data?.data[0]?.locationId ?? 0
      }));
    }
  }, [locationsListQuery.data, newUser.defaultLocationId]);

  useEffect(() => {
    if (locationsQuery.data?.data) {
      setDraft(locationsQuery.data.data);
    }
  }, [locationsQuery.data]);

  const selectedLocationName = useMemo(
    () =>
      locationsListQuery.data?.data.find((entry) => entry.locationId === newUser.defaultLocationId)?.nameMk ??
      "Избери локација",
    [locationsListQuery.data, newUser.defaultLocationId]
  );

  if (!isAdministrator(user)) {
    return <PageState message="Само администратор може да креира корисници и да менува привилегии." />;
  }

  if (usersQuery.isLoading || locationsListQuery.isLoading) {
    return <PageState message="Се вчитуваат корисници и локации..." />;
  }

  if (usersQuery.isError || !usersQuery.data || locationsListQuery.isError || !locationsListQuery.data) {
    return <PageState message="Не може да се вчитаат корисниците или локациите." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Администрација</p>
          <h3>Креирање корисник и привилегии по локација</h3>
          <p className="meta">Прво се избира работна локација, потоа username, лозинка, улога, тип на печка и модулите што ќе ги гледа операторот.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Нов корисник</h3>
        </div>
        <div className="admin-form-grid">
          <article className="admin-input-tile">
            <span>1. Работна локација</span>
            <select
              value={newUser.defaultLocationId}
              onChange={(event) => setNewUser((current) => ({ ...current, defaultLocationId: Number(event.target.value) }))}
            >
              {locationsListQuery.data.data.map((location) => (
                <option key={location.locationId} value={location.locationId}>
                  {location.code} · {location.nameMk}
                </option>
              ))}
            </select>
            <small>{selectedLocationName}</small>
          </article>

          <article className="admin-input-tile">
            <span>2. Име и презиме</span>
            <input
              value={newUser.fullName}
              placeholder="Име и презиме"
              onChange={(event) => setNewUser((current) => ({ ...current, fullName: event.target.value }))}
            />
          </article>

          <article className="admin-input-tile">
            <span>3. Корисничко име</span>
            <input
              value={newUser.username}
              placeholder="Корисничко име"
              onChange={(event) => setNewUser((current) => ({ ...current, username: event.target.value }))}
            />
          </article>

          <article className="admin-input-tile">
            <span>4. Лозинка</span>
            <input
              type="password"
              value={newUser.password}
              placeholder="Лозинка"
              onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
            />
          </article>

          <article className="admin-input-tile">
            <span>5. Улога</span>
            <select
              value={newUser.roleCode}
              onChange={(event) => setNewUser((current) => ({ ...current, roleCode: event.target.value }))}
            >
              <option value="operator">Оператор</option>
              <option value="administrator">Администратор</option>
              <option value="market_manager">Менаџер</option>
            </select>
          </article>

          <article className="admin-input-tile">
            <span>6. Печка за Пекара</span>
            <select
              value={newUser.pekaraOvenType}
              onChange={(event) => setNewUser((current) => ({ ...current, pekaraOvenType: event.target.value }))}
            >
              {ovenTypes.map((ovenType) => (
                <option key={ovenType} value={ovenType}>
                  {ovenType}
                </option>
              ))}
            </select>
          </article>

          <article className="admin-input-tile">
            <span>7. Печка за Печењара</span>
            <select
              value={newUser.pecenjaraOvenType}
              onChange={(event) => setNewUser((current) => ({ ...current, pecenjaraOvenType: event.target.value }))}
            >
              {ovenTypes.map((ovenType) => (
                <option key={ovenType} value={ovenType}>
                  {ovenType}
                </option>
              ))}
            </select>
          </article>
        </div>

        <div className="operator-explainer">
          <strong>8. Модули за операторот на оваа локација</strong>
          <span>Ако не му дадеш модул, тој модул нема да го гледа на home екранот.</span>
        </div>

        <div className="mode-grid">
          <button
            className={`mode-tile${newUser.canUsePekara ? " mode-tile--active" : ""}`}
            type="button"
            onClick={() => setNewUser((current) => ({ ...current, canUsePekara: !current.canUsePekara }))}
          >
            Пекара
          </button>
          <button
            className={`mode-tile${newUser.canUsePecenjara ? " mode-tile--active" : ""}`}
            type="button"
            onClick={() => setNewUser((current) => ({ ...current, canUsePecenjara: !current.canUsePecenjara }))}
          >
            Печењара
          </button>
          <button
            className={`mode-tile${newUser.canUsePijara ? " mode-tile--active" : ""}`}
            type="button"
            onClick={() => setNewUser((current) => ({ ...current, canUsePijara: !current.canUsePijara }))}
          >
            Пијара
          </button>
        </div>

        <div className="login-actions">
          <button
            className="action-button"
            type="button"
            onClick={() => {
              if (
                !newUser.defaultLocationId ||
                !newUser.username ||
                !newUser.fullName ||
                !newUser.password ||
                (!newUser.canUsePekara && !newUser.canUsePecenjara && !newUser.canUsePijara)
              ) {
                return;
              }

              createUserMutation.mutate(newUser, {
                onSuccess: (response) => {
                  setSelectedUserId(response.data.userId);
                  setNewUser({
                    ...emptyUser,
                    defaultLocationId: locationsListQuery.data.data[0]?.locationId ?? 0
                  });
                }
              });
            }}
          >
            Креирај корисник
          </button>
        </div>
      </section>

      <div className="panel-grid panel-grid--production">
        <aside className="panel">
          <div className="panel-header">
            <h3>Избор на корисник</h3>
          </div>
          <div className="card-list admin-summary-grid">
            {usersQuery.data.data.map((entry) => (
              <button
                key={entry.userId}
                className={`user-summary-card${selectedUserId === entry.userId ? " user-summary-card--active" : ""}`}
                type="button"
                onClick={() => setSelectedUserId(entry.userId)}
              >
                <strong>{entry.fullName}</strong>
                <span>{entry.username}</span>
                <span>{entry.roleCode}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel">
          <div className="panel-header">
            <h3>Локација и привилегии за избраниот корисник</h3>
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

          {operatorUserSelected && (
            <div className="operator-explainer">
              <strong>Оператор</strong>
              <span>Операторот треба да работи на една локација и таму да ги има само дозволените модули.</span>
            </div>
          )}

          <div className="card-list admin-summary-grid">
            {draft.map((entry, index) => (
              <article className="permission-card permission-card--large" key={`${entry.locationId}-${entry.locationName}`}>
                <strong>{entry.locationName}</strong>

                <div className="admin-form-grid">
                  <article className="admin-input-tile">
                    <span>Печка за Пекара</span>
                    <select
                      value={entry.pekaraOvenType ?? "Нема"}
                      onChange={(event) => updateOvenType(index, "pekaraOvenType", event.target.value)}
                    >
                      {ovenTypes.map((ovenType) => (
                        <option key={ovenType} value={ovenType}>
                          {ovenType}
                        </option>
                      ))}
                    </select>
                  </article>

                  <article className="admin-input-tile">
                    <span>Печка за Печењара</span>
                    <select
                      value={entry.pecenjaraOvenType ?? "Нема"}
                      onChange={(event) => updateOvenType(index, "pecenjaraOvenType", event.target.value)}
                    >
                      {ovenTypes.map((ovenType) => (
                        <option key={ovenType} value={ovenType}>
                          {ovenType}
                        </option>
                      ))}
                    </select>
                  </article>
                </div>

                <div className="permission-check-grid">
                  <label><input type="checkbox" checked={entry.canPlan} onChange={() => toggle(index, "canPlan")} /> Планирање</label>
                  <label><input type="checkbox" checked={entry.canBake} onChange={() => toggle(index, "canBake")} /> Печење</label>
                  <label><input type="checkbox" checked={entry.canRecordWaste} onChange={() => toggle(index, "canRecordWaste")} /> Отпад</label>
                  <label><input type="checkbox" checked={entry.canViewReports} onChange={() => toggle(index, "canViewReports")} /> Извештаи</label>
                  <label><input type="checkbox" checked={entry.canApprovePlan} onChange={() => toggle(index, "canApprovePlan")} /> Одобрување</label>
                </div>

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
                  <button
                    className={`mode-tile${entry.canUsePijara ? " mode-tile--active" : ""}`}
                    type="button"
                    onClick={() => toggle(index, "canUsePijara")}
                  >
                    Пијара
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );

  function toggle(index: number, field: PermissionField) {
    setDraft((current) => {
      const target = current[index];
      if (!target) {
        return current;
      }

      const nextValue = !target[field];

      if (operatorUserSelected && (field === "canBake" || field === "canUsePekara" || field === "canUsePecenjara" || field === "canUsePijara") && nextValue) {
        return current.map((entry, currentIndex) => {
          if (currentIndex === index) {
            return { ...entry, [field]: nextValue };
          }

          return {
            ...entry,
            canBake: false,
            canUsePekara: false,
            canUsePecenjara: false,
            canUsePijara: false
          };
        });
      }

      return current.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, [field]: nextValue } : entry
      );
    });
  }

  function updateOvenType(index: number, field: "pekaraOvenType" | "pecenjaraOvenType", ovenType: string) {
    setDraft((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, [field]: ovenType } : entry
      )
    );
  }
}
