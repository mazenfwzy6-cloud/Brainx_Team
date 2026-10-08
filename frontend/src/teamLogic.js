export function removeMemberFromTeam(users, memberId) {
  return users.filter((user) => user.id !== memberId);
}

export function clearMemberAssignments(tasks, memberId) {
  return tasks.filter((task) => task.assigneeId !== memberId);
}

export function setMemberMute(users, memberId, muted) {
  return users.map((user) => (user.id === memberId ? { ...user, muted } : user));
}

export function canDeleteMessage(message, now = Date.now()) {
  if (!message || !message.timestamp) {
    return false;
  }

  return now - Number(message.timestamp) <= 30000;
}
