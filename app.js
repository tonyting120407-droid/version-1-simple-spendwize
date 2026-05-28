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
let categoryPreview;
let transactionList;
let emptyState;
let totalSpentElement;
let transactionCountElement;
let categorySummaryElement;

function getTransactions() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

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

function formatDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return date.toLocaleString();
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
  const createdAt = typeof transaction.createdAt === "string" ? transaction.createdAt : new Date().toISOString();

  return {
    id: transaction.id ?? generateTransactionId(),
    amount,
    description,
    category,
    createdAt,
  };
}

function deleteTransaction(id) {
  const transactions = getTransactions().filter((transaction) => transaction.id !== id);
  saveTransactions(transactions);
  render();
}


function initElements() {
  form = document.getElementById("transaction-form");
  amountInput = document.getElementById("amount");
  descriptionInput = document.getElementById("description");
  categoryPreview = document.getElementById("category-preview");
  transactionList = document.getElementById("transaction-list");
  emptyState = document.getElementById("empty-state");
  totalSpentElement = document.getElementById("total-spent");
  transactionCountElement = document.getElementById("transaction-count");
  categorySummaryElement = document.getElementById("category-summary");

  return Boolean(
    form && amountInput && descriptionInput && categoryPreview &&
    transactionList && emptyState && totalSpentElement &&
    transactionCountElement && categorySummaryElement
  );
}

function renderTransactions(transactions) {
  transactionList.innerHTML = "";
  emptyState.style.display = transactions.length ? "none" : "block";

  transactions.forEach((transaction) => {
    const li = document.createElement("li");
    li.className = "rounded-lg border border-slate-200 p-3 sm:p-4 bg-slate-50 flex items-start justify-between gap-4";

    const details = document.createElement("div");

    const amountLine = document.createElement("p");
    amountLine.className = "font-semibold text-lg";
    amountLine.textContent = formatCurrency(transaction.amount);

    const descriptionLine = document.createElement("p");
    descriptionLine.className = "text-slate-700";
    descriptionLine.textContent = transaction.description;

    const categoryLine = document.createElement("p");
    categoryLine.className = "text-sm text-slate-500";
    categoryLine.textContent = `Category: ${transaction.category}`;

    const dateLine = document.createElement("p");
    dateLine.className = "text-sm text-slate-500";
    dateLine.textContent = `Date: ${formatDate(transaction.createdAt)}`;

    details.append(amountLine, descriptionLine, categoryLine, dateLine);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "rounded-lg bg-rose-600 px-3 py-2 text-white text-sm font-medium hover:bg-rose-700 transition";
    deleteButton.addEventListener("click", () => deleteTransaction(transaction.id));

    li.append(details, deleteButton);
    transactionList.appendChild(li);
  });
}

function renderSummary(transactions) {
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  totalSpentElement.textContent = formatCurrency(total);
  transactionCountElement.textContent = String(transactions.length);

  const totalsByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category] = 0;
    return acc;
  }, {});

  transactions.forEach((transaction) => {
    const category = CATEGORIES.includes(transaction.category) ? transaction.category : "Other";
    totalsByCategory[category] += transaction.amount;
  });

  categorySummaryElement.innerHTML = "";
  CATEGORIES.forEach((category) => {
    const amount = totalsByCategory[category];
    const item = document.createElement("li");
    item.className = "flex justify-between rounded-md border border-slate-200 px-3 py-2 bg-white";
    const categoryName = document.createElement("span");
    categoryName.textContent = category;
    const categoryAmount = document.createElement("span");
    categoryAmount.className = "font-medium";
    categoryAmount.textContent = formatCurrency(amount);
    item.append(categoryName, categoryAmount);
    categorySummaryElement.appendChild(item);
  });
}

function render() {
  const transactions = getTransactions().map(normalizeTransaction);
  renderTransactions(transactions);
  renderSummary(transactions);
}

function bindEvents() {
  descriptionInput.addEventListener("input", () => {
    const nextCategory = categorize(descriptionInput.value.trim());
    categoryPreview.textContent = `Category preview: ${nextCategory}`;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const amount = Number(amountInput.value);
    const description = descriptionInput.value.trim();

    if (!Number.isFinite(amount) || amount <= 0 || !description) {
      return;
    }

    const transaction = {
      id: generateTransactionId(),
      amount,
      description,
      category: categorize(description),
      createdAt: new Date().toISOString(),
    };

    const transactions = getTransactions().map(normalizeTransaction);
    transactions.unshift(transaction);
    saveTransactions(transactions);

    form.reset();
    categoryPreview.textContent = "Category preview: Other";
    render();
  });
}

if (initElements()) {
  bindEvents();
  render();
}
