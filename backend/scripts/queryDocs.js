const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Load .env if present
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, 'utf8');
      raw.split(/\r?\n/).forEach(line => {
        const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=(.*)$/);
        if (!m) return;
        const k = m[1];
        let v = m[2] || '';
        v = v.trim().replace(/^\"(.*)\"$/, '$1').replace(/^\'(.*)\'$/, '$1');
        if (!process.env[k]) process.env[k] = v;
      });
    }

    const connStr = process.env.MONGO_DB || process.env.MONGO_URI;
    if (!connStr) {
      console.error('No MONGO_DB or MONGO_URI found in environment or backend/.env');
      process.exit(2);
    }

    let MongoClient;
    try {
      MongoClient = require('mongodb').MongoClient;
    } catch (e) {
      console.error('Missing npm package "mongodb". Install it in backend with: cd backend && npm install mongodb');
      process.exit(3);
    }

    const client = new MongoClient(connStr, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log('Connected to MongoDB');

    // Try to infer DB name from connection string
    let dbName = null;
    const m = connStr.match(/\/([^/?]+)(\?|$)/);
    if (m) dbName = m[1];
    const db = dbName ? client.db(dbName) : client.db();

    const users = await db.collection('users').find({ 'documents.0': { $exists: true } }).project({ fullName:1, email:1, documents:1 }).toArray();
    console.log('--- users with documents ---');
    if (!users || users.length === 0) console.log('(none)');
    else console.log(JSON.stringify(users, null, 2));

    const appts = await db.collection('appointments').find({ 'document.path': { $exists: true } }).project({ userInfo:1, doctorInfo:1, date:1, document:1 }).toArray();
    console.log('\n--- appointments with documents ---');
    if (!appts || appts.length === 0) console.log('(none)');
    else console.log(JSON.stringify(appts, null, 2));

    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
