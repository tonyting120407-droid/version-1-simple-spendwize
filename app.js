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

const form = document.getElementById("transaction-form");
const amountInput = document.getElementById("amount");
const descriptionInput = document.getElementById("description");
const categoryPreview = document.getElementById("category-preview");
const transactionList = document.getElementById("transaction-list");
const emptyState = document.getElementById("empty-state");
const totalSpentElement = document.getElementById("total-spent");
const transactionCountElement = document.getElementById("transaction-count");
const categorySummaryElement = document.getElementById("category-summary");

function getTransactions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
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
  return new Date(isoDate).toLocaleString();
}

function deleteTransaction(id) {
  const transactions = getTransactions().filter((transaction) => transaction.id !== id);
  saveTransactions(transactions);
  render();
}

function renderTransactions(transactions) {
  transactionList.innerHTML = "";
  emptyState.style.display = transactions.length ? "none" : "block";

  transactions.forEach((transaction) => {
    const li = document.createElement("li");
    li.className = "rounded-lg border border-slate-200 p-3 sm:p-4 bg-slate-50 flex items-start justify-between gap-4";

    li.innerHTML = `
      <div>
        <p class="font-semibold text-lg">${formatCurrency(transaction.amount)}</p>
        <p class="text-slate-700">${transaction.description}</p>
        <p class="text-sm text-slate-500">Category: ${transaction.category}</p>
        <p class="text-sm text-slate-500">Date: ${formatDate(transaction.createdAt)}</p>
      </div>
    `;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "rounded-lg bg-rose-600 px-3 py-2 text-white text-sm font-medium hover:bg-rose-700 transition";
    deleteButton.addEventListener("click", () => deleteTransaction(transaction.id));

    li.appendChild(deleteButton);
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
    totalsByCategory[transaction.category] += transaction.amount;
  });

  categorySummaryElement.innerHTML = "";
  CATEGORIES.forEach((category) => {
    const amount = totalsByCategory[category];
    const item = document.createElement("li");
    item.className = "flex justify-between rounded-md border border-slate-200 px-3 py-2 bg-white";
    item.innerHTML = `<span>${category}</span><span class="font-medium">${formatCurrency(amount)}</span>`;
    categorySummaryElement.appendChild(item);
  });
}

function render() {
  const transactions = getTransactions();
  renderTransactions(transactions);
  renderSummary(transactions);
}

descriptionInput.addEventListener("input", () => {
  const nextCategory = categorize(descriptionInput.value.trim());
  categoryPreview.textContent = `Category preview: ${nextCategory}`;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(amountInput.value);
  const description = descriptionInput.value.trim();

  if (amount <= 0 || !description) {
    return;
  }

  const transaction = {
    id: crypto.randomUUID(),
    amount,
    description,
    category: categorize(description),
    createdAt: new Date().toISOString(),
  };

  const transactions = getTransactions();
  transactions.unshift(transaction);
  saveTransactions(transactions);

  form.reset();
  categoryPreview.textContent = "Category preview: Other";
  render();
});

render();
