import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const createNotification = async (userId, message, type) => {
  await db.prepare(`
    INSERT INTO notifications (id, user_id, message, type)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), userId, message, type);
};

router.get('/', requireAuth, async (req, res) => {
  if (req.user.role === 'admin') {
    const tasks = await db.prepare(`
      SELECT t.*, string_agg(DISTINCT CAST(ta.user_id AS TEXT), ',') AS assigned_user_ids
      FROM tasks t
      LEFT JOIN task_assignments ta ON ta.task_id = t.id
      GROUP BY t.id, t.title, t.description, t.task_type, t.priority, t.status, t.deadline, t.created_by, t.created_at, t.updated_at
      ORDER BY t.created_at DESC
    `).all();

    const normalizedTasks = tasks.map((task) => ({
      ...task,
      assigned_user_ids: task.assigned_user_ids ? task.assigned_user_ids.split(',') : [],
    }));

    return res.json({ tasks: normalizedTasks });
  }

  const rows = await db.prepare(`
    SELECT DISTINCT t.*
    FROM tasks t
    JOIN task_assignments ta ON ta.task_id = t.id
    WHERE ta.user_id = ?
    ORDER BY t.deadline ASC
  `).all(req.user.id);

  return res.json({ tasks: rows });
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { title, description, task_type, priority, status, deadline, assigned_to } = req.body;

  if (!title || !task_type || !priority || !status || !deadline) {
    return res.status(400).json({ message: 'Missing task information.' });
  }

  const taskId = uuidv4();
  await db.prepare(`
    INSERT INTO tasks (id, title, description, task_type, priority, status, deadline, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(taskId, title, description || '', task_type, priority, status, deadline, req.user.id);

  const assignees = Array.isArray(assigned_to) ? assigned_to : [assigned_to].filter(Boolean);

  for (const userId of assignees) {
    const assignmentId = uuidv4();
    await db.prepare(`INSERT INTO task_assignments (id, task_id, user_id) VALUES (?, ?, ?)`).run(assignmentId, taskId, userId);
    await createNotification(userId, `New task assigned: ${title}`, 'task_assigned');
  }

  return res.status(201).json({ message: 'Task created successfully.' });
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, task_type, priority, status, deadline, assigned_to } = req.body;
  const existing = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (!existing) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  await db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, task_type = ?, priority = ?, status = ?, deadline = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title || existing.title, description !== undefined ? description : existing.description, task_type || existing.task_type, priority || existing.priority, status || existing.status, deadline || existing.deadline, id);

  await db.prepare('DELETE FROM task_assignments WHERE task_id = ?').run(id);
  const assignees = Array.isArray(assigned_to) ? assigned_to : [assigned_to].filter(Boolean);

  for (const userId of assignees) {
    await db.prepare('INSERT INTO task_assignments (id, task_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), id, userId);
    await createNotification(userId, `Task updated: ${title || existing.title}`, 'task_updated');
  }

  return res.json({ message: 'Task updated successfully.' });
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  if (!task) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  await db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return res.json({ message: 'Task deleted successfully.' });
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const assignment = await db.prepare('SELECT * FROM task_assignments WHERE task_id = ? AND user_id = ?').get(id, req.user.id);
  if (!assignment && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You are not assigned to this task.' });
  }

  const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  await db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  await createNotification(req.user.id, `Task status changed to ${status}`, 'task_updated');

  return res.json({ message: 'Task status updated.' });
});

export default router;
