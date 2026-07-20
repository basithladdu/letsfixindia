const { Client } = require('pg');

async function setup() {
  const connectionString = 'postgresql://postgres:OJb7DMWgEFcBAr7h@db.pjonynkzgsfwojwboixi.supabase.co:5432/postgres';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    // Create table matching the Firebase collection
    const query = `
      CREATE TABLE IF NOT EXISTS letsfixindia_submissions (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await client.query(query);
    console.log('Table letsfixindia_submissions created successfully');

  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await client.end();
  }
}

setup();
