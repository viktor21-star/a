import { isAdministrator, isOperator, useAuth } from "../lib/auth";
import { PageState } from "../components/PageState";
import { useUserLocations } from "../lib/queries";

const adminModules = [
  {
    title: "План за печење",
    description: "Внес на план по маркет, саат и количина.",
    path: "/planning",
    imageClass: "home-card--planning"
  },
  {
    title: "Реално печење",
    description: "Само преглед на тури, оператори и последни внесови.",
    path: "/production",
    imageClass: "home-card--production"
  },
  {
    title: "Аларми",
    description: "Разлика меѓу план и реално печење со критични отстапувања.",
    path: "/alerts",
    imageClass: "home-card--alerts"
  },
  {
    title: "Отпад",
    description: "Преглед на отпад по локација, артикал, количина и причина.",
    path: "/waste",
    imageClass: "home-card--waste"
  },
  {
    title: "Извештаи",
    description: "Извештаи за испечено, реализација и export.",
    path: "/reports",
    imageClass: "home-card--reports"
  },
  {
    title: "Локации",
    description: "Маркетите што се користат во план, печење и извештаи.",
    path: "/master-data/locations",
    imageClass: "home-card--locations"
  },
  {
    title: "Шифарници",
    description: "Артикли, термини, печки и системски поставки.",
    path: "/master-data",
    imageClass: "home-card--master-data"
  },
  {
    title: "Корисници",
    description: "Корисници, локации, дозволи и тип на печка по локација.",
    path: "/user-access",
    imageClass: "home-card--users"
  },
  {
    title: "Верзија",
    description: "Верзија на апликацијата, download линк и force update политика.",
    path: "/version-policy",
    imageClass: "home-card--version"
  }
];

export function HomePage() {
  const { user } = useAuth();
  const permissionsQuery = useUserLocations(user?.id ?? null);

  if (isOperator(user) && permissionsQuery.isLoading) {
    return <PageState message="Се вчитуваат операторските привилегии..." />;
  }

  const activePermission = !isAdministrator(user)
    ? (permissionsQuery.data?.data ?? []).find((entry) => entry.locationId === user?.defaultLocationId)
      ?? (permissionsQuery.data?.data ?? [])[0]
      ?? null
    : null;

  const operatorAccess = activePermission
    ? {
        pekara: activePermission.canBake && activePermission.canUsePekara,
        pecenjara: activePermission.canBake && activePermission.canUsePecenjara,
        pijara: activePermission.canBake && activePermission.canUsePijara,
        waste: activePermission.canRecordWaste
      }
    : { pekara: false, pecenjara: false, pijara: false, waste: false };

  if (!isAdministrator(user)) {
    if (!operatorAccess.pekara && !operatorAccess.pecenjara && !operatorAccess.pijara && !operatorAccess.waste) {
      return <PageState message="Операторот нема доделени модули за избраната работна локација." />;
    }

    return (
      <section className="page-grid">
        <header className="page-header">
          <div>
            <p className="topbar-eyebrow">Оператор</p>
            <h3>Избери дел за внес</h3>
            <p className="meta">Се прикажуваат само модулите што се дозволени за работната локација на операторот.</p>
          </div>
        </header>

        <section className="operator-home-grid">
          {operatorAccess.pekara && (
            <button
              type="button"
              className="operator-home-card home-card-visual home-card--pekara"
              onClick={() => {
                window.location.href = "/production?mode=pekara";
              }}
            >
              <span className="home-card-number">01</span>
              <span className="home-card-badge">Оператор</span>
              <div className="home-card-copy">
                <strong>Пекара</strong>
                <span>Леб, печива, бурек, кифли и останати производи од пекара.</span>
              </div>
            </button>
          )}

          {operatorAccess.pecenjara && (
            <button
              type="button"
              className="operator-home-card home-card-visual home-card--pecenjara"
              onClick={() => {
                window.location.href = "/production?mode=pecenjara";
              }}
            >
              <span className="home-card-number">02</span>
              <span className="home-card-badge">Оператор</span>
              <div className="home-card-copy">
                <strong>Печењара</strong>
                <span>Пилешко, месо и производи што се водат преку печењара.</span>
              </div>
            </button>
          )}

          {operatorAccess.pijara && (
            <button
              type="button"
              className="operator-home-card home-card-visual home-card--pijara"
              onClick={() => {
                window.location.href = "/production?mode=pijara";
              }}
            >
              <span className="home-card-number">03</span>
              <span className="home-card-badge">Оператор</span>
              <div className="home-card-copy">
                <strong>Пијара</strong>
                <span>Пријава на артикли со слика и посебна количина што оди како Класа Б.</span>
              </div>
            </button>
          )}

          {operatorAccess.waste && (
            <button
              type="button"
              className="operator-home-card home-card-visual home-card--waste"
              onClick={() => {
                window.location.href = "/production?mode=waste";
              }}
            >
              <span className="home-card-number">04</span>
              <span className="home-card-badge">Оператор</span>
              <div className="home-card-copy">
                <strong>Отпад</strong>
                <span>Пријава на отпад со избор од кој дел е отпадот, артикал, причина и слика.</span>
              </div>
            </button>
          )}
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
        {adminModules.map((module, index) => (
          <button
            key={module.path}
            type="button"
            className={`admin-launch-card home-card-visual ${module.imageClass}`}
            onClick={() => {
              window.location.href = module.path;
            }}
          >
            <span className="home-card-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="home-card-badge">Админ</span>
            <div className="home-card-copy">
              <strong>{module.title}</strong>
              <span>{module.description}</span>
            </div>
            <small>Отвори модул</small>
          </button>
        ))}
      </section>
    </section>
  );
}
