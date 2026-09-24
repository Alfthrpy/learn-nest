const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envName = process.env.E2E_ENV || 'dev';
const envFile = path.resolve(__dirname, '..', `.env.e2e.${envName}`);

if (!fs.existsSync(envFile)) {
  throw new Error(
    `E2E env profile "${envName}" not found: ${envFile}\n` +
      `Available profiles: ${fs
        .readdirSync(path.resolve(__dirname, '..'))
        .filter((f) => f.startsWith('.env.e2e.'))
        .map((f) => f.replace('.env.e2e.', ''))
        .join(', ')}`,
  );
}

dotenv.config({ path: envFile });
