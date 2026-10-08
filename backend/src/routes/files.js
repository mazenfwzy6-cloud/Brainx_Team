import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.get('/', requireAuth, async (req, res) => {
  const rows = await db.prepare(`
    SELECT f.*, u.full_name AS uploaded_by_name
    FROM files f
    JOIN users u ON u.id = f.uploaded_by
    ORDER BY f.created_at DESC
  `).all();

  return res.json({ files: rows });
});

router.post('/upload', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
  const { category, description } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const fileId = uuidv4();
  const fileUrl = `/uploads/${file.filename}`;

  await db.prepare(`
    INSERT INTO files (id, name, category, file_url, description, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(fileId, file.originalname, category || 'Other', fileUrl, description || '', req.user.id);

  const users = await db.prepare('SELECT id FROM users').all();
  for (const user of users) {
    await db.prepare(`INSERT INTO notifications (id, user_id, message, type) VALUES (?, ?, ?, ?)`).run(uuidv4(), user.id, `New file uploaded: ${file.originalname}`, 'file');
  }

  return res.status(201).json({ message: 'File uploaded successfully.' });
});

export default router;
