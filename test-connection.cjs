const { neon } = require('@neondatabase/serverless');

// Parse the URL manually to debug
const rawUrl = 'postgresql://neondb_owner:npg_Fl7yKre4McDf@ep-wandering-sunset-adnnkv76-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=required&channel_binding=required';

// Try 1: Direct URL as-is
console.log('=== Try 1: Direct URL ===');
let sql = neon(rawUrl);
sql`SELECT 1 as test`.then(r => { console.log('Try 1 SUCCESS:', JSON.stringify(r)); process.exit(0); }).catch(e => { console.log('Try 1 FAIL:', e.message);

  // Try 2: Without channel_binding
  console.log('=== Try 2: Without channel_binding ===');
  const url2 = rawUrl.replace('&channel_binding=required', '');
  sql = neon(url2);
  return sql`SELECT 1 as test`;
}).then(r => { console.log('Try 2 SUCCESS:', JSON.stringify(r)); process.exit(0); }).catch(e => { console.log('Try 2 FAIL:', e.message);

  // Try 3: With postgres as db name
  console.log('=== Try 3: Database = postgres ===');
  const url3 = rawUrl.replace('/neondb?', '/postgres?');
  sql = neon(url3);
  return sql`SELECT 1 as test`;
}).then(r => { console.log('Try 3 SUCCESS:', JSON.stringify(r)); process.exit(0); }).catch(e => { console.log('Try 3 FAIL:', e.message);

  // Try 4: Without pooler suffix
  console.log('=== Try 4: Without -pooler ===');
  const url4 = rawUrl.replace('-pooler', '');
  sql = neon(url4);
  return sql`SELECT 1 as test`;
}).then(r => { console.log('Try 4 SUCCESS:', JSON.stringify(r)); process.exit(0); }).catch(e => { console.log('Try 4 FAIL:', e.message);

  // Try 5: Check if it's an IPv6 / DNS issue - try with IP
  console.log('=== Try 5: Check DNS ===');
  const dns = require('dns');
  dns.lookup('ep-wandering-sunset-adnnkv76-pooler.c-2.us-east-1.aws.neon.tech', (err, addr) => {
    if (err) console.log('DNS error:', err.message);
    else console.log('DNS resolved to:', addr);
    process.exit(1);
  });
});
