
// MongoClient instance used across all routes

const { MongoClient } = require('mongodb');

const URI = 'mongodb://mongoapp:huMONGOu5@localhost:27017/clinical_trials?authSource=clinical_trials';
const DB_NAME = 'clinical_trials';

// Single client instance 
const client = new MongoClient(URI);
let db = null;

// Call once at server startup to establish the connection
async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
  }
  return db;
}

// Returns the active database instance for use in routes
function getDB() {
  if (!db) throw new Error('Database not connected. Call connectDB() first.');
  return db;
}

module.exports = { connectDB, getDB };