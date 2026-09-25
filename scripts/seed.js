const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Minimal credentials for local emulator or using default ADC if available
// Actually, since we're in the same directory, we can use fetch to localhost:3000 to trigger the API routes we already built!

async function seed() {
  console.log("Seeding Dummy Catalog...");
  const catalogRes = await fetch("http://localhost:3000/api/catalogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Jasa Desain Grafis Premium",
      category: "Design",
      description: "Pembuatan logo dan identitas visual perusahaan.",
      icon: "🎨",
      color: "from-purple-500 to-pink-500"
    })
  });
  const catalogJson = await catalogRes.json();
  console.log("Catalog Response:", catalogJson);

  // Since we might not have a POST /api/clients yet, let's just log
  console.log("Seeding Dummy Client (Using API)...");
  const clientRes = await fetch("http://localhost:3000/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Budi Santoso",
      email: "budi@example.com",
      phone: "08123456789",
      type: "private",
      organization: "PT Budi Maju",
      address: "Jl. Sudirman No 1",
      npwp: "12.345.678.9-000.000"
    })
  });
  
  if (clientRes.ok) {
     const clientJson = await clientRes.json();
     console.log("Client Response:", clientJson);
  } else {
     console.log("API /api/clients POST not implemented yet or failed. We will create a direct admin script instead.");
  }
}

seed();
