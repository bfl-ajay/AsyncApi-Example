const db = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { log } = require('../middleware/logger');

// CREATE USER using stored procedure
async function createUser({ name, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await db.getConnection();
    try {
      const [check] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
      if (check.length > 0) {
        return { error: 'Email already registered' };
      }
  
      await connection.query(
        'CALL sp_create_user(?, ?, ?, @newUserId);',
        [name, email, hashedPassword]
      );
  
      const [[{ '@newUserId': userId }]] = await connection.query('SELECT @newUserId;');
      return { success: true, userId };
    } catch (err) {
      return { error: err.message };
    } finally {
      connection.release();
    }
  }

// READ USER by ID
async function getUser(id) {
  const [rows] = await db.execute(
    'SELECT id, name, email, created_at FROM users WHERE id = ?', [id]
  );
  if (!rows.length) {
    log(`User not found: ID ${id}`);
    return { error: 'User not found' };
  }
  log(`User retrieved: ID ${id}`);
  return rows[0];
}

// UPDATE USER
async function updateUser({ id, name, email }) {
  const [result] = await db.execute(
    'UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]
  );
  if (result.affectedRows === 0) {
    log(`User update failed: ID ${id}`);
    return { error: 'User not found or no change' };
  }
  log(`User updated: ID ${id}`);
  return { success: true };
}

// DELETE USER
async function deleteUser(id) {
  const [result] = await db.execute(
    'DELETE FROM users WHERE id = ?', [id]
  );
  if (result.affectedRows === 0) {
    log(`User delete failed: ID ${id}`);
    return { error: 'User not found' };
  }
  log(`User deleted: ID ${id}`);
  return { success: true };
}

module.exports = { createUser, getUser, updateUser, deleteUser };
// This module handles user-related operations such as creating, reading, updating, and deleting users.
// It uses a MySQL database connection pool to execute queries and stored procedures.   