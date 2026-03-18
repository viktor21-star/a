import { useEffect, useState } from "react";
import { PageState } from "../components/PageState";
import { isAdministrator, useAuth } from "../lib/auth";
import { useUpdateVersionPolicy, useVersionPolicy } from "../lib/queries";
import type { UpdateAppVersionPolicyRequest } from "../lib/types";

export function VersionPolicyPage() {
  const { user } = useAuth();
  const policyQuery = useVersionPolicy();
  const updateMutation = useUpdateVersionPolicy();
  const [form, setForm] = useState<UpdateAppVersionPolicyRequest | null>(null);

  useEffect(() => {
    if (policyQuery.data?.data) {
      setForm(policyQuery.data.data);
    }
  }, [policyQuery.data]);

  if (!isAdministrator(user)) {
    return <PageState message="Политиката за верзија ја менува само администратор." />;
  }

  if (policyQuery.isLoading || !form) {
    return <PageState message="Се вчитува политиката за верзија..." />;
  }

  if (policyQuery.isError) {
    return <PageState message="Не може да се вчита политиката за верзија." />;
  }

  return (
    <section className="page-grid">
      <header className="page-header">
        <div>
          <p className="topbar-eyebrow">Верзија</p>
          <h3>Force update политика</h3>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Контрола на верзија и update</h3>
          <button
            className="action-button"
            type="button"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate(form)}
          >
            {updateMutation.isPending ? "Снима..." : "Сними политика"}
          </button>
        </div>

        <div className="master-form master-form--inline">
          <input
            value={form.minimumSupportedVersion}
            placeholder="Минимална верзија"
            onChange={(event) => setForm((current) => current ? { ...current, minimumSupportedVersion: event.target.value } : current)}
          />
          <input
            value={form.latestVersion}
            placeholder="Најнова верзија"
            onChange={(event) => setForm((current) => current ? { ...current, latestVersion: event.target.value } : current)}
          />
          <input
            value={form.buildNumber}
            placeholder="Build"
            onChange={(event) => setForm((current) => current ? { ...current, buildNumber: event.target.value } : current)}
          />
          <input
            value={form.releasedAt}
            placeholder="ReleasedAt"
            onChange={(event) => setForm((current) => current ? { ...current, releasedAt: event.target.value } : current)}
          />
          <input
            value={form.downloadUrl}
            placeholder="Download URL"
            onChange={(event) => setForm((current) => current ? { ...current, downloadUrl: event.target.value } : current)}
          />
          <input
            value={form.messageMk}
            placeholder="Порака"
            onChange={(event) => setForm((current) => current ? { ...current, messageMk: event.target.value } : current)}
          />
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={form.forceUpdate}
              onChange={(event) => setForm((current) => current ? { ...current, forceUpdate: event.target.checked } : current)}
            />
            Задолжителен update
          </label>
        </div>

        {(updateMutation.error as Error | null) && (
          <div className="form-error">{(updateMutation.error as Error).message}</div>
        )}

        <div className="sync-result">
          <strong>Тековна активна политика</strong>
          <span>Минимална верзија: {policyQuery.data?.data.minimumSupportedVersion}</span>
          <span>Најнова верзија: {policyQuery.data?.data.latestVersion}</span>
          <span>Build: {policyQuery.data?.data.buildNumber}</span>
          <span>Force update: {policyQuery.data?.data.forceUpdate ? "Да" : "Не"}</span>
        </div>
      </section>
    </section>
  );
}
