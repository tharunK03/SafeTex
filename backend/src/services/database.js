import { pool } from '../config/supabase.js';

class DatabaseService {
  // Generic query method
  async query(text, params) {
    const client = await pool.connect()
    try {
      const result = await client.query(text, params)
      return result
    } finally {
      client.release()
    }
  }

  // Get a single row
  async getOne(text, params) {
    const result = await this.query(text, params)
    return result.rows[0] || null
  }

  // Get multiple rows
  async getMany(text, params) {
    const result = await this.query(text, params)
    return result.rows
  }

  // Insert a new record
  async insert(text, params) {
    const result = await this.query(text, params)
    return result.rows[0]
  }

  // Update a record
  async update(text, params) {
    const result = await this.query(text, params)
    return result.rows[0]
  }

  // Delete a record
  async delete(text, params) {
    const result = await this.query(text, params)
    return result.rowCount > 0
  }

  // Transaction support
  async transaction(callback) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

const db = new DatabaseService();
export default db;










