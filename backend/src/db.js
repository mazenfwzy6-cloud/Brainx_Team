import pg from 'pg';
import { newDb } from 'pg-mem';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/campus_team_flow';

const createPool = () => {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ...(process.env.NODE_ENV === 'production' ? { ssl: { rejectUnauthorized: false } } : {}),
    });
  }

  const db = newDb();
  const { Pool: MemPool } = db.adapters.createPg();
  return new MemPool();
};

const pool = createPool();

const convertQuestionMarks = (sql) => {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
};

const prepare = (sql) => {
  const queryText = convertQuestionMarks(sql);

  return {
    async get(...args) {
      const result = await pool.query(queryText, args);
      return result.rows[0] ?? null;
    },
    async all(...args) {
      const result = await pool.query(queryText, args);
      return result.rows;
    },
    async run(...args) {
      const result = await pool.query(queryText, args);
      return { changes: result.rowCount ?? 0, lastInsertRowid: null };
    },
  };
};

const db = {
  prepare,
  async exec(sqlText) {
    await pool.query(sqlText);
  },
  async query(text, params = []) {
    return pool.query(text, params);
  },
  async close() {
    await pool.end();
  },
};

export async function initializeDatabase() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      academic_id TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      team_role TEXT NOT NULL,
      work_type TEXT NOT NULL CHECK (work_type IN ('Software', 'Hardware', 'Hardware & Software')),
      role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      task_type TEXT NOT NULL,
      priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
      status TEXT NOT NULL CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Overdue')),
      deadline TEXT,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      CONSTRAINT task_assignments_task_fk FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      CONSTRAINT task_assignments_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (task_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      created_by TEXT NOT NULL,
      is_pinned INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chat_messages_sender_fk FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      file_url TEXT NOT NULL,
      description TEXT,
      uploaded_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

export { pool };
export default db;
