import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { removeMemberFromTeam, clearMemberAssignments, setMemberMute, canDeleteMessage } from './teamLogic.js';

const TEAM_NAME = 'BRAINX TEAM';
const TEAM_LOGO = 'BT';

const defaultData = {
  users: [
    {
      id: 'u-admin',
      full_name: 'System Admin',
      academic_id: '2520734',
      password: '01020477993mma',
      team_role: 'Project Lead',
      work_type: 'Hardware & Software',
      role: 'admin',
      team_name: TEAM_NAME,
      muted: false,
      bio: 'Responsible for project direction, planning, and team coordination.',
      avatar: '',
    },
    {
      id: 'u-1',
      full_name: 'Aisha Ali',
      academic_id: 'IT-101',
      password: 'aisha123',
      team_role: 'Frontend Developer',
      work_type: 'Software',
      role: 'member',
      team_name: TEAM_NAME,
      muted: false,
      bio: 'Designing user interfaces and improving the experience for the team dashboard.',
      avatar: '',
    },
    {
      id: 'u-2',
      full_name: 'Omar Saleh',
      academic_id: 'IT-102',
      password: 'omar123',
      team_role: 'Backend Developer',
      work_type: 'Hardware & Software',
      role: 'member',
      team_name: TEAM_NAME,
      muted: false,
      bio: 'Focused on APIs, database logic, and making the project infrastructure stable.',
      avatar: '',
    },
    {
      id: 'u-3',
      full_name: 'Nora Hassan',
      academic_id: 'IT-103',
      password: 'nora123',
      team_role: 'UI/UX Designer',
      work_type: 'Software',
      role: 'member',
      team_name: TEAM_NAME,
      muted: false,
      bio: 'Creating visual systems, prototypes, and a polished project identity.',
      avatar: '',
    },
  ],
  joinRequests: [],
  tasks: [
    { id: 't-1', title: 'Login Design', description: 'Create secure login page for students', assigneeId: 'u-1', priority: 'High', status: 'In Progress', deadline: '2026-10-12', image: '' },
    { id: 't-2', title: 'Database Schema', description: 'Prepare project tables and relations', assigneeId: 'u-2', priority: 'Critical', status: 'Pending', deadline: '2026-10-10', image: '' },
    { id: 't-3', title: 'UI Prototype', description: 'Create modern dashboard style', assigneeId: 'u-3', priority: 'Medium', status: 'Completed', deadline: '2026-10-08', image: '' },
  ],
  announcements: [
    { id: 'a-1', content: 'Meeting tomorrow at 6:00 PM.', pinned: true },
    { id: 'a-2', content: 'Backend deployment review on Friday.', pinned: false },
    { id: 'a-3', content: 'New design file uploaded to the project folder.', pinned: false },
  ],
  notifications: [
    { id: 'n-1', type: 'task', text: 'Aisha submitted a front-end update for review.', time: '10 mins ago' },
    { id: 'n-2', type: 'report', text: 'Team completion rate increased to 72%.', time: '25 mins ago' },
    { id: 'n-3', type: 'meeting', text: 'Sprint review scheduled for this afternoon.', time: '1 hour ago' },
  ],
  files: [
    { id: 'f-1', name: 'project-brief.pdf', size: '2.1 MB', owner: 'Admin' },
    { id: 'f-2', name: 'dashboard-mockup.fig', size: '4.5 MB', owner: 'Aisha' },
    { id: 'f-3', name: 'api-contract.md', size: '340 KB', owner: 'Omar' },
  ],
  milestones: [
    { id: 'ms-1', name: 'Prototype approval', due: '2026-10-12', status: 'On Track' },
    { id: 'ms-2', name: 'Database release', due: '2026-10-15', status: 'Pending' },
    { id: 'ms-3', name: 'Final presentation', due: '2026-10-20', status: 'Upcoming' },
  ],
  meetings: [
    { id: 'mt-1', title: 'Sprint Check-in', date: '2026-10-08', time: '18:00', location: 'Room A', createdBy: 'System Admin' },
  ],
  reviews: [
    { id: 'r-1', memberId: 'u-1', score: 9, note: 'Strong UI progress', createdAt: '2026-10-07' },
  ],
  projectDetails: {
    title: 'BRAINX TEAM',
    summary: 'A collaborative university project team focused on innovation, teamwork, and delivering a modern digital experience.',
    image: '',
    gallery: [],
  },
  messages: [
    { id: 'm-1', sender: 'System Admin', text: 'Welcome to the project team.', time: '09:00', channel: 'general', type: 'text', media: '', timestamp: Date.now() - 300000 },
    { id: 'm-2', sender: 'Aisha Ali', text: 'I finished the front-end screens.', time: '09:15', channel: 'general', type: 'text', media: '', timestamp: Date.now() - 240000 },
    { id: 'm-3', sender: 'Omar Saleh', text: 'I am checking the database structure now.', time: '09:22', channel: 'general', type: 'text', media: '', timestamp: Date.now() - 180000 },
  ],
};

const STORAGE_KEY = 'campus-team-flow-db';
const ADMIN_ACCOUNT = defaultData.users[0];

const normalizeDatabase = (db) => {
  const users = Array.isArray(db.users) ? db.users : [];
  const uniqueUsers = [];
  const seenAcademicIds = new Set();

  users.forEach((user) => {
    if (!user || !user.academic_id) return;
    if (user.academic_id === ADMIN_ACCOUNT.academic_id && user.role !== 'admin') return;
    if (seenAcademicIds.has(user.academic_id)) return;

    seenAcademicIds.add(user.academic_id);
    uniqueUsers.push(user);
  });

  const adminIndex = uniqueUsers.findIndex((user) => user.role === 'admin');
  if (adminIndex === -1) {
    uniqueUsers.unshift(ADMIN_ACCOUNT);
  } else if (
    uniqueUsers[adminIndex].academic_id !== ADMIN_ACCOUNT.academic_id ||
    uniqueUsers[adminIndex].password !== ADMIN_ACCOUNT.password
  ) {
    uniqueUsers[adminIndex] = { ...uniqueUsers[adminIndex], ...ADMIN_ACCOUNT };
  }

  db.users = uniqueUsers;
  db.joinRequests = db.joinRequests || [];
  db.tasks = db.tasks || [];
  db.announcements = db.announcements || [];
  db.notifications = db.notifications || [];
  db.files = db.files || [];
  db.milestones = db.milestones || [];
  db.meetings = db.meetings || [];
  db.reviews = db.reviews || [];
  db.projectDetails = db.projectDetails || {
    title: 'BRAINX TEAM',
    summary: 'A collaborative university project team focused on innovation, teamwork, and delivering a modern digital experience.',
    image: '',
    gallery: [],
  };
  db.messages = db.messages || [];
  return db;
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Unable to read file'));
  reader.readAsDataURL(file);
});

const getDatabase = () => {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    const db = normalizeDatabase(JSON.parse(stored));
    saveDatabase(db);
    return db;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
};

const saveDatabase = (db) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

const formatDueDate = (value) => {
  if (!value) return 'No deadline';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
};

const formatLastActive = (value) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';

  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
};

const getCurrentUser = () => JSON.parse(localStorage.getItem('campus-team-flow-user') || 'null');
const setCurrentUser = (user) => localStorage.setItem('campus-team-flow-user', JSON.stringify(user));
const clearCurrentUser = () => localStorage.removeItem('campus-team-flow-user');

function ProtectedRoute({ children, allowedRole }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to={user.role === 'admin' ? '/admin' : '/member'} replace />;
  return children;
}

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-badge large">{TEAM_LOGO}</div>
          <h1>{TEAM_NAME}</h1>
          <p>{subtitle}</p>
        </div>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ academic_id: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    const db = getDatabase();

    const pendingRequest = db.joinRequests.find(
      (user) => user.academic_id === form.academic_id && user.password === form.password
    );

    if (pendingRequest) {
      setError('Your request is waiting for approval from the team leader.');
      return;
    }

    const adminMatch = db.users.find(
      (user) => user.role === 'admin' && user.academic_id === form.academic_id && user.password === form.password
    );

    if (adminMatch) {
      const updatedDb = {
        ...db,
        users: db.users.map((user) => user.id === adminMatch.id ? { ...user, last_active: new Date().toISOString() } : user),
      };
      saveDatabase(updatedDb);

      setCurrentUser({
        id: adminMatch.id,
        full_name: adminMatch.full_name,
        academic_id: adminMatch.academic_id,
        team_role: adminMatch.team_role,
        work_type: adminMatch.work_type,
        role: adminMatch.role,
        team_name: TEAM_NAME,
        muted: adminMatch.muted || false,
        bio: adminMatch.bio || '',
        avatar: adminMatch.avatar || '',
      });
      navigate('/admin');
      return;
    }

    const match = db.users.find(
      (user) => user.academic_id === form.academic_id && user.password === form.password && user.role !== 'admin'
    );

    if (!match) {
      setError('Invalid Academic ID or password');
      return;
    }

    const updatedDb = {
      ...db,
      users: db.users.map((user) => user.id === match.id ? { ...user, last_active: new Date().toISOString() } : user),
    };
    saveDatabase(updatedDb);

    setCurrentUser({
      id: match.id,
      full_name: match.full_name,
      academic_id: match.academic_id,
      team_role: match.team_role,
      work_type: match.work_type,
      role: match.role,
      team_name: TEAM_NAME,
      muted: match.muted || false,
      bio: match.bio || '',
      avatar: match.avatar || '',
    });
    navigate('/member');
  };

  return (
    <AuthShell title="Login" subtitle="Welcome to the BRAINX TEAM workspace">
      <form className="form-grid" onSubmit={handleSubmit}>
        <input name="academic_id" placeholder="Academic ID" value={form.academic_id} onChange={handleChange} />
        <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} />
        {error && <div className="error-box">{error}</div>}
        <button type="submit">Login</button>
        <div className="link-row">
          <span>New to the system?</span>
          <Link to="/register">Create account</Link>
        </div>
      </form>
    </AuthShell>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    academic_id: '',
    password: '',
    confirm_password: '',
    team_role: '',
    work_type: 'Software',
    bio: '',
    avatar: '',
  });
  const [error, setError] = useState('');

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setForm({ ...form, avatar: dataUrl });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const db = getDatabase();

    if (!form.full_name || !form.academic_id || !form.password || !form.team_role) {
      setError('Please fill all required fields.');
      return;
    }

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (form.academic_id === ADMIN_ACCOUNT.academic_id) {
      setError('This academic ID is reserved for the admin account.');
      return;
    }

    const exists = db.users.some((user) => user.academic_id === form.academic_id);
    if (exists) {
      setError('Academic ID already exists.');
      return;
    }

    const newUser = {
      id: `request-${Date.now()}`,
      full_name: form.full_name,
      academic_id: form.academic_id,
      password: form.password,
      team_role: form.team_role,
      work_type: form.work_type,
      role: 'member',
      team_name: TEAM_NAME,
      status: 'pending',
      bio: form.bio || 'No bio added yet.',
      avatar: form.avatar || '',
      created_at: new Date().toISOString(),
    };

    db.joinRequests = [newUser, ...(db.joinRequests || [])];
    saveDatabase(db);
    setError('Your request has been sent to the admin. Please wait for approval.');
    setTimeout(() => navigate('/login'), 1200);
  };

  return (
    <AuthShell title="Register" subtitle="Create your account and join BRAINX TEAM">
      <form className="form-grid" onSubmit={handleSubmit}>
        <input name="full_name" placeholder="Full Name" value={form.full_name} onChange={handleChange} />
        <input name="academic_id" placeholder="Academic ID" value={form.academic_id} onChange={handleChange} />
        <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} />
        <input type="password" name="confirm_password" placeholder="Confirm Password" value={form.confirm_password} onChange={handleChange} />
        <input name="team_role" placeholder="Team Role" value={form.team_role} onChange={handleChange} />
        <select name="work_type" value={form.work_type} onChange={handleChange}>
          <option value="Software">Software</option>
          <option value="Hardware">Hardware</option>
          <option value="Hardware & Software">Hardware & Software</option>
        </select>
        <textarea name="bio" rows="3" placeholder="Write your biography or skills" value={form.bio} onChange={handleChange} />
        <input type="file" accept="image/*" onChange={handleAvatarChange} />
        {form.avatar && <img src={form.avatar} alt="Profile preview" className="avatar-preview" />}
        {error && <div className="error-box">{error}</div>}
        <button type="submit">Create Account</button>
        <div className="link-row">
          <span>Already have an account?</span>
          <Link to="/login">Login</Link>
        </div>
      </form>
    </AuthShell>
  );
}

function DashboardShell({ title, user, onLogout, children, navItems = [], activeNav = 'overview', onNavChange = () => {} }) {
  const path = user.role === 'admin' ? '/admin' : '/member';

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-badge">{TEAM_LOGO}</div>
          <div>
            <h2>{TEAM_NAME}</h2>
            <small>⚡ Team workspace</small>
          </div>
        </div>

        <nav className="nav-menu">
          {navItems.length > 0 ? navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeNav === item.id ? 'nav-button active' : 'nav-button'}
              onClick={() => onNavChange(item.id)}
            >
              <span>{item.label}</span>
              {item.count > 0 && (
                <span className="nav-badge">{item.count}</span>
              )}
            </button>
          )) : (
            <>
              <Link className="active" to={path}>Overview</Link>
              {user.role === 'admin' ? (
                <>
                  <Link to="/admin">Members</Link>
                  <Link to="/admin">Tasks</Link>
                  <Link to="/admin">Reports</Link>
                </>
              ) : (
                <>
                  <Link to="/member">My Tasks</Link>
                  <Link to="/member">Announcements</Link>
                  <Link to="/member">Chat</Link>
                </>
              )}
            </>
          )}
        </nav>

        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">{TEAM_NAME} ⚡</p>
            <h1>{title}</h1>
          </div>
          <div className="user-pill">
            <strong>{user.full_name}</strong>
            <small>{user.role}</small>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function createMessageEntry(sender, text, channel, type = 'text', media = '', timestamp = Date.now()) {
  return {
    id: `m-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sender,
    text,
    time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    channel,
    type,
    media,
    timestamp,
  };
}

function AdminDashboard() {
  const user = getCurrentUser();
  const [db, setDb] = useState(getDatabase());
  const [selectedTab, setSelectedTab] = useState('overview');
  const adminNavItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'profile', label: 'Profile' },
    { id: 'members', label: 'Members' },
    { id: 'requests', label: 'Requests', count: db.joinRequests.length },
    { id: 'notifications', label: 'Notifications', count: db.notifications.length },
    { id: 'tasks', label: 'Tasks' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'project', label: 'Project Details' },
    { id: 'chat', label: 'Chat' },
    { id: 'reports', label: 'Reports' },
  ];
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigneeId: '', priority: 'Medium', status: 'Pending', deadline: '', image: '' });
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', time: '', location: '' });
  const [notice, setNotice] = useState({ content: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [taskFilter, setTaskFilter] = useState('All');
  const [selectedChat, setSelectedChat] = useState('general');
  const [chatInput, setChatInput] = useState('');
  const [chatMedia, setChatMedia] = useState(null);
  const [editMessageId, setEditMessageId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ memberId: '', score: '9', note: '' });
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    team_role: user?.team_role || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
  });
  const [projectForm, setProjectForm] = useState({
    title: db.projectDetails?.title || 'BRAINX TEAM',
    summary: db.projectDetails?.summary || '',
    image: db.projectDetails?.image || '',
    gallery: Array.isArray(db.projectDetails?.gallery) ? db.projectDetails.gallery : [],
  });

  useEffect(() => {
    setDb(getDatabase());
  }, []);

  useEffect(() => {
    const details = db.projectDetails || {};
    setProjectForm({
      title: details.title || 'BRAINX TEAM',
      summary: details.summary || '',
      image: details.image || '',
      gallery: Array.isArray(details.gallery) ? details.gallery : [],
    });
  }, [db.projectDetails]);

  useEffect(() => {
    setProfileForm({
      full_name: user?.full_name || '',
      team_role: user?.team_role || '',
      bio: user?.bio || '',
      avatar: user?.avatar || '',
    });
  }, [user?.full_name, user?.team_role, user?.bio, user?.avatar]);

  const memberOptions = db.users.filter((member) => member.role === 'member' || member.id === user.id);
  const chatTabs = [
    { id: 'general', label: 'General Chat' },
    ...db.users.filter((member) => member.role === 'member').map((member) => ({ id: member.id, label: member.full_name })),
  ];

  const currentChatMessages = db.messages.filter((message) => {
    if (selectedChat === 'general') {
      return !message.channel || message.channel === 'general';
    }

    return message.channel === selectedChat;
  });

  const stats = useMemo(() => {
    const totalMembers = db.users.length;
    const totalTasks = db.tasks.length;
    const completedTasks = db.tasks.filter((task) => task.status === 'Completed').length;
    const pendingTasks = db.tasks.filter((task) => task.status === 'Pending').length;
    const overdueTasks = db.tasks.filter((task) => task.status === 'Overdue').length;
    const software = db.users.filter((member) => member.work_type === 'Software').length;
    const hardware = db.users.filter((member) => member.work_type === 'Hardware').length;
    const hybrid = db.users.filter((member) => member.work_type === 'Hardware & Software').length;
    const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { totalMembers, totalTasks, completedTasks, pendingTasks, overdueTasks, software, hardware, hybrid, progress };
  }, [db]);

  const teamPulse = useMemo(() => {
    const strongest = db.users.filter((member) => member.role === 'member').sort((a, b) => {
      const aTasks = db.tasks.filter((task) => task.assigneeId === a.id && task.status === 'Completed').length;
      const bTasks = db.tasks.filter((task) => task.assigneeId === b.id && task.status === 'Completed').length;
      return bTasks - aTasks;
    })[0];
    const nextMilestone = db.milestones?.[0]?.name || 'Prototype walk-through';
    const nextDate = db.milestones?.[0]?.due || 'This week';
    const score = stats.totalTasks ? Math.min(100, Math.round((stats.completedTasks / stats.totalTasks) * 100 + 15)) : 0;
    return {
      score,
      message: score >= 80 ? 'Strong sprint momentum' : score >= 60 ? 'Healthy and steady' : 'Needs more focus',
      topPerformer: strongest ? strongest.full_name : 'No data yet',
      nextMilestone,
      nextDate,
    };
  }, [db, stats]);

  const reportBreakdown = [
    { id: 'completed', label: 'Completed', value: stats.completedTasks, total: Math.max(stats.totalTasks, 1), tone: 'success' },
    { id: 'pending', label: 'Pending', value: stats.pendingTasks, total: Math.max(stats.totalTasks, 1), tone: 'warning' },
    { id: 'overdue', label: 'Overdue', value: stats.overdueTasks, total: Math.max(stats.totalTasks, 1), tone: 'danger' },
  ];
  const adminOverviewActivity = [
    { label: 'Project status', detail: db.projectDetails?.summary ? 'Project brief updated' : 'Project brief waiting for details', time: 'Now' },
    { label: 'Task pipeline', detail: db.tasks[0]?.title || 'No task assigned yet', time: 'Today' },
    { label: 'Team capacity', detail: `${db.users.length} active members in the workspace`, time: 'Live' },
    { label: 'Next milestone', detail: teamPulse.nextMilestone, time: teamPulse.nextDate },
  ];

  const filteredMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return db.users;
    return db.users.filter((member) => [member.full_name, member.academic_id, member.team_role, member.work_type].some((value) => (value || '').toLowerCase().includes(term)));
  }, [db.users, searchTerm]);

  const filteredTasks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return db.tasks.filter((task) => {
      const matchesStatus = taskFilter === 'All' || task.status === taskFilter;
      const matchesText = !term || [task.title, task.description].some((value) => (value || '').toLowerCase().includes(term));
      return matchesStatus && matchesText;
    });
  }, [db.tasks, searchTerm, taskFilter]);

  const recentActivity = useMemo(() => [
    { label: 'New task assigned', detail: db.tasks[0]?.title || 'No tasks yet' },
    { label: 'Latest announcement', detail: db.announcements[0]?.content || 'No announcements' },
    { label: 'Team strength', detail: `${db.users.length} active members` },
  ], [db]);

  const recentNotifications = useMemo(() => (db.notifications || []).slice(0, 8), [db.notifications]);

  const performanceData = useMemo(() => db.users.filter((member) => member.role === 'member').map((member) => {
    const memberTasks = db.tasks.filter((task) => task.assigneeId === member.id);
    const completed = memberTasks.filter((task) => task.status === 'Completed').length;
    const progress = memberTasks.length ? Math.round((completed / memberTasks.length) * 100) : 0;
    return { ...member, completed, total: memberTasks.length, progress };
  }), [db]);

  const handleCreateTask = () => {
    if (!taskForm.title || !taskForm.assigneeId) return;
    const newTask = {
      id: `t-${Date.now()}`,
      title: taskForm.title,
      description: taskForm.description,
      assigneeId: taskForm.assigneeId,
      priority: taskForm.priority,
      status: taskForm.status,
      deadline: taskForm.deadline,
      image: taskForm.image || '',
    };

    const nextDb = {
      ...db,
      tasks: [newTask, ...db.tasks],
      notifications: [
        { id: `n-${Date.now()}`, type: 'task', text: `${taskForm.title} was assigned to ${db.users.find((member) => member.id === taskForm.assigneeId)?.full_name || 'a team member'}.`, time: 'Just now' },
        ...(db.notifications || []),
      ],
    };
    setDb(nextDb);
    saveDatabase(nextDb);
    setTaskForm({ title: '', description: '', assigneeId: '', priority: 'Medium', status: 'Pending', deadline: '', image: '' });
  };

  const handleTaskImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await readFileAsDataUrl(file);
    setTaskForm({ ...taskForm, image: url });
    event.target.value = '';
  };

  const handleCreateAnnouncement = () => {
    if (!notice.content.trim()) return;
    const nextDb = {
      ...db,
      announcements: [{ id: `a-${Date.now()}`, content: notice.content, pinned: false }, ...db.announcements],
      notifications: [
        { id: `n-${Date.now()}`, type: 'announcement', text: `New announcement: ${notice.content.trim()}`, time: 'Just now' },
        ...(db.notifications || []),
      ],
    };
    setDb(nextDb);
    saveDatabase(nextDb);
    setNotice({ content: '' });
  };

  const handleChatMediaSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await readFileAsDataUrl(file);
    setChatMedia({ type: file.type.startsWith('audio/') ? 'audio' : 'image', url, name: file.name });
    event.target.value = '';
  };

  const handleSendAdminChat = () => {
    if (!chatInput.trim() && !chatMedia) return;

    const nextMessage = createMessageEntry(user.full_name, chatInput.trim(), selectedChat, chatMedia?.type || 'text', chatMedia?.url || '', Date.now());
    const nextDb = { ...db, messages: [...db.messages, nextMessage] };
    setDb(nextDb);
    saveDatabase(nextDb);
    setChatInput('');
    setChatMedia(null);
    setEditMessageId(null);
  };

  const handleDeleteMessage = (messageId) => {
    const entry = db.messages.find((item) => item.id === messageId);
    if (!entry || !canDeleteMessage(entry)) {
      return;
    }

    const nextDb = { ...db, messages: db.messages.filter((item) => item.id !== messageId) };
    setDb(nextDb);
    saveDatabase(nextDb);
  };

  const handleEditMessage = (messageId) => {
    const entry = db.messages.find((item) => item.id === messageId);
    if (!entry) return;
    setEditMessageId(messageId);
    setChatInput(entry.text || '');
  };

  const handleSaveEditedMessage = () => {
    if (!editMessageId) return;
    const nextDb = {
      ...db,
      messages: db.messages.map((item) => {
        if (item.id !== editMessageId) return item;
        const timestamp = Date.now();
        return { ...item, text: chatInput.trim(), time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), timestamp };
      }),
    };
    setDb(nextDb);
    saveDatabase(nextDb);
    setEditMessageId(null);
    setChatInput('');
  };

  const handleRemoveMember = (memberId) => {
    const member = db.users.find((person) => person.id === memberId);
    if (!member || member.role === 'admin') return;

    const nextDb = { ...db, users: removeMemberFromTeam(db.users, memberId), tasks: clearMemberAssignments(db.tasks, memberId) };
    setDb(nextDb);
    saveDatabase(nextDb);
  };

  const handleToggleMemberMute = (memberId) => {
    const nextDb = { ...db, users: setMemberMute(db.users, memberId, !db.users.find((person) => person.id === memberId)?.muted) };
    setDb(nextDb);
    saveDatabase(nextDb);
  };

  const handleClearMemberTasks = (memberId) => {
    const nextDb = { ...db, tasks: clearMemberAssignments(db.tasks, memberId) };
    setDb(nextDb);
    saveDatabase(nextDb);
  };

  const approveRequest = (requestId) => {
    const request = db.joinRequests.find((item) => item.id === requestId);
    if (!request) return;

    const approvedUser = {
      id: `u-${Date.now()}`,
      full_name: request.full_name,
      academic_id: request.academic_id,
      password: request.password,
      team_role: request.team_role,
      work_type: request.work_type,
      role: 'member',
      team_name: TEAM_NAME,
      bio: request.bio || 'No bio added yet.',
      avatar: request.avatar || '',
    };

    const nextDb = { ...db, users: [approvedUser, ...db.users], joinRequests: db.joinRequests.filter((item) => item.id !== requestId) };
    setDb(nextDb);
    saveDatabase(nextDb);
  };

  const updateTaskStatus = (taskId, status) => {
    const nextDb = { ...db, tasks: db.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)) };
    setDb(nextDb);
    saveDatabase(nextDb);
  };

  const handleCreateMeeting = () => {
    if (!meetingForm.title || !meetingForm.date || !meetingForm.time) return;
    const nextDb = {
      ...db,
      meetings: [{ id: `mt-${Date.now()}`, title: meetingForm.title, date: meetingForm.date, time: meetingForm.time, location: meetingForm.location || 'Team room', createdBy: user.full_name }, ...(db.meetings || [])],
      notifications: [
        { id: `n-${Date.now()}`, type: 'meeting', text: `Meeting scheduled: ${meetingForm.title} on ${meetingForm.date} at ${meetingForm.time}.`, time: 'Just now' },
        ...(db.notifications || []),
      ],
    };
    setDb(nextDb);
    saveDatabase(nextDb);
    setMeetingForm({ title: '', date: '', time: '', location: '' });
  };

  const handleProjectGalleryUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const nextGallery = [];
    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file);
      nextGallery.push(dataUrl);
    }

    const mergedGallery = [...projectForm.gallery, ...nextGallery].slice(0, 6);
    setProjectForm({ ...projectForm, gallery: mergedGallery });
    event.target.value = '';
  };

  const handleSaveProjectDetails = () => {
    const nextProject = {
      title: projectForm.title || 'BRAINX TEAM',
      summary: projectForm.summary || 'No project summary yet.',
      image: projectForm.image || '',
      gallery: projectForm.gallery || [],
    };

    const nextDb = { ...db, projectDetails: nextProject };
    setDb(nextDb);
    saveDatabase(nextDb);
  };

  const handleDeleteMeeting = (meetingId) => {
    const nextDb = { ...db, meetings: (db.meetings || []).filter((meeting) => meeting.id !== meetingId) };
    setDb(nextDb);
    saveDatabase(nextDb);
  };

  const handleSaveReview = () => {
    if (!reviewForm.memberId) return;
    const nextDb = { ...db, reviews: [...(db.reviews || []).filter((item) => item.memberId !== reviewForm.memberId), { id: `r-${Date.now()}`, memberId: reviewForm.memberId, score: Number(reviewForm.score), note: reviewForm.note || 'No note', createdAt: new Date().toISOString() }] };
    setDb(nextDb);
    saveDatabase(nextDb);
    setReviewForm({ memberId: '', score: '9', note: '' });
  };

  const handleAdminAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setProfileForm({ ...profileForm, avatar: dataUrl });
    event.target.value = '';
  };

  const handleSaveAdminProfile = () => {
    const nextUser = {
      ...user,
      full_name: profileForm.full_name || user.full_name,
      team_role: profileForm.team_role || user.team_role,
      bio: profileForm.bio || 'No biography added yet.',
      avatar: profileForm.avatar || '',
    };

    const nextDb = {
      ...db,
      users: db.users.map((person) => person.id === user.id ? {
        ...person,
        full_name: nextUser.full_name,
        team_role: nextUser.team_role,
        bio: nextUser.bio,
        avatar: nextUser.avatar,
      } : person),
    };

    setCurrentUser(nextUser);
    setDb(nextDb);
    saveDatabase(nextDb);
  };

  const handleLogout = () => {
    clearCurrentUser();
    window.location.href = '/login';
  };

  const handleApproveJoinRequest = (requestId) => {
    const request = db.joinRequests.find((item) => item.id === requestId);
    if (!request) return;

    const approvedUser = {
      id: `u-${Date.now()}`,
      full_name: request.full_name,
      academic_id: request.academic_id,
      password: request.password,
      team_role: request.team_role,
      work_type: request.work_type,
      role: 'member',
      team_name: TEAM_NAME,
      muted: false,
      bio: request.bio || 'No bio added yet.',
      avatar: request.avatar || '',
      last_active: new Date().toISOString(),
    };

    const nextDb = {
      ...db,
      users: [approvedUser, ...db.users],
      joinRequests: db.joinRequests.filter((item) => item.id !== requestId),
      notifications: [
        { id: `n-${Date.now()}`, type: 'system', text: `${request.full_name} was approved to join the team.`, time: 'Just now' },
        ...(db.notifications || []),
      ],
    };

    setDb(nextDb);
    saveDatabase(nextDb);
  };

  const handleRejectJoinRequest = (requestId) => {
    const nextDb = {
      ...db,
      joinRequests: db.joinRequests.filter((item) => item.id !== requestId),
      notifications: [
        { id: `n-${Date.now()}`, type: 'system', text: 'A join request was rejected by the admin.', time: 'Just now' },
        ...(db.notifications || []),
      ],
    };

    setDb(nextDb);
    saveDatabase(nextDb);
  };

  return (
    <DashboardShell title="Admin Dashboard" user={user} onLogout={handleLogout} navItems={adminNavItems} activeNav={selectedTab} onNavChange={setSelectedTab}>
      <section className="admin-tabs">
        <button type="button" className={selectedTab === 'overview' ? 'tab-btn active' : 'tab-btn'} onClick={() => setSelectedTab('overview')}>Overview</button>
        <button type="button" className={selectedTab === 'profile' ? 'tab-btn active' : 'tab-btn'} onClick={() => setSelectedTab('profile')}>Profile</button>
        <button type="button" className={selectedTab === 'members' ? 'tab-btn active' : 'tab-btn'} onClick={() => setSelectedTab('members')}>Members</button>
        <button type="button" className={selectedTab === 'requests' ? 'tab-btn active' : 'tab-btn'} onClick={() => setSelectedTab('requests')}>Requests</button>
        <button type="button" className={selectedTab === 'notifications' ? 'tab-btn active' : 'tab-btn'} onClick={() => setSelectedTab('notifications')}>Notifications</button>
        <button type="button" className={selectedTab === 'tasks' ? 'tab-btn active' : 'tab-btn'} onClick={() => setSelectedTab('tasks')}>Tasks</button>
        <button type="button" className={selectedTab === 'meetings' ? 'tab-btn active' : 'tab-btn'} onClick={() => setSelectedTab('meetings')}>Meetings</button>
        <button type="button" className={selectedTab === 'project' ? 'tab-btn active' : 'tab-btn'} onClick={() => setSelectedTab('project')}>Project Details</button>
        <button type="button" className={selectedTab === 'chat' ? 'tab-btn active' : 'tab-btn'} onClick={() => setSelectedTab('chat')}>Chat</button>
        <button type="button" className={selectedTab === 'reports' ? 'tab-btn active' : 'tab-btn'} onClick={() => setSelectedTab('reports')}>Reports</button>
      </section>

      {(selectedTab === 'overview' || selectedTab === 'reports') && (
        <>
          <section className="stats-grid">
            <StatCard label="Total Members" value={stats.totalMembers} />
            <StatCard label="Total Tasks" value={stats.totalTasks} />
            <StatCard label="Completed" value={stats.completedTasks} />
            <StatCard label="Progress" value={`${stats.progress}%`} />
          </section>

          <section className="pulse-grid">
            <div className="pulse-card accent">
              <small>Team pulse</small>
              <strong>{teamPulse.score}%</strong>
              <span>{teamPulse.message}</span>
            </div>
            <div className="pulse-card">
              <small>Best performer</small>
              <strong>{teamPulse.topPerformer}</strong>
              <span>High delivery</span>
            </div>
            <div className="pulse-card">
              <small>Next milestone</small>
              <strong>{teamPulse.nextMilestone}</strong>
              <span>{teamPulse.nextDate}</span>
            </div>
          </section>

          <section className="overview-grid">
            <div className="panel">
              <div className="panel-header">
                <h3>Delivery overview</h3>
                <span>Live</span>
              </div>
              {reportBreakdown.map((item) => {
                const percent = Math.round((item.value / item.total) * 100);
                return (
                  <div key={item.id} className="metric-row">
                    <div className="metric-topline">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="bar-track">
                      <span className={`bar-fill ${item.tone}`} style={{ width: `${Math.min(100, percent)}%` }} />
                    </div>
                    <small>{Math.min(100, percent)}%</small>
                  </div>
                );
              })}
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Recent activity</h3>
                <span>Updated</span>
              </div>
              <div className="activity-list">
                {adminOverviewActivity.map((item) => (
                  <div key={item.label} className="activity-item">
                    <span className="dot" />
                    <div>
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </div>
                    <span className="activity-time">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {selectedTab === 'profile' && (
        <section className="panel">
          <div className="panel-header">
            <h3>My Profile</h3>
          </div>
          <div className="profile-editor">
            <div className="profile-editor-header">
              {profileForm.avatar ? <img src={profileForm.avatar} alt="Admin profile" className="profile-avatar" /> : <div className="profile-avatar placeholder">{user.full_name?.charAt(0) || 'A'}</div>}
              <div>
                <h4>{profileForm.full_name || user.full_name}</h4>
                <small>{profileForm.team_role || user.team_role}</small>
              </div>
            </div>
            <div className="form-grid compact">
              <input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} placeholder="Your name" />
              <input value={profileForm.team_role} onChange={(e) => setProfileForm({ ...profileForm, team_role: e.target.value })} placeholder="Your role" />
              <textarea rows="5" value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} placeholder="Write your biography or responsibilities..." />
              <input type="file" accept="image/*" onChange={handleAdminAvatarChange} />
              {profileForm.avatar && <img src={profileForm.avatar} alt="Profile preview" className="avatar-preview" />}
              <button type="button" onClick={handleSaveAdminProfile}>Save Profile</button>
            </div>
          </div>
        </section>
      )}

      {selectedTab === 'requests' && (
        <section className="panel">
          <div className="panel-header">
            <h3>Join Requests</h3>
            <span>{db.joinRequests.length} pending</span>
          </div>
          {db.joinRequests.length === 0 ? (
            <div className="empty-state">No pending requests right now.</div>
          ) : (
            <div className="stack-list">
              {db.joinRequests.map((request) => (
                <div key={request.id} className="mini-item request-item">
                  <div className="request-user">
                    {request.avatar ? <img src={request.avatar} alt={request.full_name} className="member-avatar" /> : <div className="member-avatar placeholder">{request.full_name?.charAt(0) || 'U'}</div>}
                    <div>
                      <strong>{request.full_name}</strong>
                      <small>{request.team_role} · {request.work_type}</small>
                      <small>{request.academic_id}</small>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button type="button" onClick={() => handleApproveJoinRequest(request.id)}>Accept</button>
                    <button type="button" className="danger" onClick={() => handleRejectJoinRequest(request.id)}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedTab === 'notifications' && (
        <section className="panel">
          <div className="panel-header">
            <h3>Notification Center</h3>
            <span>{db.notifications.length} updates</span>
          </div>
          {recentNotifications.length === 0 ? (
            <div className="empty-state">No notifications yet.</div>
          ) : (
            <div className="notification-list">
              {recentNotifications.map((item) => (
                <div key={item.id} className="notification-item">
                  <span className={`notification-dot ${item.type || 'system'}`} />
                  <div>
                    <strong>{item.text}</strong>
                    <small>{item.time}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {selectedTab === 'members' && (
        <>
          <section className="content-grid two-col">
            <div className="panel">
              <div className="panel-header">
                <h3>Team Members</h3>
                <span>{filteredMembers.length} total</span>
              </div>
              <div className="toolbar">
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search members..." />
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Work</th>
                      <th>Last Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <div className="member-cell">
                            {member.avatar ? <img src={member.avatar} alt={member.full_name} className="member-avatar" /> : <div className="member-avatar placeholder">{member.full_name?.charAt(0) || 'U'}</div>}
                            <span>{member.full_name}</span>
                          </div>
                        </td>
                        <td>{member.team_role}</td>
                        <td>{member.work_type}</td>
                        <td>
                          <span className="last-active-pill">{formatLastActive(member.last_active)}</span>
                        </td>
                        <td>
                          <div className="action-stack">
                            <button type="button" onClick={() => setReviewForm((prev) => ({ ...prev, memberId: member.id }))}>Evaluate</button>
                            <button type="button" className="danger" onClick={() => handleRemoveMember(member.id)}>Remove</button>
                            <button type="button" onClick={() => handleToggleMemberMute(member.id)}>{member.muted ? 'Unmute' : 'Mute'}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Evaluation</h3>
              </div>
              <div className="form-grid compact">
                <select value={reviewForm.memberId} onChange={(e) => setReviewForm({ ...reviewForm, memberId: e.target.value })}>
                  <option value="">Select member</option>
                  {memberOptions.map((member) => (
                    <option key={member.id} value={member.id}>{member.full_name}</option>
                  ))}
                </select>
                <select value={reviewForm.score} onChange={(e) => setReviewForm({ ...reviewForm, score: e.target.value })}>
                  <option value="10">10</option>
                  <option value="9">9</option>
                  <option value="8">8</option>
                  <option value="7">7</option>
                  <option value="6">6</option>
                  <option value="5">5</option>
                </select>
                <textarea rows="4" value={reviewForm.note} onChange={(e) => setReviewForm({ ...reviewForm, note: e.target.value })} placeholder="Write member evaluation notes..." />
                <button type="button" onClick={handleSaveReview}>Save Evaluation</button>
              </div>

              <div className="stack-list small-list">
                {(db.reviews || []).slice(0, 5).map((review) => {
                  const member = db.users.find((person) => person.id === review.memberId);
                  return (
                    <div key={review.id} className="mini-item">
                      <div>
                        <strong>{member ? member.full_name : 'Member'}</strong>
                        <small>{review.note}</small>
                      </div>
                      <span className="status-badge success">{review.score}/10</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {selectedTab === 'tasks' && (
        <section className="content-grid two-col">
          <div className="panel">
            <div className="panel-header">
              <h3>Assign Task</h3>
            </div>
            <div className="form-grid compact">
              <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" />
              <textarea value={taskForm.description} rows="3" onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Task description" />
              <select value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}>
                <option value="">Select member</option>
                {memberOptions.map((member) => (
                  <option key={member.id} value={member.id}>{member.full_name}</option>
                ))}
              </select>
              <div className="inline-row">
                <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} />
              <label className="file-button">
                <input type="file" accept="image/*" onChange={handleTaskImageSelect} />
                Attach task image
              </label>
              {taskForm.image && <img src={taskForm.image} alt="Task preview" className="chat-preview-image" />}
              <button type="button" onClick={handleCreateTask}>Add Task</button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Tasks Overview</h3>
              <div className="toolbar small">
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search tasks..." />
                <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div className="task-list">
              {filteredTasks.map((task) => {
                const assignee = db.users.find((member) => member.id === task.assigneeId);
                return (
                  <div key={task.id} className="task-item">
                    <div>
                      <strong>{task.title}</strong>
                      <small>{assignee ? assignee.full_name : 'Unassigned'}</small>
                      {task.image ? <img src={task.image} alt="Task attachment" className="chat-media" /> : null}
                    </div>
                    <div className="task-meta">
                      <span className={`pill ${task.priority.toLowerCase()}`}>{task.priority}</span>
                      <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value)}>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {selectedTab === 'meetings' && (
        <section className="content-grid two-col">
          <div className="panel">
            <div className="panel-header">
              <h3>Add Meeting</h3>
            </div>
            <div className="form-grid compact">
              <input value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} placeholder="Meeting title" />
              <div className="inline-row">
                <input type="date" value={meetingForm.date} onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })} />
                <input type="time" value={meetingForm.time} onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })} />
              </div>
              <input value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} placeholder="Meeting location" />
              <button type="button" onClick={handleCreateMeeting}>Save Meeting</button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Meeting Schedules</h3>
            </div>
            <div className="stack-list">
              {(db.meetings || []).map((meeting) => (
                <div key={meeting.id} className="mini-item">
                  <div>
                    <strong>{meeting.title}</strong>
                    <small>{meeting.date} · {meeting.time} · {meeting.location}</small>
                  </div>
                  <button type="button" className="danger" onClick={() => handleDeleteMeeting(meeting.id)}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {selectedTab === 'project' && (
        <section className="content-grid two-col">
          <div className="panel">
            <div className="panel-header">
              <h3>Project Details</h3>
            </div>
            <div className="form-grid compact">
              <input value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} placeholder="Project title" />
              <textarea rows="6" value={projectForm.summary} onChange={(e) => setProjectForm({ ...projectForm, summary: e.target.value })} placeholder="Write the project overview, objective and details..." />
              <label className="file-button">
                <input type="file" accept="image/*" onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const dataUrl = await readFileAsDataUrl(file);
                  setProjectForm({ ...projectForm, image: dataUrl });
                  event.target.value = '';
                }} />
                Add main project image
              </label>
              {projectForm.image && <img src={projectForm.image} alt="Project cover" className="chat-preview-image" />}
              <label className="file-button">
                <input type="file" accept="image/*" multiple onChange={handleProjectGalleryUpload} />
                Add gallery images
              </label>
              <button type="button" onClick={handleSaveProjectDetails}>Save project details</button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Preview</h3>
            </div>
            <div className="project-preview">
              <h4>{projectForm.title || 'BRAINX TEAM'}</h4>
              <p>{projectForm.summary || 'Project details will appear here for all members.'}</p>
              {projectForm.image && <img src={projectForm.image} alt="Project preview" className="chat-preview-image" />}
              {projectForm.gallery.length > 0 && (
                <div className="gallery-grid">
                  {projectForm.gallery.map((item, index) => (
                    <img key={`${item}-${index}`} src={item} alt={`Project gallery ${index + 1}`} className="chat-media" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {selectedTab === 'reports' && (
        <section className="content-grid two-col">
          <div className="panel">
            <div className="panel-header">
              <h3>Performance Reports</h3>
            </div>
            <div className="stack-list">
              <div className="mini-item">
                <div>
                  <strong>Total members</strong>
                  <small>{stats.totalMembers} active members in the team</small>
                </div>
                <span className="status-badge success">{stats.totalMembers}</span>
              </div>
              <div className="mini-item">
                <div>
                  <strong>Task completion</strong>
                  <small>{stats.completedTasks} of {stats.totalTasks} tasks completed</small>
                </div>
                <span className="status-badge success">{stats.progress}%</span>
              </div>
              <div className="mini-item">
                <div>
                  <strong>Pending work</strong>
                  <small>{stats.pendingTasks} items still waiting</small>
                </div>
                <span className="status-badge warning">{stats.pendingTasks}</span>
              </div>
              <div className="mini-item">
                <div>
                  <strong>Overdue tasks</strong>
                  <small>{stats.overdueTasks} tasks need follow-up</small>
                </div>
                <span className="status-badge danger">{stats.overdueTasks}</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Progress distribution</h3>
            </div>
            {reportBreakdown.map((item) => {
              const percent = Math.round((item.value / item.total) * 100);
              return (
                <div key={item.id} className="metric-row compact">
                  <div className="metric-topline">
                    <span>{item.label}</span>
                    <strong>{percent}%</strong>
                  </div>
                  <div className="bar-track large">
                    <span className={`bar-fill ${item.tone}`} style={{ width: `${Math.min(100, percent)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {selectedTab === 'chat' && (
        <section className="panel">
          <div className="panel-header">
            <h3>Team Chat</h3>
          </div>
          <div className="chat-tabs">
            {chatTabs.map((tab) => (
              <button key={tab.id} type="button" className={selectedChat === tab.id ? 'tab-btn active' : 'tab-btn'} onClick={() => setSelectedChat(tab.id)}>{tab.label}</button>
            ))}
          </div>
          <div className="chat-box">
            {currentChatMessages.map((entry) => (
              <div key={entry.id} className="chat-line">
                <div className="chat-author-row">
                  <strong>{entry.sender}</strong>
                  {entry.sender === user.full_name || user.role === 'admin' ? (
                    <div className="inline-actions">
                      <button type="button" className="small-btn" onClick={() => handleEditMessage(entry.id)}>Edit</button>
                      {canDeleteMessage(entry) && <button type="button" className="small-btn danger" onClick={() => handleDeleteMessage(entry.id)}>Delete</button>}
                    </div>
                  ) : null}
                </div>
                {entry.type === 'image' && entry.media ? <img src={entry.media} alt="Shared" className="chat-media" /> : null}
                {entry.type === 'audio' && entry.media ? <audio controls src={entry.media} className="chat-audio" /> : null}
                {entry.text ? <span>{entry.text}</span> : null}
                <small>{entry.time}</small>
              </div>
            ))}
          </div>
          <div className="chat-input-row">
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={editMessageId ? 'Edit message...' : 'Write a team message...'} />
            <label className="file-button">
              <input type="file" accept="image/*,audio/*" onChange={handleChatMediaSelect} />
              Attach
            </label>
            <button type="button" onClick={editMessageId ? handleSaveEditedMessage : handleSendAdminChat}>{editMessageId ? 'Update' : 'Send'}</button>
          </div>
          {chatMedia && (
            <div className="chat-preview">
              {chatMedia.type === 'image' ? <img src={chatMedia.url} alt="Preview" className="chat-preview-image" /> : <audio controls src={chatMedia.url} className="chat-audio" />}
              <button type="button" className="clear-preview" onClick={() => setChatMedia(null)}>Remove</button>
            </div>
          )}
        </section>
      )}
    </DashboardShell>
  );
}

function MemberDashboard() {
  const user = getCurrentUser();
  const [db, setDb] = useState(getDatabase());
  const [message, setMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState('general');
  const [selectedSection, setSelectedSection] = useState('overview');
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', bio: user?.bio || '', avatar: user?.avatar || '' });
  const [chatMedia, setChatMedia] = useState(null);
  const [editMessageId, setEditMessageId] = useState(null);

  useEffect(() => {
    setDb(getDatabase());
  }, []);

  useEffect(() => {
    setProfileForm({ full_name: user?.full_name || '', bio: user?.bio || '', avatar: user?.avatar || '' });
  }, [user?.full_name, user?.bio, user?.avatar]);

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'profile', label: 'Profile' },
    { id: 'project', label: 'Project Details' },
    { id: 'tasks', label: 'My Tasks' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'chat', label: 'Chat' },
  ];

  const memberRecord = db.users.find((person) => person.id === user.id);
  const projectDetails = db.projectDetails || { title: 'BRAINX TEAM', summary: 'No project details yet.', image: '', gallery: [] };
  const chatTabs = [{ id: 'general', label: 'General Chat' }];
  const currentChatMessages = db.messages.filter((entry) => !entry.channel || entry.channel === 'general');
  const myTasks = db.tasks.filter((task) => task.assigneeId === user.id);

  const memberPulse = useMemo(() => {
    const completed = myTasks.filter((task) => task.status === 'Completed').length;
    const total = myTasks.length || 1;
    const score = Math.round((completed / total) * 100);
    return {
      score,
      message: score >= 70 ? 'Excellent flow' : score >= 40 ? 'Solid progress' : 'Focus mode on',
      nextTask: myTasks.find((task) => task.status !== 'Completed')?.title || 'All tasks cleared',
      taskCount: myTasks.length,
    };
  }, [myTasks]);

  const handleStatusChange = (taskId, status) => {
    const nextDb = { ...db, tasks: db.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)) };
    setDb(nextDb);
    saveDatabase(nextDb);
  };

  const handleSaveProfile = () => {
    const nextUser = { ...user, full_name: profileForm.full_name || user.full_name, bio: profileForm.bio || 'No biography added yet.', avatar: profileForm.avatar || '' };
    setCurrentUser(nextUser);

    const nextDb = { ...db, users: db.users.map((person) => (person.id === user.id ? { ...person, full_name: nextUser.full_name, bio: nextUser.bio, avatar: nextUser.avatar } : person)) };
    setDb(nextDb);
    saveDatabase(nextDb);
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setProfileForm({ ...profileForm, avatar: dataUrl });
  };

  const handleChatMediaSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = await readFileAsDataUrl(file);
    setChatMedia({ type: file.type.startsWith('audio/') ? 'audio' : 'image', url, name: file.name });
    event.target.value = '';
  };

  const handleSendMessage = () => {
    if (memberRecord?.muted) return;
    if (!message.trim() && !chatMedia) return;

    const newMessage = createMessageEntry(user.full_name, message.trim(), 'general', chatMedia?.type || 'text', chatMedia?.url || '', Date.now());
    const nextDb = { ...db, messages: [...db.messages, newMessage] };
    setDb(nextDb);
    saveDatabase(nextDb);
    setMessage('');
    setChatMedia(null);
    setEditMessageId(null);
  };

  const handleDeleteMessage = (messageId) => {
    const entry = db.messages.find((item) => item.id === messageId);
    if (!entry || !canDeleteMessage(entry)) return;

    const nextDb = { ...db, messages: db.messages.filter((item) => item.id !== messageId) };
    setDb(nextDb);
    saveDatabase(nextDb);
  };

  const handleEditMessage = (messageId) => {
    const entry = db.messages.find((item) => item.id === messageId);
    if (!entry) return;
    setEditMessageId(messageId);
    setMessage(entry.text || '');
  };

  const handleSaveEditedMessage = () => {
    if (!editMessageId) return;
    const nextDb = {
      ...db,
      messages: db.messages.map((item) => {
        if (item.id !== editMessageId) return item;
        const timestamp = Date.now();
        return { ...item, text: message.trim(), time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), timestamp };
      }),
    };
    setDb(nextDb);
    saveDatabase(nextDb);
    setMessage('');
    setEditMessageId(null);
  };

  const handleLogout = () => {
    clearCurrentUser();
    window.location.href = '/login';
  };

  const renderOverview = () => (
    <>
      <section className="stats-grid">
        <StatCard label="Welcome" value={user.full_name} />
        <StatCard label="Academic ID" value={user.academic_id} />
        <StatCard label="Role" value={user.team_role} />
        <StatCard label="Work Type" value={user.work_type} />
      </section>

      <div className="welcome-banner">
        <strong>مرحبا بك {user.full_name}</strong>
        <span>أنت الآن داخل فريق {TEAM_NAME} ⚡</span>
      </div>

      <section className="panel">
        <div className="panel-header">
          <h3>Project Details</h3>
        </div>
        <div className="project-preview">
          <h4>{projectDetails.title || 'BRAINX TEAM'}</h4>
          <p>{projectDetails.summary || 'Project details will appear here for all members.'}</p>
          {projectDetails.image && <img src={projectDetails.image} alt="Project cover" className="chat-preview-image" />}
          {projectDetails.gallery?.length > 0 && (
            <div className="gallery-grid">
              {projectDetails.gallery.map((item, index) => (
                <img key={`${item}-${index}`} src={item} alt={`Project gallery ${index + 1}`} className="chat-media" />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pulse-grid">
        <div className="pulse-card accent">
          <small>Your momentum</small>
          <strong>{memberPulse.score}%</strong>
          <span>{memberPulse.message}</span>
        </div>
        <div className="pulse-card">
          <small>Active work</small>
          <strong>{memberPulse.taskCount}</strong>
          <span>Assigned tasks</span>
        </div>
        <div className="pulse-card">
          <small>Next focus</small>
          <strong>{memberPulse.nextTask}</strong>
          <span>Priority task</span>
        </div>
      </section>

      <section className="content-grid two-col">
        <div className="panel">
          <div className="panel-header">
            <h3>Profile</h3>
          </div>
          <div className="profile-card">
            {user.avatar ? <img src={user.avatar} alt={user.full_name} className="profile-avatar" /> : <div className="profile-avatar placeholder">{user.full_name?.charAt(0) || 'U'}</div>}
            <div>
              <h4>{user.full_name}</h4>
              <p>{user.team_role}</p>
              <small>{user.academic_id}</small>
            </div>
          </div>
          <div className="bio-box">
            <strong>Bio</strong>
            <p>{user.bio || 'No biography added yet.'}</p>
          </div>
        </div>
      </section>
    </>
  );

  const renderProfile = () => (
    <section className="panel">
      <div className="panel-header">
        <h3>Profile Settings</h3>
      </div>
      <div className="profile-editor">
        <div className="profile-editor-header">
          {profileForm.avatar ? <img src={profileForm.avatar} alt="Profile" className="profile-avatar" /> : <div className="profile-avatar placeholder">{user.full_name?.charAt(0) || 'U'}</div>}
          <div>
            <h4>{profileForm.full_name}</h4>
            <small>{user.team_role}</small>
          </div>
        </div>
        <div className="form-grid compact">
          <input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} placeholder="Your name" />
          <textarea value={profileForm.bio} rows="5" onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} placeholder="Write your biography or skills here..." />
          <input type="file" accept="image/*" onChange={handleAvatarChange} />
          {profileForm.avatar && <img src={profileForm.avatar} alt="Preview" className="avatar-preview" />}
          <button type="button" onClick={handleSaveProfile}>Save Profile</button>
        </div>
      </div>
    </section>
  );

  const renderProject = () => (
    <section className="panel">
      <div className="panel-header">
        <h3>Project Details</h3>
      </div>
      <div className="project-preview">
        <h4>{projectDetails.title || 'BRAINX TEAM'}</h4>
        <p>{projectDetails.summary || 'Project details will appear here for all members.'}</p>
        {projectDetails.image && <img src={projectDetails.image} alt="Project cover" className="chat-preview-image" />}
        {projectDetails.gallery?.length > 0 && (
          <div className="gallery-grid">
            {projectDetails.gallery.map((item, index) => (
              <img key={`${item}-${index}`} src={item} alt={`Project gallery ${index + 1}`} className="chat-media" />
            ))}
          </div>
        )}
      </div>
    </section>
  );

  const renderTasks = () => (
    <section className="panel">
      <div className="panel-header">
        <h3>My Tasks</h3>
        <span>{myTasks.length} tasks</span>
      </div>
      <div className="task-list">
        {myTasks.length === 0 ? (
          <div className="task-item">
            <div>
              <strong>No tasks assigned</strong>
              <small>Nothing active right now.</small>
            </div>
          </div>
        ) : myTasks.map((task) => (
          <div key={task.id} className="task-item">
            <div>
              <strong>{task.title}</strong>
              <small>{task.description}</small>
              {task.image ? <img src={task.image} alt="Task attachment" className="chat-media" /> : null}
            </div>
            <div className="task-meta">
              <span className={`pill ${task.priority.toLowerCase()}`}>{task.priority}</span>
              <select value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderAnnouncements = () => (
    <section className="panel">
      <div className="panel-header">
        <h3>Announcements</h3>
      </div>
      <ul className="announcement-list">
        {db.announcements.map((item) => (
          <li key={item.id}>{item.content}</li>
        ))}
      </ul>
    </section>
  );

  const renderChat = () => (
    <section className="panel">
      <div className="panel-header">
        <h3>General Chat</h3>
      </div>
      <div className="chat-box">
        {currentChatMessages.map((entry) => (
          <div key={entry.id} className="chat-line">
            <div className="chat-author-row">
              <strong>{entry.sender}</strong>
              {entry.sender === user.full_name ? (
                <div className="inline-actions">
                  <button type="button" className="small-btn" onClick={() => handleEditMessage(entry.id)}>Edit</button>
                  {canDeleteMessage(entry) && <button type="button" className="small-btn danger" onClick={() => handleDeleteMessage(entry.id)}>Delete</button>}
                </div>
              ) : null}
            </div>
            {entry.type === 'image' && entry.media ? <img src={entry.media} alt="Shared" className="chat-media" /> : null}
            {entry.type === 'audio' && entry.media ? <audio controls src={entry.media} className="chat-audio" /> : null}
            {entry.text ? <span>{entry.text}</span> : null}
            <small>{entry.time}</small>
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={editMessageId ? 'Edit message...' : 'Write a message...'} />
        <label className="file-button">
          <input type="file" accept="image/*,audio/*" onChange={handleChatMediaSelect} />
          Attach
        </label>
        <button type="button" onClick={editMessageId ? handleSaveEditedMessage : handleSendMessage} disabled={memberRecord?.muted}>{editMessageId ? 'Update' : 'Send'}</button>
      </div>
      {chatMedia && (
        <div className="chat-preview">
          {chatMedia.type === 'image' ? <img src={chatMedia.url} alt="Preview" className="chat-preview-image" /> : <audio controls src={chatMedia.url} className="chat-audio" />}
          <button type="button" className="clear-preview" onClick={() => setChatMedia(null)}>Remove</button>
        </div>
      )}
      {memberRecord?.muted && <div className="error-box">You are muted and cannot send messages.</div>}
    </section>
  );

  return (
    <DashboardShell title="Member Dashboard" user={user} onLogout={handleLogout} navItems={navItems} activeNav={selectedSection} onNavChange={setSelectedSection}>
      {selectedSection === 'overview' && renderOverview()}
      {selectedSection === 'profile' && renderProfile()}
      {selectedSection === 'tasks' && renderTasks()}
      {selectedSection === 'announcements' && renderAnnouncements()}
      {selectedSection === 'chat' && renderChat()}
    </DashboardShell>
  );
}

function App() {
  const user = getCurrentUser();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/member') : '/login'} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/member" element={<ProtectedRoute allowedRole="member"><MemberDashboard /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
