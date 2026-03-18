import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { isAdministrator, useAuth } from "../lib/auth";
import { APP_BUILD, APP_VERSION } from "../lib/version";

export function AppShell() {
  const { mode, toggle } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const adminMode = isAdministrator(user);
  const isHome = location.pathname === "/";

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
              <div className="user-chip">
                <strong>{user?.fullName ?? "Гостин"}</strong>
                <span>{user?.role ?? "unauthenticated"}</span>
                <span>v{APP_VERSION} · build {APP_BUILD}</span>
              </div>
              <button className="theme-toggle" type="button" onClick={toggle}>
                {mode === "light" ? "Dark mode" : "Light mode"}
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
            <div className="user-chip">
              <strong>{user?.fullName ?? "Гостин"}</strong>
              <span>{user?.role ?? "unauthenticated"}</span>
              <span>v{APP_VERSION} · build {APP_BUILD}</span>
            </div>
            <button className="theme-toggle" type="button" onClick={toggle}>
              {mode === "light" ? "Dark mode" : "Light mode"}
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
