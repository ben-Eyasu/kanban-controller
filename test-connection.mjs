const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/DATABASE_URL="(.+)"/);
if (match) {
  const url = match[1];
  console.log('URL found, length:', url.length);
  const sql = neon(url);
  sql`SELECT 1 as test`.then((r: any) => { console.log('Connected!', r); process.exit(0); }).catch((e: any) => { console.log('Error:', e.message); process.exit(1); });
} else {
  console.log('DATABASE_URL not found');
  process.exit(1);
}
