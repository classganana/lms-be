/*
  Quick script to test MongoDB connection using the native driver.
  Usage: MONGODB_URI="your-uri" node scripts/check-mongo-connection.js
*/
const { MongoClient } = require('mongodb');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(2);
  }

  // Respect debug env var to allow invalid TLS certs for troubleshooting only
  const allowInvalidTLS = process.env.MONGODB_TLS_ALLOW_INVALID === 'true';
  const clientOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    tls: true,
  };

  if (allowInvalidTLS) {
    clientOptions.tlsAllowInvalidCertificates = true;
    clientOptions.tlsAllowInvalidHostnames = true;
    console.warn('Warning: TLS certificate validation is disabled for this test');
  }

  const client = new MongoClient(uri, clientOptions);

  try {
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    const admin = client.db().admin();
    const info = await admin.serverStatus();
    console.log('Connected. Server info:');
    console.log({ version: info.version, process: info.process });
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
