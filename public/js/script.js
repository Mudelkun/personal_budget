// --- DOM refs ---
const btnCreateEnvelope = document.getElementById("btn-create-envelope");
const btnSetBudget = document.getElementById("btn-set-budget");
const btnAddSpending = document.getElementById("btn-add-spending");

const modalSetBudget = document.getElementById("modal-set-budget");
const modalCreateEnvelope = document.getElementById("modal-create-envelope");
const modalAddSpending = document.getElementById("modal-add-spending");

const spendingEnvelopeSelect = document.getElementById("spending-envelope");

// --- Helpers ---

function openModal(modal) {
  modal.classList.add("active");
  // Focus the first input/select inside the modal
  const firstInput = modal.querySelector("input, select");
  if (firstInput) firstInput.focus();
}

function closeModal(modal) {
  modal.classList.remove("active");
  // Reset all inputs inside
  modal.querySelectorAll("input").forEach((input) => (input.value = ""));
}

function populateEnvelopeSelect() {
  spendingEnvelopeSelect.innerHTML = "";
  const envelopes = document.querySelectorAll(".envelopes .card-header h2");
  envelopes.forEach((h2) => {
    const option = document.createElement("option");
    option.value = h2.textContent;
    option.textContent = h2.textContent;
    spendingEnvelopeSelect.appendChild(option);
  });
}

// --- Button click → open modal ---

btnSetBudget.addEventListener("click", () => openModal(modalSetBudget));

btnCreateEnvelope.addEventListener("click", () =>
  openModal(modalCreateEnvelope),
);

btnAddSpending.addEventListener("click", () => {
  populateEnvelopeSelect();
  openModal(modalAddSpending);
});

// --- Cancel / overlay click → close modal ---

document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  // Click on dark backdrop
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal(overlay);
  });

  // Cancel button
  overlay.querySelector(".btn-cancel").addEventListener("click", () => {
    closeModal(overlay);
  });
});

// --- Escape key closes any open modal ---

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.active").forEach(closeModal);
  }
});

// --- Confirm handlers (placeholders for now – just close) ---

modalSetBudget.querySelector(".btn-confirm").addEventListener("click", () => {
  const amount = document.getElementById("budget-amount").value;
  if (!amount) return;
  // console.log("Set budget:", amount);
  closeModal(modalSetBudget);
});

modalCreateEnvelope
  .querySelector(".btn-confirm")
  .addEventListener("click", () => {
    const name = document.getElementById("envelope-name").value.trim();
    const budget = document.getElementById("envelope-budget").value;
    if (!name || !budget) return;
    // console.log("Create envelope:", name, budget);
    closeModal(modalCreateEnvelope);
  });

modalAddSpending.querySelector(".btn-confirm").addEventListener("click", () => {
  const envelope = document.getElementById("spending-envelope").value;
  const name = document.getElementById("spending-name").value.trim();
  const amount = document.getElementById("spending-amount").value;
  if (!envelope || !name || !amount) return;
  console.log("Add spending:", envelope, name, amount);
  closeModal(modalAddSpending);
});
