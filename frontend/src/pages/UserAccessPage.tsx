import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useCreateUser, useLocations, useUpdateUserAccount, useUpdateUserLocations, useUserLocations, useUsers } from "../lib/queries";
import type { CreateUserRequest, UpdateUserAccountRequest, UserLocationPermission } from "../lib/types";

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

const emptyAccountDraft: UpdateUserAccountRequest = {
  isActive: true,
  newPassword: ""
};

export function UserAccessPage() {
  const { user } = useAuth();
  const usersQuery = useUsers();
  const locationsListQuery = useLocations();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const locationsQuery = useUserLocations(selectedUserId);
  const updateLocationsMutation = useUpdateUserLocations();
  const updateAccountMutation = useUpdateUserAccount();
  const createUserMutation = useCreateUser();
  const [draft, setDraft] = useState<UserLocationPermission[]>([]);
  const [newUser, setNewUser] = useState<CreateUserRequest>(emptyUser);
  const [accountDraft, setAccountDraft] = useState<UpdateUserAccountRequest>(emptyAccountDraft);
  const [userSearch, setUserSearch] = useState("");
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

  useEffect(() => {
    if (selectedUser) {
      setAccountDraft({
        isActive: selectedUser.isActive,
        newPassword: ""
      });
    }
  }, [selectedUser]);

  const selectedLocationName = useMemo(
    () =>
      locationsListQuery.data?.data.find((entry) => entry.locationId === newUser.defaultLocationId)?.nameMk ??
      "Избери локација",
    [locationsListQuery.data, newUser.defaultLocationId]
  );

  const filteredUsers = useMemo(() => {
    const rows = usersQuery.data?.data ?? [];
    const query = userSearch.trim().toLowerCase();
    if (!query) {
      return rows;
    }

    return rows.filter((entry) =>
      [entry.fullName, entry.username, entry.roleCode].some((value) => value.toLowerCase().includes(query))
    );
  }, [userSearch, usersQuery.data]);

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
          <h3>Корисници</h3>
          <p className="meta">Новите корисници се отвораат одделно, а постоечките се пребаруваат и им се менуваат привилегии, статус и лозинка.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Нов корисник</h3>
        </div>
        <div className="admin-form-grid">
          <article className="admin-input-tile">
            <span>Работна локација</span>
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
            <span>Име и презиме</span>
            <input
              value={newUser.fullName}
              placeholder="Име и презиме"
              onChange={(event) => setNewUser((current) => ({ ...current, fullName: event.target.value }))}
            />
          </article>

          <article className="admin-input-tile">
            <span>Корисничко име</span>
            <input
              value={newUser.username}
              placeholder="Корисничко име"
              onChange={(event) => setNewUser((current) => ({ ...current, username: event.target.value }))}
            />
          </article>

          <article className="admin-input-tile">
            <span>Лозинка</span>
            <input
              type="password"
              value={newUser.password}
              placeholder="Лозинка"
              onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
            />
          </article>

          <article className="admin-input-tile">
            <span>Улога</span>
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
            <span>Печка за Пекара</span>
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
            <span>Печка за Печењара</span>
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
          <strong>Модули на работната локација</strong>
          <span>Нов корисник ќе ги гледа само штиклираните операторски модули. Отпад се додава автоматски според избраните модули.</span>
        </div>

        <div className="mode-grid">
          <button className={`mode-tile${newUser.canUsePekara ? " mode-tile--active" : ""}`} type="button" onClick={() => setNewUser((current) => ({ ...current, canUsePekara: !current.canUsePekara }))}>
            Пекара
          </button>
          <button className={`mode-tile${newUser.canUsePecenjara ? " mode-tile--active" : ""}`} type="button" onClick={() => setNewUser((current) => ({ ...current, canUsePecenjara: !current.canUsePecenjara }))}>
            Печењара
          </button>
          <button className={`mode-tile${newUser.canUsePijara ? " mode-tile--active" : ""}`} type="button" onClick={() => setNewUser((current) => ({ ...current, canUsePijara: !current.canUsePijara }))}>
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

      <section className="panel">
        <div className="panel-header">
          <h3>Постоечки корисници</h3>
        </div>
        <div className="master-form master-form--inline">
          <input
            className="search-input"
            value={userSearch}
            placeholder="Пребарај по име, корисничко име или улога"
            onChange={(event) => setUserSearch(event.target.value)}
          />
        </div>
      </section>

      <div className="panel-grid panel-grid--production">
        <aside className="panel">
          <div className="panel-header">
            <h3>Листа на корисници</h3>
          </div>
          <div className="card-list admin-summary-grid">
            {filteredUsers.map((entry) => (
              <button
                key={entry.userId}
                className={`user-summary-card${selectedUserId === entry.userId ? " user-summary-card--active" : ""}`}
                type="button"
                onClick={() => setSelectedUserId(entry.userId)}
              >
                <strong>{entry.fullName}</strong>
                <span>{entry.username}</span>
                <span>{entry.roleCode}</span>
                <span>{entry.isActive ? "Активен" : "Деактивиран"}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel">
          <div className="panel-header">
            <h3>Профил и привилегии</h3>
          </div>

          {!selectedUser ? (
            <div className="list-card">Избери корисник од листата.</div>
          ) : (
            <>
              <div className="admin-form-grid">
                <article className="admin-input-tile">
                  <span>Корисник</span>
                  <strong>{selectedUser.fullName}</strong>
                  <small>{selectedUser.username}</small>
                </article>

                <article className="admin-input-tile">
                  <span>Улога</span>
                  <strong>{selectedUser.roleCode}</strong>
                  <small>{accountDraft.isActive ? "Активен" : "Деактивиран"}</small>
                </article>

                <article className="admin-input-tile">
                  <span>Статус</span>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => setAccountDraft((current) => ({ ...current, isActive: !current.isActive }))}
                  >
                    {accountDraft.isActive ? "Деактивирај" : "Активирај"}
                  </button>
                </article>

                <article className="admin-input-tile">
                  <span>Нова лозинка</span>
                  <input
                    type="password"
                    value={accountDraft.newPassword ?? ""}
                    placeholder="Остави празно ако не менуваш"
                    onChange={(event) => setAccountDraft((current) => ({ ...current, newPassword: event.target.value }))}
                  />
                </article>
              </div>

              <div className="login-actions">
                <button
                  className="action-button"
                  type="button"
                  onClick={() => {
                    if (!selectedUserId) {
                      return;
                    }

                    updateAccountMutation.mutate({
                      userId: selectedUserId,
                      payload: accountDraft
                    }, {
                      onSuccess: () => {
                        setAccountDraft((current) => ({ ...current, newPassword: "" }));
                      }
                    });
                  }}
                >
                  Сними профил
                </button>
              </div>

              <div className="panel-header">
                <h3>Привилегии по локација</h3>
                <button
                  className="action-button"
                  type="button"
                  onClick={() => {
                    if (!selectedUserId) {
                      return;
                    }

                    updateLocationsMutation.mutate({
                      userId: selectedUserId,
                      payload: {
                        locations: draft.map((entry) => ({
                          ...entry,
                          canRecordWaste: entry.canRecordWaste || entry.canUsePekara || entry.canUsePecenjara || entry.canUsePijara
                        }))
                      }
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
                      <label><input type="checkbox" checked={entry.canRecordWaste || entry.canUsePekara || entry.canUsePecenjara || entry.canUsePijara} readOnly /> Отпад (автоматски)</label>
                      <label><input type="checkbox" checked={entry.canViewReports} onChange={() => toggle(index, "canViewReports")} /> Извештаи</label>
                      <label><input type="checkbox" checked={entry.canApprovePlan} onChange={() => toggle(index, "canApprovePlan")} /> Одобрување</label>
                    </div>

                    <div className="mode-grid">
                      <button className={`mode-tile${entry.canUsePekara ? " mode-tile--active" : ""}`} type="button" onClick={() => toggle(index, "canUsePekara")}>
                        Пекара
                      </button>
                      <button className={`mode-tile${entry.canUsePecenjara ? " mode-tile--active" : ""}`} type="button" onClick={() => toggle(index, "canUsePecenjara")}>
                        Печењара
                      </button>
                      <button className={`mode-tile${entry.canUsePijara ? " mode-tile--active" : ""}`} type="button" onClick={() => toggle(index, "canUsePijara")}>
                        Пијара
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
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
