// ============================================================
//  Personal Budget – Frontend Controller
//  Connects to the Express REST API for full CRUD operations
// ============================================================

const API = "";

// ---- Cached state ----
let envelopes = [];
let spendings = [];
let budgetCents = 0;

// ---- DOM refs ----
const $ = (sel) => document.getElementById(sel);

const elTotalBudget = $("total-budget");
const elAvailable = $("summary-available");
const elAllocated = $("summary-allocated");
const elSpent = $("summary-spent");
const elGrid = $("envelopes-grid");
const elEmpty = $("empty-state");

// Modals
const modalBudget = $("modal-set-budget");
const modalEnvelope = $("modal-create-envelope");
const modalEditEnvelope = $("modal-edit-envelope");
const modalSpending = $("modal-add-spending");
const modalDelete = $("modal-confirm-delete");

// Delete state
let pendingDelete = null;

// ============================================================
//  API helpers
// ============================================================

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { success: false, message: text };
  }
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

// ============================================================
//  Format helpers
// ============================================================

function centsToDollars(cents) {
  return (cents / 100).toFixed(2);
}

function formatMoney(cents) {
  const dollars = Math.abs(cents) / 100;
  const formatted = dollars.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return cents < 0 ? `-$${formatted}` : `$${formatted}`;
}

// ============================================================
//  Toast notifications
// ============================================================

function toast(message, type = "success") {
  const container = $("toast-container");
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ============================================================
//  Modal system
// ============================================================

function openModal(modal) {
  modal.classList.add("active");
  const firstInput = modal.querySelector("input:not([type=hidden]), select");
  if (firstInput) firstInput.focus();
}

function closeModal(modal) {
  modal.classList.remove("active");
  modal.querySelectorAll("input:not([type=hidden])").forEach((i) => (i.value = ""));
}

// Close on backdrop click or cancel
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal(overlay);
  });
  const cancel = overlay.querySelector(".btn-cancel");
  if (cancel) cancel.addEventListener("click", () => closeModal(overlay));
});

// Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.active").forEach(closeModal);
  }
});

// ============================================================
//  Data fetching
// ============================================================

async function fetchAll() {
  try {
    const [budgetRes, envelopesRes, spendingsRes] = await Promise.all([
      api("/budget"),
      api("/envelopes"),
      api("/spendings"),
    ]);
    budgetCents = budgetRes.budgetCents || 0;
    envelopes = envelopesRes.envelopes || [];
    spendings = spendingsRes.spendings || [];
  } catch (err) {
    // If no budget set yet, start fresh
    budgetCents = 0;
    envelopes = [];
    spendings = [];
  }
  render();
}

// ============================================================
//  Rendering
// ============================================================

function getEnvelopeSpendings(envelopeId) {
  return spendings.filter((s) => s.envelopeId === envelopeId);
}

function getEnvelopeSpentCents(envelopeId) {
  return getEnvelopeSpendings(envelopeId).reduce((sum, s) => sum + s.amountCents, 0);
}

function render() {
  // Summary calculations
  const totalAllocated = envelopes.reduce((sum, e) => sum + e.amountCents, 0);
  const totalSpent = spendings.reduce((sum, s) => sum + s.amountCents, 0);
  const available = budgetCents - totalAllocated;

  elTotalBudget.textContent = formatMoney(budgetCents);
  elAvailable.textContent = formatMoney(available);
  elAllocated.textContent = formatMoney(totalAllocated);
  elSpent.textContent = `-${formatMoney(totalSpent)}`;

  // Empty state
  if (envelopes.length === 0) {
    elGrid.innerHTML = "";
    elEmpty.classList.add("visible");
    return;
  }

  elEmpty.classList.remove("visible");

  // Build cards
  elGrid.innerHTML = envelopes
    .map((env) => {
      const envSpendings = getEnvelopeSpendings(env.id);
      const spentCents = envSpendings.reduce((s, sp) => s + sp.amountCents, 0);
      const remainingCents = env.amountCents - spentCents;
      const pct = env.amountCents > 0 ? (spentCents / env.amountCents) * 100 : 0;
      const barClass = pct >= 90 ? "danger" : pct >= 70 ? "warning" : "";

      const spendingsHTML =
        envSpendings.length > 0
          ? envSpendings
              .map(
                (sp) => `
              <div class="spending">
                <div class="spending-info">
                  <span>${escapeHTML(sp.name)}</span>
                </div>
                <span class="spending-amount">-${formatMoney(sp.amountCents)}</span>
                <button class="btn-delete-spending" data-spending-id="${sp.id}" data-spending-name="${escapeHTML(sp.name)}" title="Delete">&times;</button>
              </div>`
              )
              .join("")
          : '<p class="no-spendings">No spendings yet</p>';

      return `
        <div class="card" data-envelope-id="${env.id}">
          <div class="card-header">
            <h2>${escapeHTML(env.name)}</h2>
            <div class="card-amounts">
              ${spentCents > 0 ? `<span class="spent">-${formatMoney(spentCents)}</span>` : ""}
              <span class="balance">${formatMoney(remainingCents)}</span>
            </div>
          </div>

          <div class="progress-wrap">
            <div class="progress-bar ${barClass}" style="width: ${Math.min(pct, 100)}%"></div>
          </div>

          <div class="card-details">
            ${spendingsHTML}
            <div class="original">
              <span>Budget: ${formatMoney(env.amountCents)}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-edit" data-id="${env.id}">Edit</button>
            ${spentCents > 0 ? `<button class="btn-reset-envelope" data-id="${env.id}" data-name="${escapeHTML(env.name)}">Reset Spendings</button>` : ""}
            <button class="btn-delete-envelope" data-id="${env.id}" data-name="${escapeHTML(env.name)}">Delete</button>
          </div>
        </div>`;
    })
    .join("");
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
//  Event delegation for dynamic cards
// ============================================================

elGrid.addEventListener("click", (e) => {
  // Edit envelope
  const editBtn = e.target.closest(".btn-edit");
  if (editBtn) {
    const id = Number(editBtn.dataset.id);
    const env = envelopes.find((e) => e.id === id);
    if (!env) return;
    $("edit-envelope-id").value = id;
    $("edit-envelope-name").value = env.name;
    $("edit-envelope-budget").value = centsToDollars(env.amountCents);
    openModal(modalEditEnvelope);
    return;
  }

  // Reset spendings for envelope
  const resetEnvBtn = e.target.closest(".btn-reset-envelope");
  if (resetEnvBtn) {
    const id = Number(resetEnvBtn.dataset.id);
    const name = resetEnvBtn.dataset.name;
    $("delete-title").textContent = `Reset "${name}" spendings?`;
    $("delete-message").textContent =
      "This will delete all spendings for this envelope. The envelope budget stays the same.";
    pendingDelete = { type: "reset-envelope", id };
    openModal(modalDelete);
    return;
  }

  // Delete envelope
  const deleteEnvBtn = e.target.closest(".btn-delete-envelope");
  if (deleteEnvBtn) {
    const id = Number(deleteEnvBtn.dataset.id);
    const name = deleteEnvBtn.dataset.name;
    $("delete-title").textContent = `Delete "${name}"?`;
    $("delete-message").textContent =
      "This will permanently delete this envelope and all its spendings.";
    pendingDelete = { type: "envelope", id };
    openModal(modalDelete);
    return;
  }

  // Delete spending
  const deleteSpBtn = e.target.closest(".btn-delete-spending");
  if (deleteSpBtn) {
    const id = Number(deleteSpBtn.dataset.spendingId);
    const name = deleteSpBtn.dataset.spendingName;
    $("delete-title").textContent = `Delete spending?`;
    $("delete-message").textContent = `Remove "${name}" from this envelope?`;
    pendingDelete = { type: "spending", id };
    openModal(modalDelete);
    return;
  }
});

// ============================================================
//  Action: Reset All Spendings
// ============================================================

$("btn-reset-spendings").addEventListener("click", () => {
  $("delete-title").textContent = "Reset all spendings?";
  $("delete-message").textContent =
    "This will delete every spending across all envelopes. Your envelopes and budget stay the same.";
  pendingDelete = { type: "reset-all" };
  openModal(modalDelete);
});

// ============================================================
//  Action: Set Budget
// ============================================================

$("btn-set-budget").addEventListener("click", () => {
  // Pre-fill current budget
  if (budgetCents > 0) {
    $("budget-amount").value = centsToDollars(budgetCents);
  }
  openModal(modalBudget);
});

$("confirm-budget").addEventListener("click", async () => {
  const amount = parseFloat($("budget-amount").value);
  if (!amount || amount <= 0) return;
  try {
    const res = await api("/budget", {
      method: "POST",
      body: JSON.stringify({ budget: amount }),
    });
    budgetCents = res.budgetCents;
    closeModal(modalBudget);
    toast("Budget updated");
    render();
  } catch (err) {
    toast(err.message, "error");
  }
});

// ============================================================
//  Action: Create Envelope
// ============================================================

$("btn-create-envelope").addEventListener("click", () => openModal(modalEnvelope));

$("confirm-envelope").addEventListener("click", async () => {
  const name = $("envelope-name").value.trim();
  const amount = parseFloat($("envelope-budget").value);
  if (!name || !amount || amount <= 0) return;
  try {
    const res = await api("/envelopes", {
      method: "POST",
      body: JSON.stringify({ name, amount }),
    });
    envelopes.push(res.data);
    closeModal(modalEnvelope);
    toast(`"${name}" envelope created`);
    render();
  } catch (err) {
    toast(err.message, "error");
  }
});

// ============================================================
//  Action: Edit Envelope
// ============================================================

$("confirm-edit-envelope").addEventListener("click", async () => {
  const id = Number($("edit-envelope-id").value);
  const name = $("edit-envelope-name").value.trim();
  const amount = parseFloat($("edit-envelope-budget").value);
  if (!name || !amount || amount <= 0) return;
  try {
    const res = await api(`/envelopes/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, amount }),
    });
    const idx = envelopes.findIndex((e) => e.id === id);
    if (idx !== -1) envelopes[idx] = res.updatedEnvelope;
    closeModal(modalEditEnvelope);
    toast(`"${name}" updated`);
    render();
  } catch (err) {
    toast(err.message, "error");
  }
});

// ============================================================
//  Action: Add Spending
// ============================================================

$("btn-add-spending").addEventListener("click", () => {
  populateEnvelopeSelect();
  openModal(modalSpending);
});

function populateEnvelopeSelect() {
  const sel = $("spending-envelope");
  sel.innerHTML = "";
  envelopes.forEach((env) => {
    const opt = document.createElement("option");
    opt.value = env.id;
    opt.textContent = env.name;
    sel.appendChild(opt);
  });
}

$("confirm-spending").addEventListener("click", async () => {
  const envelopeId = $("spending-envelope").value;
  const name = $("spending-name").value.trim();
  const amount = parseFloat($("spending-amount").value);
  if (!envelopeId || !name || !amount || amount <= 0) return;
  try {
    const res = await api(`/spendings/${envelopeId}`, {
      method: "POST",
      body: JSON.stringify({ name, amount }),
    });
    spendings.push(res.spending);
    closeModal(modalSpending);
    toast(`Spending added to envelope`);
    render();
  } catch (err) {
    toast(err.message, "error");
  }
});

// ============================================================
//  Action: Delete (envelope or spending)
// ============================================================

$("confirm-delete").addEventListener("click", async () => {
  if (!pendingDelete) return;
  const { type, id } = pendingDelete;
  try {
    if (type === "envelope") {
      await api(`/envelopes/${id}`, { method: "DELETE" });
      envelopes = envelopes.filter((e) => e.id !== id);
      spendings = spendings.filter((s) => s.envelopeId !== id);
      toast("Envelope deleted");
    } else if (type === "spending") {
      await api(`/spendings/${id}`, { method: "DELETE" });
      spendings = spendings.filter((s) => s.id !== id);
      toast("Spending deleted");
    } else if (type === "reset-envelope") {
      await api(`/spendings/All/${id}`, { method: "DELETE" });
      spendings = spendings.filter((s) => s.envelopeId !== id);
      toast("Envelope spendings reset");
    } else if (type === "reset-all") {
      await api("/spendings", { method: "DELETE" });
      spendings = [];
      toast("All spendings reset");
    }
    pendingDelete = null;
    closeModal(modalDelete);
    render();
  } catch (err) {
    toast(err.message, "error");
  }
});

// ============================================================
//  Enter key submits modals
// ============================================================

function onEnter(inputId, handler) {
  $(inputId).addEventListener("keydown", (e) => {
    if (e.key === "Enter") handler();
  });
}

onEnter("budget-amount", () => $("confirm-budget").click());
onEnter("envelope-name", () => $("confirm-envelope").click());
onEnter("envelope-budget", () => $("confirm-envelope").click());
onEnter("edit-envelope-name", () => $("confirm-edit-envelope").click());
onEnter("edit-envelope-budget", () => $("confirm-edit-envelope").click());
onEnter("spending-name", () => $("confirm-spending").click());
onEnter("spending-amount", () => $("confirm-spending").click());

// ============================================================
//  Boot
// ============================================================

fetchAll();
