const STORAGE_KEY = "spendwise_transactions";
const CATEGORIES = ["Food", "Groceries", "Transportation", "Entertainment", "Electronics", "Bills", "Rent", "Other"];
const PERIOD_FILTERS = ["daily", "weekly", "monthly", "yearly", "all"];

const categoryKeywords = {
  Food: ["coffee", "lunch", "dinner", "burger", "restaurant", "pizza", "meal"],
  Groceries: ["milk", "eggs", "bread", "supermarket", "grocery", "produce"],
  Transportation: ["bus", "train", "taxi", "uber", "gas", "fuel", "lyft", "parking"],
  Entertainment: ["movie", "game", "netflix", "concert", "spotify"],
  Electronics: ["laptop", "phone", "charger", "headphones", "monitor", "keyboard"],
  Bills: ["electricity", "water", "internet", "phone bill", "bill", "insurance", "utility"],
  Rent: ["rent", "apartment", "lease", "landlord"],
};

let state = { inlineEditingId: null, transactionMap: new Map() };
let els = {};

const $ = (id) => document.getElementById(id);

function getTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTransactions(txns) { localStorage.setItem(STORAGE_KEY, JSON.stringify(txns)); }

function generateTransactionId() {
  return (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function categorize(description) {
  const text = description.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((k) => text.includes(k))) return category;
  }
  return "Other";
}

function parsePurchaseDateTime(dateStr, timeStr) {
  const d = new Date(`${dateStr}T${timeStr || "00:00"}:00`);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function splitDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  return { date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5) };
}

function normalizeTransaction(t) {
  const fallback = typeof t.createdAt === "string" ? t.createdAt : new Date().toISOString();
  const purchaseRaw = typeof t.purchaseAt === "string" ? t.purchaseAt : fallback;
  const purchase = new Date(purchaseRaw);
  return {
    id: t.id ?? generateTransactionId(),
    amount: Number.isFinite(Number(t.amount)) ? Number(t.amount) : 0,
    description: typeof t.description === "string" ? t.description : "",
    category: CATEGORIES.includes(t.category) ? t.category : "Other",
    purchaseAt: Number.isNaN(purchase.getTime()) ? new Date().toISOString() : purchase.toISOString(),
    createdAt: fallback,
  };
}

function formatCurrency(v) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v); }

function filterByPeriod(txns) {
  const period = PERIOD_FILTERS.includes(els.periodSelect.value) ? els.periodSelect.value : "all";
  if (period === "all") return txns;
  const now = new Date();
  return txns.filter((t) => {
    const d = new Date(t.purchaseAt);
    if (period === "daily") return d.toDateString() === now.toDateString();
    if (period === "weekly") return now.getTime() - d.getTime() <= 604800000 && now.getTime() >= d.getTime();
    if (period === "monthly") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    return d.getFullYear() === now.getFullYear();
  });
}

function sortedTxns(txns) {
  const factor = els.sortOrderSelect.value === "oldest" ? 1 : -1;
  return [...txns].sort((a, b) => (new Date(a.purchaseAt) - new Date(b.purchaseAt)) * factor);
}

function renderSummary(txns) {
  const filtered = filterByPeriod(txns);
  els.totalSpent.textContent = formatCurrency(filtered.reduce((s, t) => s + t.amount, 0));
  els.transactionCount.textContent = String(filtered.length);
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  filtered.forEach((t) => { totals[t.category] += t.amount; });
  els.categorySummary.innerHTML = "";
  CATEGORIES.forEach((c) => {
    const li = document.createElement("li");
    li.className = "flex justify-between rounded-md border border-slate-200 px-3 py-2 bg-white";
    li.textContent = `${c}: ${formatCurrency(totals[c])}`;
    els.categorySummary.appendChild(li);
  });
}

function renderInlineEditCard(li, transaction) {
  const dt = splitDateTime(transaction.purchaseAt);
  li.innerHTML = `
    <form class="w-full grid gap-3" data-inline-form="${transaction.id}">
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Amount ($)</label>
          <input name="amount" type="number" min="0" step="0.01" required value="${transaction.amount}" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Category</label>
          <select name="category" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            ${CATEGORIES.map((c) => `<option ${c === transaction.category ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <input name="description" type="text" required value="${transaction.description.replace(/"/g, "&quot;")}" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Date of Purchase</label>
          <input name="purchaseDate" type="date" required value="${dt.date}" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">Time of Purchase</label>
          <input name="purchaseTime" type="time" required value="${dt.time}" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div class="flex gap-2">
        <button type="submit" class="rounded-lg bg-blue-600 px-3 py-2 text-white text-sm">Save Changes</button>
        <button type="button" data-action="cancel-inline-edit" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">Cancel</button>
      </div>
    </form>
  `;
}

function renderTransactions(txns) {
  els.transactionList.innerHTML = "";
  els.emptyState.style.display = txns.length ? "none" : "block";
  txns.forEach((t) => {
    const li = document.createElement("li");
    li.className = "rounded-lg border border-slate-200 p-3 sm:p-4 bg-slate-50";

    if (state.inlineEditingId === t.id) {
      renderInlineEditCard(li, t);
      els.transactionList.appendChild(li);
      return;
    }

    const row = document.createElement("div");
    row.className = "flex items-start justify-between gap-4";

    const left = document.createElement("div");
    left.innerHTML = `<p class="font-semibold text-lg">${formatCurrency(t.amount)}</p><p>${t.description}</p><p class="text-sm text-slate-500">Category: ${t.category}</p><p class="text-sm text-slate-500">${new Date(t.purchaseAt).toLocaleString()}</p>`;
    const actions = document.createElement("div"); actions.className = "flex gap-2";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit";
    edit.className = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
    edit.dataset.action = "edit";
    edit.dataset.id = t.id;

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "Delete";
    del.className = "rounded-lg bg-rose-600 px-3 py-2 text-white text-sm";
    del.dataset.action = "delete";
    del.dataset.id = t.id;

    actions.append(edit, del);
    row.append(left, actions);
    li.appendChild(row);
    els.transactionList.appendChild(li);
  });
}

function render() {
  const txns = sortedTxns(getTransactions().map(normalizeTransaction));
  state.transactionMap = new Map(txns.map((txn) => [txn.id, txn]));
  renderTransactions(txns);
  renderSummary(txns);
}

function setDefaultDateTime() {
  const now = new Date();
  els.purchaseDate.value = now.toISOString().slice(0, 10);
  els.purchaseTime.value = now.toTimeString().slice(0, 5);
}

function bind() {
  els.description.addEventListener("input", () => {
    const c = categorize(els.description.value.trim());
    els.categoryPreview.textContent = `Category preview: ${c}`;
    els.category.value = c;
  });

  els.sortOrderSelect.addEventListener("change", render);
  els.periodSelect.addEventListener("change", render);

  els.transactionList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;

    if (action === "edit" && id) {
      state.inlineEditingId = id;
      render();
      return;
    }

    if (action === "cancel-inline-edit") {
      state.inlineEditingId = null;
      render();
      return;
    }

    if (action === "delete" && id) {
      saveTransactions(getTransactions().map(normalizeTransaction).filter((x) => x.id !== id));
      if (state.inlineEditingId === id) state.inlineEditingId = null;
      render();
    }
  });

  els.transactionList.addEventListener("submit", (event) => {
    const inlineForm = event.target.closest("form[data-inline-form]");
    if (!inlineForm) return;
    event.preventDefault();

    const id = inlineForm.dataset.inlineForm;
    const existing = state.transactionMap.get(id);
    if (!existing) return;

    const formData = new FormData(inlineForm);
    const amount = Number(formData.get("amount"));
    const description = String(formData.get("description") || "").trim();
    const category = String(formData.get("category") || "Other");
    const purchaseDate = String(formData.get("purchaseDate") || "");
    const purchaseTime = String(formData.get("purchaseTime") || "");

    if (!Number.isFinite(amount) || amount <= 0 || !description) return;

    const updated = {
      ...existing,
      amount,
      description,
      category: CATEGORIES.includes(category) ? category : categorize(description),
      purchaseAt: parsePurchaseDateTime(purchaseDate, purchaseTime),
    };

    const txns = getTransactions().map(normalizeTransaction).map((t) => (t.id === id ? updated : t));
    saveTransactions(txns);
    state.inlineEditingId = null;
    render();
  });

  $("open-advanced").addEventListener("click", () => { $("simple-mode").classList.add("hidden"); $("advanced-mode").classList.remove("hidden"); });
  $("back-simple").addEventListener("click", () => { $("advanced-mode").classList.add("hidden"); $("simple-mode").classList.remove("hidden"); });

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = Number(els.amount.value);
    const description = els.description.value.trim();
    if (!Number.isFinite(amount) || amount <= 0 || !description) return;

    const txns = getTransactions().map(normalizeTransaction);
    const next = [...txns, {
      id: generateTransactionId(),
      amount,
      description,
      category: CATEGORIES.includes(els.category.value) ? els.category.value : categorize(description),
      purchaseAt: parsePurchaseDateTime(els.purchaseDate.value, els.purchaseTime.value),
      createdAt: new Date().toISOString(),
    }];

    saveTransactions(next);
    els.form.reset();
    setDefaultDateTime();
    els.categoryPreview.textContent = "Category preview: Other";
    els.amount.focus();
    render();
  });
}

function init() {
  els = {
    form: $("transaction-form"), amount: $("amount"), description: $("description"), category: $("category"), purchaseDate: $("purchase-date"), purchaseTime: $("purchase-time"), categoryPreview: $("category-preview"), transactionList: $("transaction-list"), emptyState: $("empty-state"), totalSpent: $("total-spent"), transactionCount: $("transaction-count"), categorySummary: $("category-summary"), sortOrderSelect: $("sort-order"), periodSelect: $("summary-period")
  };
  if (Object.values(els).some((v) => !v)) return;
  setDefaultDateTime();
  bind();
  render();
}

init();
