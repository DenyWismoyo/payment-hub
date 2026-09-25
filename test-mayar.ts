import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const API_KEY = process.env.MAYAR_API_KEY;
const BASE_URL = process.env.MAYAR_API_BASE_URL || "https://api.mayar.id/hl/v2";

async function testEndpoint(endpoint: string) {
  console.log(`\nTesting ${endpoint}...`);
  const payload = {
    name: "John Doe Test",
    email: "johndoe@example.com",
    mobile: "081234567890",
    description: "Test Invoice from Payment Hub",
    items: [{ quantity: 1, rate: 10000, description: "Test item" }]
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  console.log(`Status: ${response.status}`);
  const text = await response.text();
  console.log(`Response: ${text.substring(0, 200)}`);
}

async function run() {
  await testEndpoint("/invoices/create");
  await testEndpoint("/invoice/create");
  await testEndpoint("/payment/create");
}

run();
