import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campus-team-flow-secret';

const normalizeName = (value) => String(value || '').trim();

router.post('/register', async (req, res) => {
  const { full_name, academic_id, password, confirm_password, team_role, work_type } = req.body;

  if (!full_name || !academic_id || !password || !confirm_password || !team_role || !work_type) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  const cleanName = normalizeName(full_name);
  const academicCode = String(academic_id).trim();

  if (!cleanName || !academicCode) {
    return res.status(400).json({ message: 'Invalid details provided.' });
  }

  const existing = await db.prepare('SELECT id FROM users WHERE academic_id = ?').get(academicCode);
  if (existing) {
    return res.status(409).json({ message: 'Academic ID already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const userId = uuidv4();

  await db.prepare(`
    INSERT INTO users (id, full_name, academic_id, password_hash, team_role, work_type, role)
    VALUES (?, ?, ?, ?, ?, ?, 'member')
  `).run(userId, cleanName, academicCode, passwordHash, team_role, work_type);

  const user = await db.prepare('SELECT id, full_name, academic_id, team_role, work_type, role FROM users WHERE id = ?').get(userId);
  const token = jwt.sign({ id: user.id, role: user.role, academic_id: user.academic_id }, JWT_SECRET, { expiresIn: '7d' });

  return res.status(201).json({ message: 'Registration successful.', token, user });
});

router.post('/login', async (req, res) => {
  const { academic_id, password } = req.body;

  if (!academic_id || !password) {
    return res.status(400).json({ message: 'Academic ID and password are required.' });
  }

  const user = await db.prepare('SELECT * FROM users WHERE academic_id = ?').get(String(academic_id).trim());
  if (!user) {
    return res.status(401).json({ message: 'Invalid Academic ID or password.' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid Academic ID or password.' });
  }

  const token = jwt.sign({ id: user.id, role: user.role, academic_id: user.academic_id }, JWT_SECRET, { expiresIn: '7d' });

  const safeUser = {
    id: user.id,
    full_name: user.full_name,
    academic_id: user.academic_id,
    team_role: user.team_role,
    work_type: user.work_type,
    role: user.role,
  };

  return res.json({ message: 'Login successful.', token, user: safeUser });
});

router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.prepare('SELECT id, full_name, academic_id, team_role, work_type, role FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
});

export default router;
