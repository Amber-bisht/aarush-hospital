import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Finalizing treatment plan migration...');
  try {
    // Drop the confusing column
    try {
      await connection.query('ALTER TABLE prescriptions DROP COLUMN internal_notes');
      console.log('Dropped old internal_notes column.');
    } catch (err) {
      console.log('internal_notes column not found, skipping drop.');
    }

    // Add the new properly named column
    try {
      await connection.query('ALTER TABLE prescriptions ADD COLUMN treatment_plan TEXT DEFAULT NULL');
      console.log('Added treatment_plan column.');
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log('treatment_plan column already exists.');
      } else {
        throw err;
      }
    }

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrate();
