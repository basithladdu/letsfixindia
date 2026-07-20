const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.pjonynkzgsfwojwboixi:OJb7DMWgEFcBAr7h@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL!');
    
    const res = await client.query('SELECT * FROM letsfixindia_submissions ORDER BY id DESC LIMIT 5');
    console.log('\n--- Recent Submissions in Supabase ---');
    console.log(JSON.stringify(res.rows, null, 2));
    
  } catch (err) {
    console.error('Error fetching submissions:', err);
  } finally {
    await client.end();
  }
}

run();
