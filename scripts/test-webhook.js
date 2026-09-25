const crypto = require('crypto');

// Ambil secret dari .env.local
const secret = "30f1ae9cca24f3c67d6d44a46b591c22275b31c26cdf3dd7dc94e214d30300cd80082a280c3f31acd08045c4f8711d4045dcd4112eb295af3bad87dc82397c88";

const mayarInvoiceId = process.argv[2];

if (!mayarInvoiceId) {
  console.error("Harap masukkan Mayar Invoice ID! Contoh: node test-webhook.js inv_123");
  process.exit(1);
}

const payload = JSON.stringify({
  event: "payment.received",
  data: {
    id: mayarInvoiceId,
    paidAt: new Date().toISOString(),
    paymentMethod: "BCA Virtual Account",
    paymentChannel: "BCA"
  }
});

const signature = crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("hex");

fetch('http://localhost:3000/api/webhooks/mayar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-mayar-signature': signature
  },
  body: payload
})
.then(r => r.json())
.then(res => {
  console.log("Response dari Webhook:", res);
})
.catch(console.error);
