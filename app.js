const STORAGE_KEY = "spendwise_transactions";

const CATEGORIES = [
  "Food",
  "Groceries",
  "Transportation",
  "Entertainment",
  "Electronics",
  "Bills",
  "Rent",
  "Other",
];

const PERIOD_FILTERS = ["daily", "weekly", "monthly", "yearly", "all"];
const SORT_OPTIONS = ["newest", "oldest"];

const categoryKeywords = {
  Food: ["coffee", "lunch", "dinner", "burger", "restaurant", "pizza", "meal"],
  Groceries: ["milk", "eggs", "bread", "supermarket", "grocery", "produce"],
  Transportation: ["bus", "train", "taxi", "uber", "gas", "fuel", "lyft", "parking"],
  Entertainment: ["movie", "game", "netflix", "concert", "spotify"],
  Electronics: ["laptop", "phone", "charger", "headphones", "monitor", "keyboard"],
  Bills: ["electricity", "water", "internet", "phone bill", "bill", "insurance", "utility"],
  Rent: ["rent", "apartment", "lease", "landlord"],
};

let form;
let amountInput;
let descriptionInput;
let purchaseDateInput;
let purchaseTimeInput;
let categoryPreview;
let transactionList;
let emptyState;
let totalSpentElement;
let transactionCountElement;
let categorySummaryElement;
let formMessage;
let sortOrderSelect;
let periodSelect;

function getTransactions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function categorize(description) {
  const text = description.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return "Other";
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(dateISO) {
  const date = new Date(dateISO);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString();
}

function formatTime(dateISO) {
  const date = new Date(dateISO);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parsePurchaseDateTime(dateStr, timeStr) {
  if (!dateStr) return new Date().toISOString();
  const combined = `${dateStr}T${timeStr || "00:00"}:00`;
  const date = new Date(combined);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function setDefaultPurchaseDateTime() {
  const now = new Date();
  purchaseDateInput.value = now.toISOString().slice(0, 10);
  purchaseTimeInput.value = now.toTimeString().slice(0, 5);
}

function generateTransactionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTransaction(transaction) {
  const amountNumber = Number(transaction.amount);
  const amount = Number.isFinite(amountNumber) ? amountNumber : 0;
  const description = typeof transaction.description === "string" ? transaction.description : "";
  const category = CATEGORIES.includes(transaction.category) ? transaction.category : "Other";

  // backward compatibility: if purchaseAt missing, fall back to createdAt
  const fallback = typeof transaction.createdAt === "string" ? transaction.createdAt : new Date().toISOString();
  const purchaseAtRaw = typeof transaction.purchaseAt === "string" ? transaction.purchaseAt : fallback;
  const purchaseAtDate = new Date(purchaseAtRaw);
  const purchaseAt = Number.isNaN(purchaseAtDate.getTime()) ? new Date().toISOString() : purchaseAtDate.toISOString();

  return {
    id: transaction.id ?? generateTransactionId(),
    amount,
    description,
    category,
    purchaseAt,
    createdAt: fallback,
  };
}

function sortTransactions(transactions) {
  const sortValue = SORT_OPTIONS.includes(sortOrderSelect.value) ? sortOrderSelect.value : "newest";
  const dir = sortValue === "oldest" ? 1 : -1;
  return [...transactions].sort((a, b) => (new Date(a.purchaseAt).getTime() - new Date(b.purchaseAt).getTime()) * dir);
}

function filterTransactionsByPeriod(transactions) {
  const period = PERIOD_FILTERS.includes(periodSelect.value) ? periodSelect.value : "all";
  if (period === "all") return transactions;

  const now = new Date();
  return transactions.filter((transaction) => {
    const purchaseDate = new Date(transaction.purchaseAt);
    if (Number.isNaN(purchaseDate.getTime())) return false;

    if (period === "daily") {
      return purchaseDate.toDateString() === now.toDateString();
    }

    if (period === "weekly") {
      const diff = now.getTime() - purchaseDate.getTime();
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    }

    if (period === "monthly") {
      return purchaseDate.getFullYear() === now.getFullYear() && purchaseDate.getMonth() === now.getMonth();
    }

    return purchaseDate.getFullYear() === now.getFullYear();
  });
}

function setFormMessage(message = "") {
  formMessage.textContent = message;
  formMessage.classList.toggle("hidden", !message);
}

function deleteTransaction(id) {
  const transactions = getTransactions().map(normalizeTransaction).filter((transaction) => transaction.id !== id);
  saveTransactions(transactions);
  render();
}

function renderTransactions(transactions) {
  transactionList.innerHTML = "";
  emptyState.style.display = transactions.length ? "none" : "block";

  transactions.forEach((transaction) => {
    const li = document.createElement("li");
    li.className = "rounded-lg border border-slate-200 p-3 sm:p-4 bg-slate-50 flex items-start justify-between gap-4";

    const details = document.createElement("div");
    details.innerHTML = `
      <p class="font-semibold text-lg">${formatCurrency(transaction.amount)}</p>
      <p class="text-slate-700">${transaction.description}</p>
      <p class="text-sm text-slate-500">Category: ${transaction.category}</p>
      <p class="text-sm text-slate-500">Purchase Date: ${formatDate(transaction.purchaseAt)}</p>
      <p class="text-sm text-slate-500">Purchase Time: ${formatTime(transaction.purchaseAt)}</p>
    `;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "rounded-lg bg-rose-600 px-3 py-2 text-white text-sm font-medium hover:bg-rose-700 transition";
    deleteButton.addEventListener("click", () => deleteTransaction(transaction.id));

    li.append(details, deleteButton);
    transactionList.appendChild(li);
  });
}

function renderSummary(filteredTransactions) {
  const total = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  totalSpentElement.textContent = formatCurrency(total);
  transactionCountElement.textContent = String(filteredTransactions.length);

  const totalsByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {});

  filteredTransactions.forEach((transaction) => {
    totalsByCategory[transaction.category] += transaction.amount;
  });

  categorySummaryElement.innerHTML = "";
  CATEGORIES.forEach((category) => {
    const item = document.createElement("li");
    item.className = "flex justify-between rounded-md border border-slate-200 px-3 py-2 bg-white";
    const left = document.createElement("span");
    left.textContent = category;
    const right = document.createElement("span");
    right.className = "font-medium";
    right.textContent = formatCurrency(totalsByCategory[category]);
    item.append(left, right);
    categorySummaryElement.appendChild(item);
  });
}

function render() {
  const normalized = getTransactions().map(normalizeTransaction);
  const sorted = sortTransactions(normalized);
  renderTransactions(sorted);
  const filtered = filterTransactionsByPeriod(sorted);
  renderSummary(filtered);
}

function initElements() {
  form = document.getElementById("transaction-form");
  amountInput = document.getElementById("amount");
  descriptionInput = document.getElementById("description");
  purchaseDateInput = document.getElementById("purchase-date");
  purchaseTimeInput = document.getElementById("purchase-time");
  categoryPreview = document.getElementById("category-preview");
  transactionList = document.getElementById("transaction-list");
  emptyState = document.getElementById("empty-state");
  totalSpentElement = document.getElementById("total-spent");
  transactionCountElement = document.getElementById("transaction-count");
  categorySummaryElement = document.getElementById("category-summary");
  formMessage = document.getElementById("form-message");
  sortOrderSelect = document.getElementById("sort-order");
  periodSelect = document.getElementById("summary-period");

  return Boolean(
    form && amountInput && descriptionInput && purchaseDateInput && purchaseTimeInput &&
    categoryPreview && transactionList && emptyState && totalSpentElement &&
    transactionCountElement && categorySummaryElement && formMessage && sortOrderSelect && periodSelect
  );
}

function bindEvents() {
  descriptionInput.addEventListener("input", () => {
    setFormMessage("");
    categoryPreview.textContent = `Category preview: ${categorize(descriptionInput.value.trim())}`;
  });

  sortOrderSelect.addEventListener("change", render);
  periodSelect.addEventListener("change", render);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const amount = Number(amountInput.value);
    const description = descriptionInput.value.trim();
    const purchaseAt = parsePurchaseDateTime(purchaseDateInput.value, purchaseTimeInput.value);

    if (!Number.isFinite(amount) || amount <= 0 || !description) {
      setFormMessage("Please enter a valid amount greater than 0 and a description.");
      return;
    }

    const transaction = {
      id: generateTransactionId(),
      amount,
      description,
      category: categorize(description),
      purchaseAt,
      createdAt: new Date().toISOString(),
    };

    const transactions = getTransactions().map(normalizeTransaction);
    transactions.push(transaction);
    saveTransactions(transactions);

    form.reset();
    setDefaultPurchaseDateTime();
    categoryPreview.textContent = "Category preview: Other";
    setFormMessage("");
    amountInput.focus();
    render();
  });
}

if (initElements()) {
  setDefaultPurchaseDateTime();
  bindEvents();
  render();
}
