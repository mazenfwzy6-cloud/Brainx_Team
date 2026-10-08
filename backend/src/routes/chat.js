import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const rows = await db.prepare(`
    SELECT cm.*, u.full_name, u.role
    FROM chat_messages cm
    JOIN users u ON u.id = cm.sender_id
    ORDER BY cm.created_at ASC
  `).all();

  return res.json({ messages: rows });
});

router.post('/', requireAuth, async (req, res) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Message cannot be empty.' });
  }

  const messageId = uuidv4();
  const newMessage = {
    id: messageId,
    sender_id: req.user.id,
    content: content.trim(),
    created_at: new Date().toISOString(),
  };

  await db.prepare(`
    INSERT INTO chat_messages (id, sender_id, content, created_at)
    VALUES (?, ?, ?, ?)
  `).run(newMessage.id, newMessage.sender_id, newMessage.content, newMessage.created_at);

  const sender = await db.prepare('SELECT full_name, role FROM users WHERE id = ?').get(req.user.id);
  const payload = { ...newMessage, full_name: sender.full_name, role: sender.role };

  req.app.get('io').emit('message-received', payload);
  return res.status(201).json({ message: 'Message sent.', data: payload });
});

export default router;
