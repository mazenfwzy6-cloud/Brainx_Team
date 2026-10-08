import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, full_name, academic_id, team_role, work_type, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  return res.json({ user });
});

router.get('/', requireAuth, requireAdmin, (req, res) => {
  const { search = '' } = req.query;
  const query = `%${String(search)}%`;
  const rows = db.prepare(`
    SELECT id, full_name, academic_id, team_role, work_type, role, is_active, created_at
    FROM users
    WHERE full_name LIKE ? OR academic_id LIKE ? OR team_role LIKE ?
    ORDER BY created_at DESC
  `).all(query, query, query);
  return res.json({ users: rows });
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { full_name, academic_id, password, team_role, work_type, role } = req.body;

  if (!full_name || !academic_id || !password || !team_role || !work_type) {
    return res.status(400).json({ message: 'All required fields must be filled.' });
  }

  const ifExists = db.prepare('SELECT id FROM users WHERE academic_id = ?').get(String(academic_id).trim());
  if (ifExists) {
    return res.status(409).json({ message: 'Academic ID already exists.' });
  }

  const userId = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, full_name, academic_id, password_hash, team_role, work_type, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, full_name.trim(), academic_id.trim(), passwordHash, team_role, work_type, role === 'admin' ? 'admin' : 'member');

  const created = db.prepare('SELECT id, full_name, academic_id, team_role, work_type, role FROM users WHERE id = ?').get(userId);
  return res.status(201).json({ message: 'Member created successfully.', user: created });
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { full_name, academic_id, team_role, work_type, role } = req.body;

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ message: 'Member not found.' });
  }

  db.prepare(`
    UPDATE users
    SET full_name = ?, academic_id = ?, team_role = ?, work_type = ?, role = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(full_name || existing.full_name, academic_id || existing.academic_id, team_role || existing.team_role, work_type || existing.work_type, role || existing.role, id);

  const updated = db.prepare('SELECT id, full_name, academic_id, team_role, work_type, role FROM users WHERE id = ?').get(id);
  return res.json({ message: 'Member updated successfully.', user: updated });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ message: 'Member not found.' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return res.json({ message: 'Member deleted successfully.' });
});

export default router;
