import express from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  const totalMembers = (await db.prepare('SELECT COUNT(*) AS count FROM users').get()).count;
  const totalTasks = (await db.prepare('SELECT COUNT(*) AS count FROM tasks').get()).count;
  const completedTasks = (await db.prepare("SELECT COUNT(*) AS count FROM tasks WHERE status = 'Completed'").get()).count;
  const pendingTasks = (await db.prepare("SELECT COUNT(*) AS count FROM tasks WHERE status = 'Pending'").get()).count;
  const overdueTasks = (await db.prepare("SELECT COUNT(*) AS count FROM tasks WHERE status = 'Overdue'").get()).count;
  const softwareMembers = (await db.prepare("SELECT COUNT(*) AS count FROM users WHERE work_type = 'Software'").get()).count;
  const hardwareMembers = (await db.prepare("SELECT COUNT(*) AS count FROM users WHERE work_type = 'Hardware'").get()).count;
  const hybridMembers = (await db.prepare("SELECT COUNT(*) AS count FROM users WHERE work_type = 'Hardware & Software'").get()).count;

  const tasksByStatus = await db.prepare(`
    SELECT status, COUNT(*) AS count
    FROM tasks
    GROUP BY status
    ORDER BY status
  `).all();

  const membersByWorkType = [
    { name: 'Software', value: softwareMembers },
    { name: 'Hardware', value: hardwareMembers },
    { name: 'Hardware & Software', value: hybridMembers },
  ];

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return res.json({
    totalMembers,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    progress,
    softwareMembers,
    hardwareMembers,
    hybridMembers,
    tasksByStatus,
    membersByWorkType,
  });
});

export default router;
