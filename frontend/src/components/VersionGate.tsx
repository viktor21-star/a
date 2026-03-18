import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { PageState } from "./PageState";
import { isNativeAndroid, startNativeUpdate } from "../lib/appUpdater";
import { useVersionPolicy } from "../lib/queries";
import { APP_BUILD, APP_BUILD_DATE, APP_VERSION, compareVersions } from "../lib/version";

export function VersionGate({ children }: PropsWithChildren) {
  const versionQuery = useVersionPolicy();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [startingUpdate, setStartingUpdate] = useState(false);

  if (versionQuery.isLoading) {
    return <PageState message="Се проверува верзијата на апликацијата..." />;
  }

  if (versionQuery.isError || !versionQuery.data) {
    return <PageState message="Не може да се провери верзијата на апликацијата." />;
  }

  const policy = versionQuery.data.data;
  const needsForceUpdate =
    policy.forceUpdate || compareVersions(APP_VERSION, policy.minimumSupportedVersion) < 0;

  useEffect(() => {
    if (!needsForceUpdate || !isNativeAndroid()) {
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
      })
      .finally(() => {
        setStartingUpdate(false);
      });
  }, [needsForceUpdate, policy.buildNumber, policy.downloadUrl, policy.latestVersion]);

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
