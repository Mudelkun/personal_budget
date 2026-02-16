const BASE_URL = "http://localhost:3000";

const seedData = {
  budget: 2000,
  envelopes: [
    { name: "Groceries", amount: 400 },
    { name: "Rent", amount: 800 },
    { name: "Transportation", amount: 150 },
    { name: "Entertainment", amount: 100 },
    { name: "Utilities", amount: 200 },
  ],
  spendings: [
    { envelopeIndex: 0, name: "Walmart grocery run", amount: 85.5 },
    { envelopeIndex: 0, name: "Farmers market", amount: 32.0 },
    { envelopeIndex: 2, name: "Gas station", amount: 45.0 },
    { envelopeIndex: 3, name: "Movie tickets", amount: 28.0 },
    { envelopeIndex: 4, name: "Electric bill", amount: 95.0 },
  ],
};

async function seed() {
  console.log("Seeding database...\n");

  // 1. Set the budget
  const budgetRes = await fetch(`${BASE_URL}/budget`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ budget: seedData.budget }),
  });
  const budgetData = await budgetRes.json();
  console.log("Budget:", budgetData.budgetCents);

  // 2. Create envelopes
  const envelopeIds = [];
  for (const envelope of seedData.envelopes) {
    const res = await fetch(`${BASE_URL}/envelopes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: envelope.name, amount: envelope.amount }),
    });
    const { data } = await res.json();
    envelopeIds.push(data.id);
    console.log(`Envelope: ${data.name} (id: ${data.id})`);
  }

  // 3. Create spendings
  for (const spending of seedData.spendings) {
    const envelopeId = envelopeIds[spending.envelopeIndex];
    const res = await fetch(`${BASE_URL}/spendings/${envelopeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: spending.name, amount: spending.amount }),
    });
    await res.json();
    console.log(`Spending: ${spending.name} -> envelope ${envelopeId}`);
  }

  console.log("\nSeeding complete!");
}

seed().catch((err) => {
  console.error("Seed failed. Is the server running?");
  console.error(err.message);
  process.exit(1);
});
