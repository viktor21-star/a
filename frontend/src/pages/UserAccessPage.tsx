import { useEffect, useMemo, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useCreateUser, useLocations, useUpdateUserAccount, useUpdateUserLocations, useUserLocations, useUsers } from "../lib/queries";
import type { CreateUserRequest, UpdateUserAccountRequest, UserLocationPermission } from "../lib/types";

type PermissionField =
  | "canUsePekara"
  | "canUsePecenjara"
  | "canUsePijara";

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
  const locationsListQuery = useLocations(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const locationsQuery = useUserLocations(selectedUserId);
  const updateLocationsMutation = useUpdateUserLocations();
  const updateAccountMutation = useUpdateUserAccount();
  const createUserMutation = useCreateUser();
  const [draft, setDraft] = useState<UserLocationPermission[]>([]);
  const [newUser, setNewUser] = useState<CreateUserRequest>(emptyUser);
  const [createUserMessage, setCreateUserMessage] = useState<string | null>(null);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [permissionsMessage, setPermissionsMessage] = useState<string | null>(null);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [accountDraft, setAccountDraft] = useState<UpdateUserAccountRequest>(emptyAccountDraft);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "administrator" | "operator">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [locationFilter, setLocationFilter] = useState<"all" | string>("all");
  const selectedUser = usersQuery.data?.data.find((entry) => entry.userId === selectedUserId) ?? null;
  const operatorUserSelected = selectedUser?.roleCode === "operator";
  const activeLocations = useMemo(
    () => (locationsListQuery.data?.data ?? []).filter((location) => location.isActive),
    [locationsListQuery.data]
  );

  useEffect(() => {
    if (!selectedUserId && usersQuery.data?.data.length) {
      setSelectedUserId(usersQuery.data.data[0].userId);
    }
  }, [selectedUserId, usersQuery.data]);

  useEffect(() => {
    if (activeLocations.length && !newUser.defaultLocationId) {
      setNewUser((current) => ({
        ...current,
        defaultLocationId: activeLocations[0]?.locationId ?? 0
      }));
    }
  }, [activeLocations, newUser.defaultLocationId]);

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

  const locationsById = useMemo(
    () => new Map((locationsListQuery.data?.data ?? []).map((entry) => [entry.locationId, entry])),
    [locationsListQuery.data]
  );

  const filteredUsers = useMemo(() => {
    const rows = usersQuery.data?.data ?? [];
    const query = userSearch.trim().toLowerCase();
    return rows
      .filter((entry) => roleFilter === "all" || entry.roleCode === roleFilter)
      .filter((entry) => locationFilter === "all" || String(entry.defaultLocationId ?? "") === locationFilter)
      .filter((entry) => {
        if (statusFilter === "all") {
          return true;
        }

        return statusFilter === "active" ? entry.isActive : !entry.isActive;
      })
      .filter((entry) => !query || [entry.username, entry.roleCode].some((value) => value.toLowerCase().includes(query)));
  }, [locationFilter, roleFilter, statusFilter, userSearch, usersQuery.data]);

  const userCounts = useMemo(() => {
    const rows = usersQuery.data?.data ?? [];
    return {
      total: rows.length,
      active: rows.filter((entry) => entry.isActive).length,
      operators: rows.filter((entry) => entry.roleCode === "operator").length
    };
  }, [usersQuery.data]);

  const selectedUserLocationLabel = selectedUser
    ? formatLocationLabel(
        locationsById.get(selectedUser.defaultLocationId ?? -1)?.code,
        locationsById.get(selectedUser.defaultLocationId ?? -1)?.nameMk
      )
    : "Нема";

  if (!isAdministrator(user)) {
    return <PageState message="Само администратор може да креира корисници и да менува привилегии." />;
  }

  if (usersQuery.isLoading || locationsListQuery.isLoading) {
    return <PageState message="Се вчитуваат корисници и локации..." />;
  }

  if (usersQuery.isError || !usersQuery.data || locationsListQuery.isError || !locationsListQuery.data) {
    return <PageState message="Не може да се вчитаат корисниците или локациите." />;
  }

  if (!activeLocations.length) {
    return <PageState message="Нема активни локации. Прво активирај локација во Шифрарници > Локации." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Администрација</p>
          <h3>Корисници</h3>
          <p className="meta">Нов корисник се отвора со локација, корисничко име, лозинка и улога. Модулите стојат како работна позиција.</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Нов корисник</h3>
        </div>

        {createUserError && <div className="form-error">{createUserError}</div>}
        {createUserMessage && <div className="sync-result">{createUserMessage}</div>}

        <div className="admin-form-grid">
          <article className="admin-input-tile">
            <span>Работна локација</span>
            <select
              value={newUser.defaultLocationId}
              onChange={(event) => setNewUser((current) => ({ ...current, defaultLocationId: Number(event.target.value) }))}
            >
              {activeLocations.map((location) => (
                <option key={location.locationId} value={location.locationId}>
                  {location.code} · {location.nameMk}
                </option>
              ))}
            </select>
            <small>{selectedLocationName}</small>
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
            </select>
          </article>

        </div>

        <div className="operator-explainer">
          <strong>Модули на работна позиција</strong>
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
              setCreateUserError(null);
              setCreateUserMessage(null);

              if (
                !newUser.defaultLocationId ||
                !newUser.username.trim() ||
                !newUser.password.trim() ||
                (!newUser.canUsePekara && !newUser.canUsePecenjara && !newUser.canUsePijara)
              ) {
                setCreateUserError("Пополнете локација, корисничко име, лозинка и барем една работна позиција.");
                return;
              }

              createUserMutation.mutate({
                ...newUser,
                fullName: newUser.username.trim(),
                pekaraOvenType: "Нема",
                pecenjaraOvenType: "Нема"
              }, {
                    onSuccess: (response) => {
                      setSelectedUserId(response.data.userId);
                      setNewUser({
                        ...emptyUser,
                        defaultLocationId: activeLocations[0]?.locationId ?? 0
                      });
                      setCreateUserMessage(`Успешно е креиран корисник: ${response.data.username}`);
                    },
                onError: (error) => {
                  setCreateUserError(error instanceof Error ? error.message : "Корисникот не може да се креира.");
                }
              });
            }}
          >
            {createUserMutation.isPending ? "Се креира..." : "Креирај корисник"}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>Постоечки корисници</h3>
        </div>
        <div className="admin-hero-grid">
          <article className="admin-stat-tile">
            <span>Вкупно корисници</span>
            <strong>{userCounts.total}</strong>
          </article>
          <article className="admin-stat-tile">
            <span>Активни</span>
            <strong>{userCounts.active}</strong>
          </article>
          <article className="admin-stat-tile">
            <span>Оператори</span>
            <strong>{userCounts.operators}</strong>
          </article>
        </div>
        <div className="master-form master-form--inline">
          <input
            className="search-input"
            value={userSearch}
            placeholder="Пребарај по корисничко име или улога"
            onChange={(event) => setUserSearch(event.target.value)}
          />
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | "administrator" | "operator")}>
            <option value="all">Сите улоги</option>
            <option value="administrator">Администратор</option>
            <option value="operator">Оператор</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}>
            <option value="all">Сите статуси</option>
            <option value="active">Само активни</option>
            <option value="inactive">Само неактивни</option>
          </select>
          <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
            <option value="all">Сите локации</option>
            {activeLocations.map((location) => (
              <option key={location.locationId} value={String(location.locationId)}>
                {location.code} · {location.nameMk}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="panel-grid panel-grid--production">
        <aside className="panel">
          <div className="panel-header">
            <h3>Листа на корисници</h3>
          </div>
          {!filteredUsers.length && <div className="empty-state">Нема корисници за избраниот филтер.</div>}
          <div className="card-list admin-summary-grid">
            {filteredUsers.map((entry) => (
              <button
                key={entry.userId}
                className={`user-summary-card${selectedUserId === entry.userId ? " user-summary-card--active" : ""}`}
                type="button"
                onClick={() => setSelectedUserId(entry.userId)}
              >
                <strong>{entry.username}</strong>
                <span>{entry.roleCode === "administrator" ? "Администратор" : "Оператор"}</span>
                <small>{formatLocationLabel(locationsById.get(entry.defaultLocationId ?? -1)?.code, locationsById.get(entry.defaultLocationId ?? -1)?.nameMk)}</small>
                <span className={`status-chip ${entry.isActive ? "status-chip--active" : "status-chip--inactive"}`}>
                  {entry.isActive ? "Активен" : "Неактивен"}
                </span>
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
                  <strong>{selectedUser.username}</strong>
                  <small>ID: {selectedUser.userId}</small>
                </article>

                <article className="admin-input-tile">
                  <span>Работна локација</span>
                  <strong>{selectedUserLocationLabel}</strong>
                  <small>Основна локација за најавување</small>
                </article>

                <article className="admin-input-tile">
                  <span>Улога</span>
                  <strong>{selectedUser.roleCode === "administrator" ? "Администратор" : "Оператор"}</strong>
                  <small>{accountDraft.isActive ? "Активен корисник" : "Неактивен корисник"}</small>
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

              {accountMessage && <div className="sync-result">{accountMessage}</div>}
              {accountError && <div className="form-error">{accountError}</div>}

              <div className="login-actions">
                <button
                  className="action-button"
                  type="button"
                  onClick={() => {
                    if (!selectedUserId) {
                      return;
                    }

                    setAccountMessage(null);
                    setAccountError(null);

                    updateAccountMutation.mutate({
                      userId: selectedUserId,
                      payload: accountDraft
                    }, {
                      onSuccess: () => {
                        setAccountDraft((current) => ({ ...current, newPassword: "" }));
                        setAccountMessage(`Успешно е снимен профилот за ${selectedUser.username}.`);
                      }
                      ,
                      onError: (error) => {
                        setAccountError(error instanceof Error ? error.message : "Профилот не може да се сними.");
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

                    setPermissionsMessage(null);
                    setPermissionsError(null);

                    updateLocationsMutation.mutate({
                      userId: selectedUserId,
                      payload: {
                        locations: draft.map((entry) => ({
                          ...entry,
                          canPlan: false,
                          canBake: entry.canUsePekara || entry.canUsePecenjara || entry.canUsePijara,
                          canRecordWaste: entry.canUsePekara || entry.canUsePecenjara || entry.canUsePijara,
                          canViewReports: false,
                          canApprovePlan: false,
                          pekaraOvenType: "Нема",
                          pecenjaraOvenType: "Нема"
                        }))
                      }
                    }, {
                      onSuccess: () => {
                        setPermissionsMessage(`Успешно се снимени привилегиите за ${selectedUser.username}.`);
                      },
                      onError: (error) => {
                        setPermissionsError(error instanceof Error ? error.message : "Привилегиите не може да се снимат.");
                      }
                    });
                  }}
                >
                  Сними привилегии
                </button>
              </div>

              {permissionsMessage && <div className="sync-result">{permissionsMessage}</div>}
              {permissionsError && <div className="form-error">{permissionsError}</div>}

              {locationsQuery.isLoading && <div className="list-card">Се вчитуваат привилегии...</div>}

              {operatorUserSelected && (
                <div className="operator-explainer">
                  <strong>Оператор</strong>
                  <span>Избери ги само модулите што треба да ги гледа на работната локација.</span>
                </div>
              )}

              {!!draft.length && (
                <div className="admin-hero-grid">
                  <article className="admin-stat-tile">
                    <span>Работна локација</span>
                    <strong>{draft.find((entry) => entry.canUsePekara || entry.canUsePecenjara || entry.canUsePijara)?.locationName ?? "Нема"}</strong>
                  </article>
                  <article className="admin-stat-tile">
                    <span>Доделени модули</span>
                    <strong>
                      {[
                        draft.some((entry) => entry.canUsePekara) ? "Пекара" : null,
                        draft.some((entry) => entry.canUsePecenjara) ? "Печењара" : null,
                        draft.some((entry) => entry.canUsePijara) ? "Пијара" : null
                      ].filter(Boolean).join(", ") || "Нема"}
                    </strong>
                  </article>
                </div>
              )}

              <div className="card-list admin-summary-grid">
                {draft.map((entry, index) => (
                  <article className="permission-card permission-card--large" key={`${entry.locationId}-${entry.locationName}`}>
                    <strong>{entry.locationName}</strong>

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

      if (operatorUserSelected && (field === "canUsePekara" || field === "canUsePecenjara" || field === "canUsePijara") && nextValue) {
        return current.map((entry, currentIndex) => {
          if (currentIndex === index) {
            return { ...entry, [field]: nextValue };
          }

          return {
            ...entry,
            canBake: false,
            canUsePekara: false,
            canUsePecenjara: false,
            canUsePijara: false,
            canPlan: false,
            canViewReports: false,
            canApprovePlan: false
          };
        });
      }

      return current.map((entry, currentIndex) =>
        currentIndex === index
          ? {
              ...entry,
              [field]: nextValue,
              canBake:
                field === "canUsePekara" || field === "canUsePecenjara" || field === "canUsePijara"
                  ? field === "canUsePekara"
                    ? nextValue || entry.canUsePecenjara || entry.canUsePijara
                    : field === "canUsePecenjara"
                      ? entry.canUsePekara || nextValue || entry.canUsePijara
                      : entry.canUsePekara || entry.canUsePecenjara || nextValue
                  : entry.canBake,
              canRecordWaste:
                field === "canUsePekara" || field === "canUsePecenjara" || field === "canUsePijara"
                  ? field === "canUsePekara"
                    ? nextValue || entry.canUsePecenjara || entry.canUsePijara
                    : field === "canUsePecenjara"
                      ? entry.canUsePekara || nextValue || entry.canUsePijara
                      : entry.canUsePekara || entry.canUsePecenjara || nextValue
                  : entry.canRecordWaste,
              canPlan: false,
              canViewReports: false,
              canApprovePlan: false
            }
          : entry
      );
    });
  }
}

function formatLocationLabel(code?: string, name?: string) {
  if (code && name) {
    return `${code} · ${name}`;
  }

  return code || name || "Нема";
}
