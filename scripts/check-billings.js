const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function check() {
  const res = await fetch("http://localhost:3000/api/billings");
  if (res.ok) {
    const data = await res.json();
    console.log(JSON.stringify(data.data.slice(0, 5), null, 2));
  } else {
    console.log("Failed to fetch billings");
  }
}

check();
