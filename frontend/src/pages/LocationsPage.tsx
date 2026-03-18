import { useState } from "react";
import { MasterDataForm } from "../components/MasterDataForm";
import { isAdministrator, useAuth } from "../lib/auth";
import { useLocations } from "../lib/queries";
import { useCreateLocation, useUpdateLocation } from "../lib/queries";
import { PageState } from "../components/PageState";
import type { UpsertLocationRequest } from "../lib/types";

export function LocationsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const [form, setForm] = useState<UpsertLocationRequest>({
    code: "",
    nameMk: "",
    regionCode: "",
    isActive: true
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const formError = (createLocation.error || updateLocation.error) as Error | null;

  if (!isAdministrator(user)) {
    return <PageState message="Локациите ги одржува администратор." />;
  }

  if (isLoading) {
    return <PageState message="Се вчитуваат локации..." />;
  }

  if (isError || !data) {
    return <PageState message="Не може да се вчитаат локациите." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Шифарници</p>
          <h3>Локации</h3>
        </div>
      </header>

      <div className="panel-grid panel-grid--production">
        <MasterDataForm
          title={editingId ? "Измена локација" : "Нова локација"}
          submitLabel={editingId ? "Сними измени" : "Зачувај локација"}
          onSubmit={(event) => {
            event.preventDefault();
            if (editingId) {
              updateLocation.mutate(
                { locationId: editingId, payload: form },
                {
                  onSuccess: () => {
                    setEditingId(null);
                    setForm({ code: "", nameMk: "", regionCode: "", isActive: true });
                  }
                }
              );
              return;
            }

            createLocation.mutate(form, {
              onSuccess: () => {
                setForm({ code: "", nameMk: "", regionCode: "", isActive: true });
              }
            });
          }}
        >
          <input placeholder="Код" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
          <input placeholder="Име" value={form.nameMk} onChange={(event) => setForm((current) => ({ ...current, nameMk: event.target.value }))} />
          <input placeholder="Регион" value={form.regionCode} onChange={(event) => setForm((current) => ({ ...current, regionCode: event.target.value }))} />
          {formError && <div className="form-error">{formError.message}</div>}
        </MasterDataForm>

        <div className="report-table">
          {data.data.map((location) => (
            <div className="report-row report-row--master" key={location.locationId}>
              <strong>{location.nameMk}</strong>
              <span>Код: {location.code}</span>
              <span>Регион: {location.regionCode}</span>
              <span>{location.isActive ? "Активна" : "Неактивна"}</span>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setEditingId(location.locationId);
                  setForm({
                    code: location.code,
                    nameMk: location.nameMk,
                    regionCode: location.regionCode,
                    isActive: location.isActive
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
