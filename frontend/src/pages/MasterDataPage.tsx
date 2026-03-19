import { Link } from "react-router-dom";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";

const masterSections = [
  { title: "Локации", description: "Маркетите што влегуваат во планот, реализацијата и алармите.", path: "/master-data/locations" },
  { title: "Артикли", description: "Артикли што се планираат и се печат по локација.", path: "/master-data/items" },
  { title: "Печки", description: "Типови на печка и број на печки по локација.", path: "/master-data/ovens" },
  { title: "Термини", description: "Часови и прозорци кога треба да биде готово печењето." },
  { title: "Корисници", description: "Кој корисник за која локација работи и што смее да прави." },
  { title: "Причини", description: "Причини за разлика, отпад или доцнење во реално печење." }
];

export function MasterDataPage() {
  const { user } = useAuth();

  if (!isAdministrator(user)) {
    return <PageState message="Шифарниците ги одржува администратор." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Администрација</p>
          <h3>Шифарници и системски поставки</h3>
          <p className="meta">
            Шифарник е основната листа што ја користи целиот систем: локации, артикли, печки, термини и причини.
            Ако нешто не е добро во шифарник, нема да биде добро ниту во план, реализација, аларми и извештаи.
          </p>
        </div>
      </header>

      <div className="card-list reports-grid">
        {masterSections.map((section) => (
          <article className="workflow-card admin-tile-card" key={section.title}>
            <h4>{section.title}</h4>
            <p>{section.description}</p>
            <div className="workflow-card__actions">
              {section.path ? (
                <Link className="ghost-button link-button" to={section.path}>
                  Преглед
                </Link>
              ) : (
                <button className="ghost-button">Преглед</button>
              )}
              <button className="action-button">Измени</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
