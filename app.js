const DATA_URL = "data/congresses.json";
const SETTINGS_KEY = "cardioCongressGithubSettings";

let congresses = [];

const tbody = document.querySelector("#tbody");
const search = document.querySelector("#search");
const yearFilter = document.querySelector("#yearFilter");
const updated = document.querySelector("#updated");
const statusEl = document.querySelector("#status");

const dialog = document.querySelector("#dialog");
const form = document.querySelector("#congressForm");
const settingsDialog = document.querySelector("#settingsDialog");
const settingsForm = document.querySelector("#settingsForm");

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value + "T00:00:00");
  return new Intl.DateTimeFormat("nl-BE", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatRange(item) {
  if (!item.startDate && !item.endDate) return "";
  if (item.startDate && item.endDate && item.startDate !== item.endDate) {
    return `${formatDate(item.startDate)} – ${formatDate(item.endDate)}`;
  }
  return formatDate(item.startDate || item.endDate);
}

function getSettings() {
  return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function setBusy(isBusy) {
  document.querySelectorAll("button").forEach(btn => btn.disabled = isBusy);
}

async function loadData() {
  statusEl.textContent = "";
  const cacheBuster = `?v=${Date.now()}`;
  const res = await fetch(DATA_URL + cacheBuster, { cache: "no-store" });
  if (!res.ok) throw new Error("Kon congresdata niet laden");
  congresses = await res.json();
  congresses.sort((a, b) =>
    (a.startDate || "9999-99-99").localeCompare(b.startDate || "9999-99-99") ||
    (a.name || "").localeCompare(b.name || "")
  );
  populateYearFilter();
  render();
  updated.textContent = `Laatst geladen: ${new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium", timeStyle: "short" }).format(new Date())}`;
}

function populateYearFilter() {
  const current = yearFilter.value;
  const years = [...new Set(congresses.map(c => c.year).filter(Boolean))].sort();
  yearFilter.innerHTML = `<option value="">Alle jaren</option>` + years.map(y => `<option value="${y}">${y}</option>`).join("");
  yearFilter.value = current;
}

function render() {
  const q = search.value.trim().toLowerCase();
  const year = yearFilter.value;
  const rows = congresses.filter(c => {
    const haystack = `${c.year} ${c.name} ${c.city} ${c.notes}`.toLowerCase();
    return (!q || haystack.includes(q)) && (!year || String(c.year) === year);
  });

  tbody.innerHTML = rows.map(c => `
    <tr>
      <td>${c.year || ""}</td>
      <td>${escapeHtml(c.name || "")}</td>
      <td>${escapeHtml(c.city || "")}</td>
      <td>${formatRange(c)}</td>
      <td>${formatDate(c.abstractDeadline)}</td>
      <td>${c.sourceUrl ? `<a href="${escapeAttr(c.sourceUrl)}" target="_blank" rel="noopener">bron</a>` : ""}</td>
      <td>${escapeHtml(c.notes || "")}</td>
    </tr>
  `).join("") || `<tr><td colspan="7">Geen congressen gevonden.</td></tr>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s]));
}
function escapeAttr(str) { return escapeHtml(str); }

function toBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary);
}

async function githubRequest(url, options = {}) {
  const settings = getSettings();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${settings.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {})
    }
  });

  const text = await res.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }

  if (!res.ok) {
    throw new Error(body.message || `GitHub request faalde met status ${res.status}`);
  }
  return body;
}

async function saveCongressToGithub(item) {
  const settings = getSettings();
  const required = ["owner", "repo", "branch", "path", "token"];
  const missing = required.filter(k => !settings[k]);
  if (missing.length) {
    settingsDialog.showModal();
    throw new Error("Vul eerst de GitHub-instellingen in.");
  }

  const apiBase = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${settings.path}`;
  const getUrl = `${apiBase}?ref=${encodeURIComponent(settings.branch)}`;
  const current = await githubRequest(getUrl);

  const decoded = JSON.parse(decodeURIComponent(escape(atob(current.content.replace(/\n/g, "")))));
  decoded.push(item);
  decoded.sort((a, b) =>
    (a.startDate || "9999-99-99").localeCompare(b.startDate || "9999-99-99") ||
    (a.name || "").localeCompare(b.name || "")
  );

  const newContent = JSON.stringify(decoded, null, 2) + "\n";
  const commitMessage = `Add congress: ${item.name}`;

  await githubRequest(apiBase, {
    method: "PUT",
    body: JSON.stringify({
      message: commitMessage,
      content: toBase64Utf8(newContent),
      sha: current.sha,
      branch: settings.branch
    })
  });
}

document.querySelector("#addBtn").addEventListener("click", () => dialog.showModal());
document.querySelector("#cancelBtn").addEventListener("click", () => dialog.close());
document.querySelector("#refreshBtn").addEventListener("click", loadData);
search.addEventListener("input", render);
yearFilter.addEventListener("change", render);

document.querySelector("#settingsBtn").addEventListener("click", () => {
  const settings = getSettings();
  for (const [key, value] of Object.entries(settings)) {
    if (settingsForm.elements[key]) settingsForm.elements[key].value = value;
  }
  settingsDialog.showModal();
});

document.querySelector("#settingsCancelBtn").addEventListener("click", () => settingsDialog.close());

settingsForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(settingsForm).entries());
  saveSettings({
    owner: data.owner.trim(),
    repo: data.repo.trim(),
    branch: data.branch.trim() || "main",
    path: data.path.trim() || "data/congresses.json",
    token: data.token.trim()
  });
  settingsDialog.close();
  statusEl.textContent = "GitHub-instellingen bewaard.";
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  const item = {
    year: Number(data.year),
    name: data.name.trim(),
    city: data.city.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    abstractDeadline: data.abstractDeadline,
    sourceUrl: data.sourceUrl.trim(),
    notes: data.notes.trim()
  };

  try {
    setBusy(true);
    statusEl.textContent = "Opslaan in GitHub…";
    await saveCongressToGithub(item);
    form.reset();
    dialog.close();
    statusEl.textContent = "Congres opgeslagen in GitHub. Nieuwe data worden geladen…";
    await loadData();
    statusEl.textContent = "Congres permanent toegevoegd.";
  } catch (err) {
    statusEl.textContent = err.message;
  } finally {
    setBusy(false);
  }
});

loadData().catch(err => {
  updated.textContent = err.message;
  console.error(err);
});
