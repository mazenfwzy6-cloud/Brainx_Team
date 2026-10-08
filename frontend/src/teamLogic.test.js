import test from 'node:test';
import assert from 'node:assert/strict';

import { removeMemberFromTeam, setMemberMute, clearMemberAssignments, canDeleteMessage } from './teamLogic.js';

test('removeMemberFromTeam removes only the selected member and preserves admin', () => {
  const users = [
    { id: 'a', full_name: 'Admin', role: 'admin' },
    { id: 'm1', full_name: 'Ali', role: 'member' },
    { id: 'm2', full_name: 'Sara', role: 'member' },
  ];

  const tasks = [
    { id: 't1', assigneeId: 'm1', title: 'Build UI' },
    { id: 't2', assigneeId: 'm2', title: 'Fix API' },
  ];

  const nextUsers = removeMemberFromTeam(users, 'm1');
  const nextTasks = clearMemberAssignments(tasks, 'm1');

  assert.deepEqual(nextUsers.map((user) => user.id), ['a', 'm2']);
  assert.deepEqual(nextTasks.map((task) => task.id), ['t2']);
});

test('setMemberMute toggles the muted flag for a registered member', () => {
  const users = [
    { id: 'm1', full_name: 'Ali', role: 'member', muted: false },
    { id: 'm2', full_name: 'Sara', role: 'member', muted: false },
  ];

  const nextUsers = setMemberMute(users, 'm1', true);

  assert.equal(nextUsers[0].muted, true);
  assert.equal(nextUsers[1].muted, false);
});

test('canDeleteMessage only allows deletion within the 30-second window', () => {
  const recent = { id: 'm1', timestamp: Date.now() };
  const oldMessage = { id: 'm2', timestamp: Date.now() - 31000 };

  assert.equal(canDeleteMessage(recent), true);
  assert.equal(canDeleteMessage(oldMessage), false);
});
