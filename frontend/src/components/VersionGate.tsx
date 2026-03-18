import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { PageState } from "./PageState";
import { isNativeAndroid, startNativeUpdate } from "../lib/appUpdater";
import { getApiBaseUrl, setApiBaseUrl } from "../lib/api";
import { useVersionPolicy } from "../lib/queries";
import { APP_BUILD, APP_BUILD_DATE, APP_VERSION, compareVersions } from "../lib/version";

export function VersionGate({ children }: PropsWithChildren) {
  const versionQuery = useVersionPolicy();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [startingUpdate, setStartingUpdate] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const policy = versionQuery.data?.data ?? null;
  const needsForceUpdate = policy
    ? policy.forceUpdate || compareVersions(APP_VERSION, policy.minimumSupportedVersion) < 0
    : false;

  useEffect(() => {
    if (!policy || !needsForceUpdate || !isNativeAndroid()) {
      return;
    }

    const attemptKey = `force-update:${policy.latestVersion}:${policy.buildNumber}`;
    if (window.sessionStorage.getItem(attemptKey)) {
      return;
    }

    window.sessionStorage.setItem(attemptKey, "1");
    setStartingUpdate(true);
    startNativeUpdate(policy.downloadUrl)
      .catch((error: Error) => {
        setUpdateError(error.message);
        if (shouldFallbackToBrowserDownload(error)) {
          window.location.href = policy.downloadUrl;
        }
      })
      .finally(() => {
        setStartingUpdate(false);
      });
  }, [needsForceUpdate, policy]);

  if (versionQuery.isLoading) {
    return <PageState message="Се проверува верзијата на апликацијата..." />;
  }

  if (versionQuery.isError || !versionQuery.data) {
    return (
      <section className="login-page">
        <article className="login-card update-card">
          <p className="topbar-eyebrow">Конекција</p>
          <h2>Не може да се провери верзијата на апликацијата</h2>
          <p>Провери ја API адресата. Ако backend-от е на друга IP, внеси ја точната адреса и пробај пак.</p>

          <div className="master-form">
            <input value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} placeholder="http://192.168.11.40:8081/api/v1" />
            <button
              className="action-button"
              type="button"
              onClick={() => {
                setApiBaseUrl(apiUrl);
                window.location.reload();
              }}
            >
              Сними API адреса и пробај пак
            </button>
          </div>
        </article>
      </section>
    );
  }

  if (!policy) {
    return <PageState message="Не може да се вчита политиката за верзија." />;
  }

  if (needsForceUpdate) {
    return (
      <section className="login-page">
        <article className="login-card update-card">
          <p className="topbar-eyebrow">Задолжителна надградба</p>
          <h2>Потребна е нова верзија</h2>
          <p>{policy.messageMk}</p>

          <div className="sync-result">
            <span>Тековна верзија: {APP_VERSION}</span>
            <span>Build: {APP_BUILD}</span>
            <span>Датум: {APP_BUILD_DATE}</span>
            <span>Нова верзија: {policy.latestVersion}</span>
            <span>Нов build: {policy.buildNumber}</span>
            <span>Објавена: {new Date(policy.releasedAt).toLocaleString("mk-MK")}</span>
          </div>

          {updateError && <div className="form-error">{updateError}</div>}

          <div className="login-actions">
            {isNativeAndroid() ? (
              <button
                className="action-button"
                type="button"
                onClick={() => {
                  setStartingUpdate(true);
                  setUpdateError(null);
                  startNativeUpdate(policy.downloadUrl)
                    .catch((error: Error) => {
                      setUpdateError(error.message);
                      if (shouldFallbackToBrowserDownload(error)) {
                        window.location.href = policy.downloadUrl;
                      }
                    })
                    .finally(() => {
                      setStartingUpdate(false);
                    });
                }}
              >
                {startingUpdate ? "Подготовка на update..." : "Преземи и инсталирај"}
              </button>
            ) : (
              <a className="action-button link-button" href={policy.downloadUrl}>
                Преземи нова верзија
              </a>
            )}
          </div>
        </article>
      </section>
    );
  }

  return <>{children}</>;
}

function shouldFallbackToBrowserDownload(error: Error) {
  const message = error.message.toLowerCase();
  return message.includes("plugin is not implemented") || message.includes("not implemented");
}
