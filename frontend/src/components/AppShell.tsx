import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { isAdministrator, useAuth } from "../lib/auth";
import { playFeedback } from "../lib/feedback";
import { syncPendingOperatorEntries, syncPendingWasteEntries } from "../lib/operatorEntryQueue";

export function AppShell() {
  const { mode, toggle } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const adminMode = isAdministrator(user);
  const isHome = location.pathname === "/";
  const operatorTitle = getOperatorTitle(location.pathname, location.search);

  useEffect(() => {
    void syncPendingOperatorEntries();
    void syncPendingWasteEntries();

    const handleOnline = () => {
      void Promise.all([syncPendingOperatorEntries(), syncPendingWasteEntries()]).then(([operatorSynced, wasteSynced]) => {
        if (operatorSynced + wasteSynced > 0) {
          playFeedback("synced", "Локалните внесови се испратени");
        }
      });
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  if (!adminMode) {
    return (
      <div className="shell shell--operator">
        <main className="content content--operator">
          <header className="topbar topbar--operator">
            <div>
              <img className="app-logo app-logo--topbar" src="/zito-logo.png" alt="Жито маркети" />
              <p className="topbar-eyebrow">Оператор</p>
              <h2>{operatorTitle}</h2>
            </div>

            <div className="topbar-actions">
              <button className="theme-toggle" type="button" onClick={toggle}>
                <span aria-hidden="true">{mode === "light" ? "☀" : "☾"}</span>
              </button>
              <button className="ghost-button" type="button" onClick={logout}>
                Одјава
              </button>
            </div>
          </header>

          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="shell shell--operator">
      <main className="content content--operator">
        <header className="topbar topbar--operator">
          <div>
            <img className="app-logo app-logo--topbar" src="/zito-logo.png" alt="Жито маркети" />
            <p className="topbar-eyebrow">Администратор</p>
            <h2>{isHome ? "Админ модули" : "Админ модул"}</h2>
          </div>

          <div className="topbar-actions">
            {!isHome && (
              <button className="ghost-button" type="button" onClick={() => navigate("/")}>
                Назад
              </button>
            )}
            <button className="theme-toggle" type="button" onClick={toggle}>
              <span aria-hidden="true">{mode === "light" ? "☀" : "☾"}</span>
            </button>
            <button className="ghost-button" type="button" onClick={logout}>
              Одјава
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}

function getOperatorTitle(pathname: string, search: string) {
  if (pathname === "/") {
    return "Избери дел за внес";
  }

  if (pathname !== "/production") {
    return "Операторски модул";
  }

  const mode = new URLSearchParams(search).get("mode");
  if (mode === "pekara") {
    return "Внес за Пекара";
  }

  if (mode === "pecenjara") {
    return "Внес за Печењара";
  }

  if (mode === "pijara") {
    return "Пријава од Пијара";
  }

  if (mode === "waste") {
    return "Пријава на отпад";
  }

  return "Избери дел за внес";
}
