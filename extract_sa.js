const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const email = env.match(/FIREBASE_ADMIN_CLIENT_EMAIL=(.*)/)[1].trim();
const pk = env.match(/FIREBASE_ADMIN_PRIVATE_KEY="(.*)"/)[1].replace(/\\n/g, '\n');
const pid = env.match(/FIREBASE_ADMIN_PROJECT_ID=(.*)/)[1].trim();
const sa = { client_email: email, private_key: pk, project_id: pid };
fs.writeFileSync('sa.json', JSON.stringify(sa));
console.log('Done.');
