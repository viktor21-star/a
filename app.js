const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const logoutButton = document.getElementById("logoutButton");
const currentMarket = document.getElementById("currentMarket");
const currentRole = document.getElementById("currentRole");
const reportPeriod = document.getElementById("reportPeriod");
const reportCards = document.getElementById("reportCards");
const reportBreakdown = document.getElementById("reportBreakdown");
const entryForm = document.getElementById("entryForm");
const entryDate = document.getElementById("entryDate");
const entriesContainer = document.getElementById("entries");
const summary = document.getElementById("summary");
const filterType = document.getElementById("filterType");
const exportButton = document.getElementById("exportButton");
const installButton = document.getElementById("installButton");
const entryTemplate = document.getElementById("entryTemplate");
const itemRowTemplate = document.getElementById("itemRowTemplate");
const itemsList = document.getElementById("itemsList");
const addItemButton = document.getElementById("addItemButton");
const statusBanner = document.getElementById("statusBanner");
const reportDate = document.getElementById("reportDate");

let deferredPrompt = null;
let session = loadSession();
let entries = [];
let reportData = null;

setDefaultDate();
setDefaultReportDate();
appendItemRow();
bindPwaInstall();
bindEvents();
boot();

function bindPwaInstall() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installButton.hidden = true;
  });
}

function bindEvents() {
  loginForm.addEventListener("submit", handleLogin);
  logoutButton.addEventListener("click", handleLogout);
  reportPeriod.addEventListener("change", refreshReports);
  reportDate.addEventListener("change", refreshReports);
  filterType.addEventListener("change", renderEntries);
  addItemButton.addEventListener("click", appendItemRow);
  exportButton.addEventListener("click", exportEntries);
  entryForm.addEventListener("submit", submitEntry);
}

async function boot() {
  if (!session) {
    showAuth();
    return;
  }

  const restored = await api("/api/session", {
    method: "GET"
  });

  if (!restored.ok) {
    clearSession();
    showAuth();
    setStatus("Najavata isteche. Najavi se povtorno.", "warn");
    return;
  }

  session = restored.data;
  saveSession(session);
  await initializeDashboard();
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = {
    marketCode: String(formData.get("marketCode")).trim(),
    pin: String(formData.get("pin")).trim()
  };

  const response = await api("/api/login", {
    method: "POST",
    body: payload,
    withAuth: false
  });

  if (!response.ok) {
    setStatus(response.error || "Najavata ne uspea.", "error");
    return;
  }

  session = response.data;
  saveSession(session);
  loginForm.reset();
  await initializeDashboard();
  setStatus("Uspeshno najaven korisnik.", "success");
}

async function handleLogout() {
  await api("/api/logout", { method: "POST" });
  clearSession();
  entries = [];
  reportData = null;
  entriesContainer.replaceChildren();
  reportCards.replaceChildren();
  reportBreakdown.replaceChildren();
  showAuth();
  setStatus("Odjavata e zavrshena.", "info");
}

async function initializeDashboard() {
  showDashboard();
  currentMarket.textContent = session.marketName;
  currentRole.textContent = session.role === "admin" ? "Administrator" : "Market";
  await Promise.all([refreshEntries(), refreshReports()]);
}

async function refreshEntries() {
  const response = await api("/api/entries", { method: "GET" });
  if (!response.ok) {
    setStatus(response.error || "Ne mozham da gi prezemam zapisite.", "error");
    return;
  }

  entries = response.data.entries;
  renderEntries();
}

async function refreshReports() {
  if (!session) {
    return;
  }

  const params = new URLSearchParams({
    period: reportPeriod.value,
    date: reportDate.value
  });

  const response = await api(`/api/reports?${params.toString()}`, { method: "GET" });
  if (!response.ok) {
    setStatus(response.error || "Ne mozham da gi prezemam izveshtaite.", "error");
    return;
  }

  reportData = response.data;
  renderReports();
}

async function submitEntry(event) {
  event.preventDefault();

  const formData = new FormData(entryForm);
  const items = collectItems();
  if (!items.length) {
    setStatus("Dodadi barem eden artikl so kolicina.", "warn");
    return;
  }

  const payload = {
    roastType: String(formData.get("roastType")).trim(),
    entryDate: String(formData.get("entryDate")).trim(),
    itemNote: String(formData.get("itemNote")).trim(),
    items
  };

  const response = await api("/api/entries", {
    method: "POST",
    body: payload
  });

  if (!response.ok) {
    setStatus(response.error || "Ne uspea zachuvuvanjeto.", "error");
    return;
  }

  entryForm.reset();
  itemsList.replaceChildren();
  appendItemRow();
  setDefaultDate();
  await Promise.all([refreshEntries(), refreshReports()]);
  setStatus("Vnesot e zachuvan vo centralnata baza.", "success");
}

async function deleteEntry(id) {
  const response = await api(`/api/entries/${id}`, { method: "DELETE" });
  if (!response.ok) {
    setStatus(response.error || "Ne uspea brishenjeto.", "error");
    return;
  }

  await Promise.all([refreshEntries(), refreshReports()]);
  setStatus("Zapisot e izbrishan.", "info");
}

function renderEntries() {
  const roastFilter = filterType.value.trim();
  const filteredEntries = entries.filter((entry) => !roastFilter || entry.roastType === roastFilter);

  renderSummary(filteredEntries);
  entriesContainer.replaceChildren();

  if (!filteredEntries.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nema zapisi za izbranite filteri.";
    entriesContainer.append(empty);
    return;
  }

  filteredEntries.forEach((entry) => {
    const node = entryTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".entry__market").textContent = entry.marketName;
    node.querySelector(".entry__meta").textContent = `${formatDate(entry.entryDate)} | ${entry.createdBy}`;
    node.querySelector(".pill").textContent = entry.roastType;
    const itemsNode = node.querySelector(".entry__items");
    entry.items.forEach((item) => {
      const itemNode = document.createElement("p");
      itemNode.className = "entry__item";
      itemNode.textContent = `${item.name} - ${item.quantity} parcinja`;
      itemsNode.append(itemNode);
    });
    node.querySelector(".entry__note").textContent = entry.itemNote || "Bez zabeleshka";

    const deleteButton = node.querySelector(".danger-button");
    if (session.role !== "admin" && entry.marketCode !== session.marketCode) {
      deleteButton.hidden = true;
    } else {
      deleteButton.addEventListener("click", () => deleteEntry(entry.id));
    }

    entriesContainer.append(node);
  });
}

function renderSummary(filteredEntries) {
  const totalQuantity = filteredEntries.reduce(
    (sum, entry) => sum + entry.items.reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0),
    0
  );
  const markets = new Set(filteredEntries.map((entry) => entry.marketName)).size;
  summary.textContent =
    `Zapisi: ${filteredEntries.length} | Artikli vkupno: ${totalQuantity} | Aktivni marketi: ${markets}`;
}

function renderReports() {
  reportCards.replaceChildren();
  reportBreakdown.replaceChildren();

  const cards = [
    { label: "Zapisi", value: reportData.totals.entries },
    { label: "Kolicina", value: reportData.totals.quantity },
    { label: "Pekara", value: reportData.totals.pekara },
    { label: "Pilinja", value: reportData.totals.pilinja }
  ];

  cards.forEach((card) => {
    const node = document.createElement("article");
    node.className = "report-card";
    node.innerHTML = `<p class="report-card__label">${card.label}</p><p class="report-card__value">${card.value}</p>`;
    reportCards.append(node);
  });

  if (!reportData.byMarket.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Nema podatoci za ovoj period.";
    reportBreakdown.append(empty);
    return;
  }

  reportData.byMarket.forEach((market) => {
    const node = document.createElement("article");
    node.className = "market-report";
    node.innerHTML =
      `<div><p class="market-report__name">${market.marketName}</p><p class="market-report__meta">Zapisi: ${market.entries} | Kolicina: ${market.quantity}</p></div>` +
      `<div class="market-report__split"><span>Pekara ${market.pekara}</span><span>Pilinja ${market.pilinja}</span></div>`;
    reportBreakdown.append(node);
  });
}

function appendItemRow() {
  const row = itemRowTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".item-row__remove").addEventListener("click", () => {
    if (itemsList.children.length === 1) {
      row.querySelector(".item-row__name").value = "";
      row.querySelector(".item-row__qty").value = "";
      return;
    }
    row.remove();
  });
  itemsList.append(row);
}

function collectItems() {
  return Array.from(itemsList.querySelectorAll(".item-row"))
    .map((row) => ({
      name: row.querySelector(".item-row__name").value.trim(),
      quantity: Number(row.querySelector(".item-row__qty").value)
    }))
    .filter((item) => item.name && item.quantity > 0);
}

function exportEntries() {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `pecenje-centralna-baza-${today}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function showAuth() {
  authSection.hidden = false;
  dashboardSection.hidden = true;
}

function showDashboard() {
  authSection.hidden = true;
  dashboardSection.hidden = false;
}

function setDefaultDate() {
  entryDate.value = toLocalInputValue(new Date());
}

function setDefaultReportDate() {
  reportDate.value = new Date().toISOString().slice(0, 10);
}

function toLocalInputValue(date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("mk-MK", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function loadSession() {
  try {
    const raw = localStorage.getItem("pecenje-session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(value) {
  localStorage.setItem("pecenje-session", JSON.stringify(value));
}

function clearSession() {
  session = null;
  localStorage.removeItem("pecenje-session");
}

function setStatus(message, type = "info") {
  statusBanner.textContent = message;
  statusBanner.dataset.type = type;
}

async function api(path, options = {}) {
  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json"
    }
  };

  if (options.withAuth !== false && session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(path, config);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: data.error || "Server error." };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Nema konekcija so serverot." };
  }
}
