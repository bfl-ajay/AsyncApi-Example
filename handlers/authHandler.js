const db = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// ✅ Add this missing function
async function registerUser({ name, email, password }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const connection = await db.getConnection();
  try {
    const [check] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (check.length > 0) {
      return { error: 'Email already registered' };
    }

    const [result] = await connection.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    return { success: true, userId: result.insertId };
  } catch (err) {
    return { error: err.message };
  } finally {
    connection.release();
  }
}

async function generateToken({ email, password, client_ip, client_agent }) {
  const connection = await db.getConnection();
  try {
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return { error: 'User not found' };

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return { error: 'Incorrect credentials' };

    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days

    await connection.query(
      'INSERT INTO api_tokens (user_id, token, client_ip, client_agent, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, token, client_ip, client_agent, expires_at]
    );

    return { success: true, token, expires_at };
  } finally {
    connection.release();
  }
}

async function verifyToken(token) {
  const [rows] = await db.execute(
    'SELECT user_id FROM api_tokens WHERE token = ? AND is_active = TRUE AND expires_at > NOW()', [token]
  );
  return rows.length ? rows[0].user_id : null;
}

// ✅ Export all functions
module.exports = {
  registerUser,
  generateToken,
  verifyToken
};
