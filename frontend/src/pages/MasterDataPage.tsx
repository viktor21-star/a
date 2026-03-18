import { Link } from "react-router-dom";

const masterSections = [
  { title: "Локации", description: "Управување со маркет објекти и региони.", path: "/master-data/locations" },
  { title: "Печки", description: "Конфигурација на печки и капацитети." },
  { title: "Артикли", description: "Шифрарник на артикли, групи и цени.", path: "/master-data/items" },
  { title: "Термини", description: "Временски прозорци и дозволени доцнења." },
  { title: "Корисници", description: "Улоги, пристапи и локациски овластувања." },
  { title: "Причини", description: "Причини за отпад и корекции." }
];

export function MasterDataPage() {
  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Администрација</p>
          <h3>Шифарници и системски поставки</h3>
        </div>
      </header>

      <div className="card-list reports-grid">
        {masterSections.map((section) => (
          <article className="workflow-card" key={section.title}>
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
