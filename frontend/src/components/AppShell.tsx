import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { isAdministrator, useAuth } from "../lib/auth";
import { syncPendingOperatorEntries, syncPendingWasteEntries } from "../lib/operatorEntryQueue";

export function AppShell() {
  const { mode, toggle } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const adminMode = isAdministrator(user);
  const isHome = location.pathname === "/";

  useEffect(() => {
    void syncPendingOperatorEntries();
    void syncPendingWasteEntries();

    const handleOnline = () => {
      void syncPendingOperatorEntries();
      void syncPendingWasteEntries();
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
              <p className="topbar-eyebrow">Оператор</p>
              <h2>Внес на печење</h2>
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
