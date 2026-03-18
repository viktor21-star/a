import { Navigate } from "react-router-dom";
import { isAdministrator, useAuth } from "../lib/auth";

const adminModules = [
  {
    title: "План за печење",
    description: "Внес на план по маркет, саат и количина.",
    path: "/planning"
  },
  {
    title: "Реално печење",
    description: "Само преглед на тури, оператори и последни внесови.",
    path: "/production"
  },
  {
    title: "Аларми",
    description: "Разлика меѓу план и реално печење со критични отстапувања.",
    path: "/alerts"
  },
  {
    title: "Извештаи",
    description: "Извештаи за испечено, реализација и export.",
    path: "/reports"
  },
  {
    title: "Локации",
    description: "Маркетите што се користат во план, печење и извештаи.",
    path: "/master-data/locations"
  },
  {
    title: "Шифарници",
    description: "Артикли, термини, печки и системски поставки.",
    path: "/master-data"
  },
  {
    title: "Корисници",
    description: "Корисници, локации, дозволи и тип на печка по локација.",
    path: "/user-access"
  },
  {
    title: "Верзија",
    description: "Верзија на апликацијата, download линк и force update политика.",
    path: "/version-policy"
  }
];

export function HomePage() {
  const { user } = useAuth();

  if (!isAdministrator(user)) {
    return (
      <section className="page-grid">
        <header className="page-header">
          <div>
            <p className="topbar-eyebrow">Оператор</p>
            <h3>Избери дел за внес</h3>
            <p className="meta">Операторот работи само со две големи кочки: Пекара и Печењара.</p>
          </div>
        </header>

        <section className="operator-home-grid">
          <button
            type="button"
            className="operator-home-card"
            onClick={() => {
              window.location.href = "/production?mode=pekara";
            }}
          >
            <strong>Пекара</strong>
            <span>Леб, печива, бурек, кифли и останати производи од пекара.</span>
          </button>

          <button
            type="button"
            className="operator-home-card"
            onClick={() => {
              window.location.href = "/production?mode=pecenjara";
            }}
          >
            <strong>Печењара</strong>
            <span>Пилешко, месо и производи што се водат преку печењара.</span>
          </button>
        </section>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Администратор</p>
          <h3>Админ модули</h3>
          <p className="meta">Секој модул е голема кочка. Клик отвора full-screen модул, а горе има Назад за враќање.</p>
        </div>
      </header>

      <section className="admin-launch-grid">
        {adminModules.map((module) => (
          <button
            key={module.path}
            type="button"
            className="admin-launch-card"
            onClick={() => {
              window.location.href = module.path;
            }}
          >
            <strong>{module.title}</strong>
            <span>{module.description}</span>
            <small>Отвори модул</small>
          </button>
        ))}
      </section>
    </section>
  );
}
