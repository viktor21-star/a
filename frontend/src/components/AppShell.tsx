import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { isAdministrator, useAuth } from "../lib/auth";
import { APP_BUILD, APP_BUILD_DATE, APP_VERSION } from "../lib/version";

const administratorNavItems = [
  { to: "/planning", label: "План на печење" },
  { to: "/production", label: "Реално печење" },
  { to: "/alerts", label: "Аларми" },
  { to: "/reports", label: "Извештаи" },
  { to: "/master-data/locations", label: "Локации" },
  { to: "/master-data", label: "Шифарници" },
  { to: "/user-access", label: "Корисници" },
  { to: "/version-policy", label: "Верзија" }
];

const operatorNavItems = [{ to: "/production", label: "Внес на печење" }];

export function AppShell() {
  const { mode, toggle } = useTheme();
  const { user, logout } = useAuth();
  const adminMode = isAdministrator(user);
  const navItems = adminMode ? administratorNavItems : operatorNavItems;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">П</div>
          <div>
            <p className="brand-eyebrow">Enterprise Suite</p>
            <h1>Контрола на печење</h1>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="topbar-eyebrow">Малопродажен синџир</p>
            <h2>{adminMode ? "Оперативен надзор и KPI" : "Операторски внес на печење"}</h2>
          </div>

          <div className="topbar-actions">
            <div className="user-chip">
              <strong>{user?.fullName ?? "Гостин"}</strong>
              <span>{user?.role ?? "unauthenticated"}</span>
              <span>v{APP_VERSION} · build {APP_BUILD} · {APP_BUILD_DATE}</span>
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
