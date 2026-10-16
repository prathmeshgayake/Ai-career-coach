const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, '..', 'server', 'firebase-key.json');
const envPath = path.join(__dirname, '..', 'server', '.env');

if (!fs.existsSync(keyPath)) {
  console.error('Key file not found at:', keyPath);
  process.exit(1);
}

const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
let env = fs.readFileSync(envPath, 'utf8');

env = env.replace(/^FIREBASE_PROJECT_ID=.*$/m, `FIREBASE_PROJECT_ID=${key.project_id}`);
env = env.replace(/^FIREBASE_CLIENT_EMAIL=.*$/m, `FIREBASE_CLIENT_EMAIL=${key.client_email}`);

const escapedKey = key.private_key.split('\n').join('\\n');
env = env.replace(/^FIREBASE_PRIVATE_KEY=.*$/m, `FIREBASE_PRIVATE_KEY="${escapedKey}"`);

fs.writeFileSync(envPath, env, 'utf8');
console.log('Successfully updated server/.env with Firebase credentials!');
