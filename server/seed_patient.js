import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const saltRounds = 10;

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  console.log('Seeding patient: aarush...');
  
  try {
    await connection.beginTransaction();

    const email = 'aarush3@gmail.com';
    const password = 'password';
    const name = 'aarush';
    const age = 11;
    const gender = 'male';
    const phone = '+91 7617623010';
    const address = 'dehradun';
    const role = 'patient';

    // Check if exists
    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('User already exists. Skipping.');
      await connection.rollback();
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [userResult] = await connection.query(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, passwordHash, role]
    );
    const userId = userResult.insertId;

    // Insert patient profile
    await connection.query(
      'INSERT INTO patients (user_id, name, age, gender, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, age, gender, phone, address]
    );

    await connection.commit();
    console.log('Patient seeded successfully!');
    console.log('Email:', email);
    console.log('Password:', password);

  } catch (err) {
    await connection.rollback();
    console.error('Seeding failed:', err);
  } finally {
    await connection.end();
  }
}

seed();
