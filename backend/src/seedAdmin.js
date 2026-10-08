import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db, { initializeDatabase } from './db.js';

const admin = {
  full_name: process.env.ADMIN_NAME || 'System Administrator',
  academic_id: process.env.ADMIN_ID || 'ADMIN-001',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  team_role: process.env.ADMIN_ROLE || 'Project Lead',
  work_type: process.env.ADMIN_WORK_TYPE || 'Hardware & Software',
};

const seedAdmin = async () => {
  await initializeDatabase();
  const existing = await db.prepare('SELECT id FROM users WHERE academic_id = ?').get(admin.academic_id);
  if (existing) {
    console.log('Admin account already exists.');
    process.exit(0);
  }

  const passwordHash = bcrypt.hashSync(admin.password, 10);
  const userId = uuidv4();

  await db.prepare(`
    INSERT INTO users (id, full_name, academic_id, password_hash, team_role, work_type, role)
    VALUES (?, ?, ?, ?, ?, ?, 'admin')
  `).run(userId, admin.full_name, admin.academic_id, passwordHash, admin.team_role, admin.work_type);

  console.log('Admin account created successfully.');
  console.log({
    academic_id: admin.academic_id,
    password: admin.password,
  });
};

seedAdmin();
