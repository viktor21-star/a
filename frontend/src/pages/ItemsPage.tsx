import { useState } from "react";
import { MasterDataForm } from "../components/MasterDataForm";
import { isAdministrator, useAuth } from "../lib/auth";
import { useItems } from "../lib/queries";
import { useCreateItem, useUpdateItem } from "../lib/queries";
import { PageState } from "../components/PageState";
import type { UpsertItemRequest } from "../lib/types";

export function ItemsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useItems();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const [form, setForm] = useState<UpsertItemRequest>({
    code: "",
    nameMk: "",
    groupName: "",
    salesPrice: 0,
    wasteLimitPct: 0,
    isActive: true
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const formError = (createItem.error || updateItem.error) as Error | null;

  if (!isAdministrator(user)) {
    return <PageState message="Артиклите ги одржува администратор." />;
  }

  if (isLoading) {
    return <PageState message="Се вчитуваат артикли..." />;
  }

  if (isError || !data) {
    return <PageState message="Не може да се вчитаат артиклите." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Шифарници</p>
          <h3>Артикли</h3>
        </div>
      </header>

      <div className="panel-grid panel-grid--production">
        <MasterDataForm
          title={editingId ? "Измена артикал" : "Нов артикал"}
          submitLabel={editingId ? "Сними измени" : "Зачувај артикал"}
          onSubmit={(event) => {
            event.preventDefault();
            if (editingId) {
              updateItem.mutate(
                { itemId: editingId, payload: form },
                {
                  onSuccess: () => {
                    setEditingId(null);
                    setForm({
                      code: "",
                      nameMk: "",
                      groupName: "",
                      salesPrice: 0,
                      wasteLimitPct: 0,
                      isActive: true
                    });
                  }
                }
              );
              return;
            }

            createItem.mutate(form, {
              onSuccess: () => {
                setForm({
                  code: "",
                  nameMk: "",
                  groupName: "",
                  salesPrice: 0,
                  wasteLimitPct: 0,
                  isActive: true
                });
              }
            });
          }}
        >
          <input placeholder="Код" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
          <input placeholder="Име" value={form.nameMk} onChange={(event) => setForm((current) => ({ ...current, nameMk: event.target.value }))} />
          <input placeholder="Група" value={form.groupName} onChange={(event) => setForm((current) => ({ ...current, groupName: event.target.value }))} />
          <input
            placeholder="Цена"
            type="number"
            value={form.salesPrice}
            onChange={(event) => setForm((current) => ({ ...current, salesPrice: Number(event.target.value) }))}
          />
          <input
            placeholder="Лимит отпад %"
            type="number"
            value={form.wasteLimitPct}
            onChange={(event) => setForm((current) => ({ ...current, wasteLimitPct: Number(event.target.value) }))}
          />
          {formError && <div className="form-error">{formError.message}</div>}
        </MasterDataForm>

        <div className="report-table">
          {data.data.map((item) => (
            <div className="report-row report-row--master" key={item.itemId}>
              <strong>{item.nameMk}</strong>
              <span>Код: {item.code}</span>
              <span>Група: {item.groupName}</span>
              <span>Цена: {item.salesPrice}</span>
              <span>Лимит отпад: {item.wasteLimitPct}%</span>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setEditingId(item.itemId);
                  setForm({
                    code: item.code,
                    nameMk: item.nameMk,
                    groupName: item.groupName,
                    salesPrice: item.salesPrice,
                    wasteLimitPct: item.wasteLimitPct,
                    isActive: item.isActive
                  });
                }}
              >
                Измени
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
