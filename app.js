const STORAGE_KEY = "spendwise_transactions";

const form = document.getElementById("transaction-form");
const amountInput = document.getElementById("amount");
const descriptionInput = document.getElementById("description");
const transactionList = document.getElementById("transaction-list");
const emptyState = document.getElementById("empty-state");

const categoryKeywords = {
  Food: ["restaurant", "pizza", "burger", "coffee", "snack", "meal", "lunch", "dinner"],
  Groceries: ["grocery", "supermarket", "walmart", "costco", "produce", "milk", "eggs"],
  Transportation: ["uber", "lyft", "bus", "train", "gas", "fuel", "taxi", "parking"],
  Entertainment: ["movie", "netflix", "concert", "game", "spotify", "theater"],
  Electronics: ["laptop", "phone", "headphones", "charger", "tv", "monitor", "keyboard"],
  Bills: ["bill", "electric", "water", "internet", "insurance", "subscription", "utility"],
  Rent: ["rent", "landlord", "apartment", "lease"],
};

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

function renderTransactions() {
  const transactions = getTransactions();
  transactionList.innerHTML = "";

  emptyState.style.display = transactions.length === 0 ? "block" : "none";

  transactions.forEach((transaction) => {
    const li = document.createElement("li");
    li.className = "transaction-item";

    const content = document.createElement("div");
    content.innerHTML = `
      <strong>$${transaction.amount.toFixed(2)}</strong> - ${transaction.description}<br />
      <span class="meta">Category: ${transaction.category}</span>
    `;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      deleteTransaction(transaction.id);
    });

    li.appendChild(content);
    li.appendChild(deleteButton);
    transactionList.appendChild(li);
  });
}

function deleteTransaction(id) {
  const transactions = getTransactions().filter((transaction) => transaction.id !== id);
  saveTransactions(transactions);
  renderTransactions();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(amountInput.value);
  const description = descriptionInput.value.trim();

  if (!amount || !description) {
    return;
  }

  const transaction = {
    id: Date.now(),
    amount,
    description,
    category: categorize(description),
  };

  const transactions = getTransactions();
  transactions.unshift(transaction);
  saveTransactions(transactions);

  form.reset();
  renderTransactions();
});

renderTransactions();
