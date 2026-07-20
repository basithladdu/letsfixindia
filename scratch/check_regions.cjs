const { Client } = require('pg');

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1', 'eu-central-1', 'eu-central-2',
  'sa-east-1', 'ca-central-1', 'me-central-1', 'af-south-1'
];

async function checkRegion(region) {
  const client = new Client({
    connectionString: `postgresql://postgres.pjonynkzgsfwojwboixi:OJb7DMWgEFcBAr7h@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 4000
  });
  try {
    await client.connect();
    console.log('SUCCESS IN REGION:', region);
    await client.end();
  } catch (err) {
    if (!err.message.includes('tenant/user') && !err.message.includes('ENOTFOUND')) {
      console.log('Region', region, 'other error:', err.message);
    }
  }
}

async function run() {
  await Promise.all(regions.map(checkRegion));
  console.log('Done scanning all regions.');
}

run();
