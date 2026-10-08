import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const rows = await db.prepare(`
    SELECT a.*, u.full_name AS created_by_name
    FROM announcements a
    JOIN users u ON u.id = a.created_by
    ORDER BY a.is_pinned DESC, a.created_at DESC
  `).all();
  return res.json({ announcements: rows });
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { content, is_pinned } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Content is required.' });
  }

  const announcementId = uuidv4();
  await db.prepare(`
    INSERT INTO announcements (id, content, created_by, is_pinned)
    VALUES (?, ?, ?, ?)
  `).run(announcementId, content.trim(), req.user.id, is_pinned ? 1 : 0);

  const users = await db.prepare('SELECT id FROM users').all();
  for (const user of users) {
    await db.prepare(`INSERT INTO notifications (id, user_id, message, type) VALUES (?, ?, ?, ?)`).run(uuidv4(), user.id, 'New announcement published.', 'announcement');
  }

  return res.status(201).json({ message: 'Announcement created successfully.' });
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { content, is_pinned } = req.body;
  const existing = await db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ message: 'Announcement not found.' });
  }

  await db.prepare(`
    UPDATE announcements
    SET content = ?, is_pinned = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(content || existing.content, is_pinned ? 1 : 0, req.params.id);

  return res.json({ message: 'Announcement updated successfully.' });
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const existing = await db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Announcement not found.' });
  }

  await db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  return res.json({ message: 'Announcement deleted successfully.' });
});

export default router;
