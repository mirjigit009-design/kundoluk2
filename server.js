const express = require('express');
const cors = require('cors');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// ========== БАЗА ДАННЫХ ==========
let database = {
  users: [],
  students: [],
  tasks: [],
  grades: [],
  messages: [],
  teacherChat: [],
  globalChat: [],
  studentChat: [],
  actionLog: []
};

function initDB() {
  // Учителя и админ
  database.users = [
    { id: 1, login: "maxsovs", password: "00912tor", name: "Торобаев Миржигит", role: "teacher", banned: false },
    { id: 2, login: "elkades", password: "34762elk", name: "Айтымбетов Элназар", role: "teacher", banned: false },
    { id: 3, login: "ayanaaa", password: "87543ya", name: "Илесбекова Аяна", role: "teacher", banned: false },
    { id: 999, login: "godmode", password: "adminroot", name: "Администратор", role: "admin", banned: false }
  ];
  
  // Ученики
  const studentsList = [
    { id: 100, name: "Акрамбекова Медина", login: "medina_ak", password: "medina2024" },
    { id: 101, name: "Акунжанов Айбек", login: "aibonia", password: "232376ak" },
    { id: 102, name: "Амиракулова Айсу", login: "aisu_amir", password: "aisu777" },
    { id: 103, name: "Акылбекова Айсулуу", login: "aisuluu_a", password: "aisuluu88" },
    { id: 104, name: "Асанакунов Канат", login: "kanat_as", password: "kanat1234" },
    { id: 105, name: "Асекова Нурзат", login: "nurzat_as", password: "nurzat55" },
    { id: 106, name: "Бектурсунов Билал", login: "bilal_bt", password: "bilal909" },
    { id: 107, name: "Дөөлөтбеков Байэл", login: "bayel_d", password: "bayel321" },
    { id: 108, name: "Джекшенбаева Азиза", login: "aziza_dj", password: "aziza77" },
    { id: 109, name: "Жумаева Нурия", login: "nuria_zh", password: "nuria111" },
    { id: 110, name: "Ибраимова Аруна", login: "aruna_ib", password: "aruna555" },
    { id: 111, name: "Исманов Ибрагим", login: "ibragim_is", password: "ibragim22" },
    { id: 112, name: "Кадырова Рамина", login: "ramina_k", password: "ramina66" },
    { id: 113, name: "Камчыбекова Анара", login: "anara_kam", password: "anara777" },
    { id: 114, name: "Канатбек уулу Хамзат", login: "hamzat_k", password: "hamzat888" },
    { id: 115, name: "Маметов Алинур", login: "alinur_m", password: "alinur99" },
    { id: 116, name: "Муктарбекова Диана", login: "diana_muk", password: "diana000" },
    { id: 117, name: "Насырова Нуршоола", login: "nurshola_n", password: "nurshola12" },
    { id: 118, name: "Орозалиев Алихан", login: "alihan_o", password: "alihan45" },
    { id: 119, name: "Тагайбеков Нурдин", login: "nurdin_t", password: "nurdin67" },
    { id: 120, name: "Турсунбаева Аяна", login: "ayana_tur", password: "turayana89" },
    { id: 121, name: "Шаршенбиева Айбийке", login: "aybiyke_sh", password: "aybiyke23" },
    { id: 122, name: "Шайлообаева Суламита", login: "sulamita_sh", password: "sulamita34" },
    { id: 123, name: "Өмүрсаков Бекмир", login: "bekmir_om", password: "bekmir56" }
  ];
  
  studentsList.forEach(s => {
    database.users.push({ ...s, role: "student", banned: false });
    database.students.push(s);
  });
  
  database.students.sort((a,b) => a.name.localeCompare(b.name, 'ru'));
  
  // Задания
  database.tasks = [
    { id: 1, title: "Контрольная по математике", description: "Дроби, проценты, уравнения", teacher_id: 1 },
    { id: 2, title: "Сочинение по литературе", description: "Мой любимый герой", teacher_id: 1 },
    { id: 3, title: "Тест по истории КР", description: "Древние цивилизации", teacher_id: 2 },
    { id: 4, title: "Проект по биологии", description: "Экосистемы", teacher_id: 2 },
    { id: 5, title: "Лабораторная по физике", description: "Измерение скорости", teacher_id: 3 },
    { id: 6, title: "Эссе по английскому", description: "My future profession", teacher_id: 3 }
  ];
  
  database.grades = [];
  database.messages = [];
  database.teacherChat = [];
  database.globalChat = [];
  database.studentChat = [];
  database.actionLog = [];
}

initDB();

// ========== API ==========
app.get('/api/data', (req, res) => res.json(database));

app.post('/api/update', (req, res) => {
  const { table, data, action } = req.body;
  
  if (action === 'add') {
    if (!database[table]) database[table] = [];
    database[table].push(data);
    io.emit('data-updated', { table, data, action: 'add' });
  } else if (action === 'update') {
    const idx = database[table].findIndex(i => i.id === data.id);
    if (idx !== -1) database[table][idx] = { ...database[table][idx], ...data };
    io.emit('data-updated', { table, data, action: 'update' });
  } else if (action === 'delete') {
    database[table] = database[table].filter(i => i.id !== data.id);
    io.emit('data-updated', { table, data, action: 'delete' });
  }
  res.json({ success: true });
});

io.on('connection', (socket) => {
  console.log('✅ Пользователь подключился');
  socket.emit('initial-data', database);
});

// ========== ОТДАЁМ HTML ==========
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, viewport-fit=cover">
    <title>Электронный дневник — Онлайн</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #1a1f2e 0%, #0f1219 100%);
            min-height: 100vh;
            padding: 16px;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }
        .app-container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 32px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 18px 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .logo { font-size: 1.5rem; font-weight: 700; color: white; }
        .user-info { background: rgba(255,255,255,0.15); padding: 8px 20px; border-radius: 40px; display: flex; gap: 16px; align-items: center; }
        button { background: #4f46e5; border: none; color: white; padding: 10px 24px; border-radius: 40px; cursor: pointer; font-weight: 600; transition: 0.2s; }
        button.primary { background: #10b981; }
        button.danger { background: #ef4444; }
        button.warning { background: #f59e0b; }
        button.small { padding: 6px 16px; font-size: 0.8rem; }
        button:active { transform: scale(0.96); }
        .main-panel { display: flex; flex-wrap: wrap; min-height: calc(100vh - 80px); }
        .sidebar { background: #f8fafc; width: 280px; padding: 24px 16px; border-right: 1px solid #e2e8f0; }
        .nav-btn { display: flex; align-items: center; gap: 12px; width: 100%; background: transparent; color: #475569; margin-bottom: 8px; padding: 12px 16px; border-radius: 16px; font-weight: 500; font-size: 0.95rem; cursor: pointer; border: none; text-align: left; }
        .nav-btn:hover { background: #e2e8f0; }
        .nav-btn.active { background: #6366f1; color: white; }
        .content { flex: 1; padding: 28px; background: #f8fafc; }
        .card { background: white; border-radius: 24px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef2ff; }
        .card h3 { margin-bottom: 20px; font-size: 1.3rem; color: #1e293b; border-left: 4px solid #6366f1; padding-left: 16px; }
        .table-wrapper { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; }
        .grade-badge { display: inline-block; padding: 4px 12px; border-radius: 30px; font-weight: 600; font-size: 0.8rem; }
        .grade-5 { background: #d1fae5; color: #065f46; }
        .grade-4 { background: #dbeafe; color: #1e40af; }
        .grade-3 { background: #fed7aa; color: #9a3412; }
        .grade-2 { background: #fee2e2; color: #991b1b; }
        .grade-1 { background: #fecaca; color: #7f1d1d; }
        .chat-container { max-height: 400px; overflow-y: auto; margin-bottom: 20px; padding: 16px; background: #fafcff; border-radius: 20px; }
        .chat-bubble { background: #eef2ff; padding: 12px 16px; border-radius: 20px; margin-bottom: 12px; max-width: 80%; word-wrap: break-word; }
        .chat-bubble.own { background: #6366f1; color: white; margin-left: auto; }
        .chat-bubble small { font-size: 0.65rem; opacity: 0.7; display: block; margin-top: 5px; }
        input, select, textarea { border-radius: 40px; border: 1px solid #e2e8f0; padding: 12px 18px; width: 100%; margin-bottom: 14px; }
        .flex-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
        .login-box { max-width: 460px; margin: 80px auto; background: white; border-radius: 40px; padding: 40px; text-align: center; box-shadow: 0 30px 60px -20px rgba(0,0,0,0.4); }
        .admin-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 20px; }
        .stat-card { background: #f8fafc; padding: 16px; border-radius: 20px; text-align: center; }
        .stat-number { font-size: 2rem; font-weight: 700; color: #6366f1; }
        details { margin-bottom: 16px; background: #f8fafc; border-radius: 16px; padding: 12px; }
        summary { cursor: pointer; font-weight: 600; padding: 8px; color: #6366f1; }
        .badge-teacher { background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .badge-student { background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .badge-admin { background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
        .online-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #22c55e; margin-left: 8px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @media (max-width: 768px) {
            .sidebar { width: 100%; border-right: none; border-bottom: 1px solid #e2e8f0; display: flex; flex-wrap: wrap; gap: 8px; }
            .nav-btn { width: auto; display: inline-flex; padding: 8px 16px; }
            .content { padding: 16px; }
            .chat-bubble { max-width: 95%; }
            .flex-row { flex-direction: column; }
            .admin-stats { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
<div id="app"></div>
<script>
    let socket = null;
    let currentUser = null;
    let currentView = "dashboard";
    let DB = { users: [], students: [], tasks: [], grades: [], messages: [], teacherChat: [], globalChat: [], studentChat: [], actionLog: [] };
    
    function connectSocket() {
        socket = io();
        socket.on('initial-data', (data) => { DB = data; render(); });
        socket.on('data-updated', ({ table, data, action }) => {
            if (action === 'add') { if (!DB[table]) DB[table] = []; DB[table].push(data); }
            else if (action === 'update') { const idx = DB[table].findIndex(i => i.id === data.id); if (idx !== -1) DB[table][idx] = { ...DB[table][idx], ...data }; }
            else if (action === 'delete') { DB[table] = DB[table].filter(i => i.id !== data.id); }
            render();
        });
    }
    
    async function apiUpdate(table, data, action) {
        await fetch('/api/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table, data, action })
        });
    }
    
    function getAllStudents() { return [...DB.students].sort((a,b) => a.name.localeCompare(b.name, 'ru')); }
    function getTasksByTeacher(tid) { return DB.tasks.filter(t => t.teacher_id === tid); }
    function getGrade(sid, tid) { return DB.grades.find(g => g.student_id === sid && g.task_id === tid); }
    function getMessagesForTeacher(tid) { return DB.messages.filter(m => m.to_id === tid); }
    function getStudentMessages(sid, tid) { return DB.messages.filter(m => m.from_id === sid && m.to_id === tid); }
    
    async function addMessageToTeacher(from, to, text) {
        await apiUpdate('messages', { id: Date.now(), from_id: from, to_id: to, text, date: new Date().toISOString() }, 'add');
    }
    async function addTeacherChat(from, text) {
        await apiUpdate('teacherChat', { id: Date.now(), from_id: from, text, date: new Date().toISOString() }, 'add');
    }
    async function addGlobalChat(uid, uname, text) {
        await apiUpdate('globalChat', { id: Date.now(), user_id: uid, user_name: uname, text, date: new Date().toISOString() }, 'add');
    }
    async function addStudentChat(uid, uname, text) {
        await apiUpdate('studentChat', { id: Date.now(), user_id: uid, user_name: uname, text, date: new Date().toISOString() }, 'add');
    }
    async function setGrade(sid, tid, val) {
        let existing = DB.grades.find(g => g.student_id === sid && g.task_id === tid);
        if (existing) await apiUpdate('grades', { id: existing.id, value: val }, 'update');
        else await apiUpdate('grades', { id: Date.now(), student_id: sid, task_id: tid, value: val }, 'add');
    }
    async function addTask(title, desc, tid) {
        await apiUpdate('tasks', { id: Date.now(), title, description: desc, teacher_id: tid }, 'add');
    }
    async function deleteTask(tid) {
        await apiUpdate('tasks', { id: tid }, 'delete');
        for (let g of DB.grades.filter(g => g.task_id === tid)) await apiUpdate('grades', { id: g.id }, 'delete');
    }
    async function toggleBan(userId) {
        let user = DB.users.find(u => u.id === userId);
        if(user && user.role !== 'admin') await apiUpdate('users', { id: userId, banned: !user.banned }, 'update');
    }
    async function resetPassword(userId, newPass) {
        await apiUpdate('users', { id: userId, password: newPass }, 'update');
    }
    async function promoteToTeacher(studentId) {
        let student = DB.users.find(u => u.id === studentId && u.role === "student");
        if(student) {
            await apiUpdate('users', { id: studentId, role: "teacher", login: student.login + "_teacher" }, 'update');
            return true;
        }
        return false;
    }
    async function demoteToStudent(teacherId) {
        let teacher = DB.users.find(u => u.id === teacherId && u.role === "teacher");
        if(teacher && teacher.id !== 1 && teacher.id !== 2 && teacher.id !== 3 && teacher.id !== 999) {
            await apiUpdate('users', { id: teacherId, role: "student", login: teacher.login.replace("_teacher", "") }, 'update');
            return true;
        }
        return false;
    }
    async function addNewStudent(login, password, name) {
        if(DB.users.find(u => u.login === login)) return false;
        let newId = Math.max(...DB.users.map(u=>u.id), 0) + 1;
        await apiUpdate('users', { id: newId, login, password, name, role: "student", banned: false }, 'add');
        await apiUpdate('students', { id: newId, name, login, password }, 'add');
        return true;
    }
    
    function login(login, pass) {
        let user = DB.users.find(u => u.login === login && u.password === pass);
        if (user && !user.banned) { currentUser = user; render(); return true; }
        return false;
    }
    function logout() { currentUser = null; render(); }
    
    function render() {
        const app = document.getElementById('app');
        if (!currentUser) {
            app.innerHTML = \`
                <div class="login-box">
                    <h2>📓 Электронный дневник <span class="online-dot"></span></h2>
                    <input type="text" id="loginInput" placeholder="Логин">
                    <input type="password" id="passInput" placeholder="Пароль">
                    <button id="loginBtn" class="primary" style="width:100%">Войти</button>
                    <hr style="margin: 24px 0;">
                    <div style="font-size: 0.7rem; color: #64748b;">
                        <p>👩‍🏫 Учителя: maxsovs / 00912tor | elkades / 34762elk | ayanaaa / 87543ya</p>
                        <p>👑 Админ: godmode / adminroot</p>
                        <p>👨‍🎓 Ученик Айбек: aibonia / 232376ak</p>
                        <p>✅ Сообщения видны всем в реальном времени!</p>
                    </div>
                </div>
            \`;
            document.getElementById('loginBtn')?.addEventListener('click', () => {
                if (login(document.getElementById('loginInput').value.trim(), document.getElementById('passInput').value.trim())) render();
                else alert("Неверный логин или пароль");
            });
            return;
        }
        
        const isAdmin = currentUser.role === 'admin';
        const isTeacher = currentUser.role === 'teacher' || isAdmin;
        const isStudent = currentUser.role === 'student';
        
        let sidebarHtml = \`
            <button class="nav-btn \${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">🏠 Главная</button>
            <button class="nav-btn \${currentView === 'tasks' ? 'active' : ''}" data-view="tasks">📚 Задания</button>
            <button class="nav-btn \${currentView === 'grades' ? 'active' : ''}" data-view="grades">⭐ Оценки</button>
        \`;
        if (isTeacher) sidebarHtml += \`<button class="nav-btn \${currentView === 'students' ? 'active' : ''}" data-view="students">👥 Ученики</button>\`;
        sidebarHtml += \`
            <button class="nav-btn \${currentView === 'messages' ? 'active' : ''}" data-view="messages">💬 Сообщения</button>
            <button class="nav-btn \${currentView === 'globalchat' ? 'active' : ''}" data-view="globalchat">🌍 Общий чат</button>
        \`;
        if (isStudent) sidebarHtml += \`<button class="nav-btn \${currentView === 'studentchat' ? 'active' : ''}" data-view="studentchat">👨‍🎓 Чат учеников</button>\`;
        if (isTeacher) sidebarHtml += \`<button class="nav-btn \${currentView === 'teacherchat' ? 'active' : ''}" data-view="teacherchat">👥 Чат учителей</button>\`;
        if (isAdmin) sidebarHtml += \`<button class="nav-btn \${currentView === 'adminpanel' ? 'active' : ''}" data-view="adminpanel">⚙️ Админ-панель</button>\`;
        
        let contentHtml = "";
        if (currentView === "dashboard") contentHtml = renderDashboard(isTeacher);
        else if (currentView === "tasks") contentHtml = renderTasks(isTeacher);
        else if (currentView === "grades") contentHtml = renderGrades(isTeacher);
        else if (currentView === "students") contentHtml = renderStudents();
        else if (currentView === "messages") contentHtml = renderMessages(isTeacher);
        else if (currentView === "globalchat") contentHtml = renderGlobalChat();
        else if (currentView === "studentchat") contentHtml = renderStudentChat();
        else if (currentView === "teacherchat") contentHtml = renderTeacherChat();
        else if (currentView === "adminpanel") contentHtml = renderAdminPanel();
        
        app.innerHTML = \`
            <div class="app-container">
                <div class="header">
                    <div class="logo">📓 ЭЛЕКТРОННЫЙ ДНЕВНИК <span class="online-dot"></span></div>
                    <div class="user-info">
                        <span>\${escapeHtml(currentUser.name)}</span>
                        <span class="\${currentUser.role === 'admin' ? 'badge-admin' : (isTeacher ? 'badge-teacher' : 'badge-student')}">
                            \${currentUser.role === 'admin' ? 'Админ' : (isTeacher ? 'Учитель' : 'Ученик')}
                        </span>
                        <button id="logoutBtn" class="small danger">Выйти</button>
                    </div>
                </div>
                <div class="main-panel">
                    <div class="sidebar">\${sidebarHtml}</div>
                    <div class="content">\${contentHtml}</div>
                </div>
            </div>
        \`;
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { currentView = btn.getAttribute('data-view'); render(); });
        });
        document.getElementById('logoutBtn')?.addEventListener('click', () => logout());
        attachContentEvents(isTeacher);
    }
    
    function renderDashboard(isTeacher) {
        if (isTeacher) {
            return \`
                <div class="card"><h3>📊 Статистика</h3><div class="admin-stats"><div class="stat-card"><div class="stat-number">\${getAllStudents().length}</div><div>Учеников</div></div><div class="stat-card"><div class="stat-number">\${getTasksByTeacher(currentUser.id).length}</div><div>Заданий</div></div><div class="stat-card"><div class="stat-number">\${getMessagesForTeacher(currentUser.id).length}</div><div>Сообщений</div></div></div></div>
                <div class="card"><h3>✏️ Быстрые действия</h3><div class="flex-row"><button id="quickTaskBtn" class="primary">➕ Создать задание</button> <button id="quickGradeBtn">⭐ Выставить оценку</button></div></div>
            \`;
        } else {
            let doneCount = DB.tasks.filter(t => getGrade(currentUser.id, t.id)).length;
            return \`
                <div class="card"><h3>📖 Привет, \${escapeHtml(currentUser.name)}!</h3><div class="admin-stats"><div class="stat-card"><div class="stat-number">\${doneCount}</div><div>Выполнено</div></div><div class="stat-card"><div class="stat-number">\${DB.tasks.length}</div><div>Заданий</div></div></div></div>
                <div class="card"><h3>📢 Написать учителю</h3><button id="msgTeacherBtn" class="primary">📨 Отправить сообщение</button></div>
            \`;
        }
    }
    
    function renderTasks(isTeacher) {
        if (isTeacher) {
            let tasks = getTasksByTeacher(currentUser.id);
            let html = \`<div class="card"><h3>📌 Мои задания</h3><button id="newTaskBtn" class="primary" style="margin-bottom:16px;">➕ Создать задание</button><div class="table-wrapper"><table><thead><tr><th>#</th><th>Название</th><th>Описание</th><th></th></tr></thead><tbody>\`;
            tasks.forEach((t, idx) => {
                html += \`<tr><td>\${idx+1}</td><td><strong>\${escapeHtml(t.title)}</strong></td><td>\${escapeHtml(t.description)}</td><td><button class="small danger" data-taskdel="\${t.id}">🗑 Удалить</button></td></tr>\`;
            });
            if(tasks.length === 0) html += \`<tr><td colspan="4" style="text-align:center;">Нет заданий</td></tr>\`;
            html += \`</tbody></table></div></div>\`;
            return html;
        } else {
            let html = \`<div class="card"><h3>📋 Все задания</h3><div class="table-wrapper"><table><thead><tr><th>Задание</th><th>Учитель</th><th>Описание</th><th>Оценка</th></tr></thead><tbody>\`;
            DB.tasks.forEach(t => {
                let teacher = DB.users.find(u=>u.id===t.teacher_id);
                let grade = getGrade(currentUser.id, t.id);
                html += \`<tr><td><strong>\${escapeHtml(t.title)}</strong></td><td>\${teacher ? teacher.name : '—'}</td><td>\${escapeHtml(t.description)}</td><td><span class="grade-badge grade-\${grade ? grade.value : 'none'}">\${grade ? grade.value : '—'}</span></td></tr>\`;
            });
            html += \`</tbody></table></div></div>\`;
            return html;
        }
    }
    
    function renderGrades(isTeacher) {
        if (isTeacher) {
            let students = getAllStudents();
            let tasks = getTasksByTeacher(currentUser.id);
            if(tasks.length === 0) return \`<div class="card"><h3>⭐ Выставление оценок</h3><p>Сначала создайте задание</p></div>\`;
            let html = \`<div class="card"><h3>⭐ Выставление оценок (1-5)</h3>\`;
            students.forEach(s => {
                html += \`<div style="margin-top:20px; border-top:1px solid #e2e8f0; padding-top:16px;"><b>📌 \${escapeHtml(s.name)}</b>\`;
                tasks.forEach(t => {
                    let grade = getGrade(s.id, t.id);
                    let currentVal = grade ? grade.value : '';
                    html += \`<div class="flex-row"><span style="min-width:150px">\${escapeHtml(t.title)}</span>
                        <select id="grade_\${s.id}_\${t.id}" style="width:90px">
                            <option value="">—</option>
                            <option value="5" \${currentVal==='5' ? 'selected' : ''}>5</option>
                            <option value="4" \${currentVal==='4' ? 'selected' : ''}>4</option>
                            <option value="3" \${currentVal==='3' ? 'selected' : ''}>3</option>
                            <option value="2" \${currentVal==='2' ? 'selected' : ''}>2</option>
                            <option value="1" \${currentVal==='1' ? 'selected' : ''}>1</option>
                        </select>
                        <button class="small" data-grade-set='{"studentId":\${s.id},"taskId":\${t.id}}'>✔ Сохранить</button>
                    </div>\`;
                });
                html += \`</div>\`;
            });
            html += \`</div>\`;
            return html;
        } else {
            let myGrades = DB.grades.filter(g => g.student_id === currentUser.id);
            let html = \`<div class="card"><h3>📝 Мои оценки</h3><div class="table-wrapper"><table><thead><tr><th>Задание</th><th>Учитель</th><th>Оценка</th></tr></thead><tbody>\`;
            myGrades.forEach(g => {
                let task = DB.tasks.find(t => t.id === g.task_id);
                let teacher = DB.users.find(u => u.id === task?.teacher_id);
                html += \`<tr><td>\${task ? escapeHtml(task.title) : '—'}</td><td>\${teacher ? teacher.name : '—'}</td><td><span class="grade-badge grade-\${g.value}">\${g.value}</span></td></tr>\`;
            });
            if(myGrades.length === 0) html += \`<tr><td colspan="3" style="text-align:center;">Нет оценок</td></tr>\`;
            html += \`</tbody></table></div></div>\`;
            return html;
        }
    }
    
    function renderStudents() {
        let students = getAllStudents();
        let html = \`<div class="card"><h3>👨‍🎓 Список учеников</h3><div class="table-wrapper"><table><thead><tr><th>#</th><th>ID</th><th>Имя</th><th>Логин</th><th>Статус</th></tr></thead><tbody>\`;
        students.forEach((s, idx) => {
            let user = DB.users.find(u => u.id === s.id);
            let status = user?.banned ? '🔴 Забанен' : '🟢 Активен';
            html += \`<tr><td>\${idx+1}</td><td>\${s.id}</td><td><strong>\${escapeHtml(s.name)}</strong></td><td>\${escapeHtml(s.login)}</td><td>\${status}</td></tr>\`;
        });
        html += \`</tbody></table></div></div>\`;
        return html;
    }
    
    function renderMessages(isTeacher) {
        if (isTeacher) {
            let msgs = getMessagesForTeacher(currentUser.id);
            let html = \`<div class="card"><h3>💬 Сообщения от учеников</h3><div class="chat-container">\`;
            if(msgs.length === 0) html += \`<p style="text-align:center;">Нет сообщений</p>\`;
            msgs.forEach(m => {
                let student = DB.users.find(u => u.id === m.from_id);
                html += \`<div class="chat-bubble"><b>✉️ \${student ? student.name : 'Ученик'}:</b><br>\${escapeHtml(m.text)}<br><small>\${new Date(m.date).toLocaleString()}</small></div>\`;
            });
            html += \`</div></div><div class="card"><h3>📤 Ответить</h3>
                <select id="replyStudentSelect"><option value="">Выберите ученика</option>\${getAllStudents().map(s => \`<option value="\${s.id}">\${escapeHtml(s.name)}</option>\`).join('')}</select>
                <textarea id="replyText" rows="2"></textarea>
                <button id="sendReplyBtn" class="primary">Отправить</button>
            </div>\`;
            return html;
        } else {
            let teachersList = DB.users.filter(u => u.role === 'teacher');
            let html = \`<div class="card"><h3>📨 Учителям</h3>
                <select id="teacherSelect"><option value="">Выберите учителя</option>\${teachersList.map(t => \`<option value="\${t.id}">\${escapeHtml(t.name)}</option>\`).join('')}</select>
                <textarea id="msgText" rows="3"></textarea>
                <button id="sendStudentMsgBtn" class="primary">📬 Отправить</button>
            </div>
            <div id="chatHistory" class="card"><h3>📜 История переписки</h3><div class="chat-container"></div></div>\`;
            return html;
        }
    }
    
    function renderGlobalChat() {
        let history = DB.globalChat;
        let html = \`<div class="card"><h3>🌍 Общий чат</h3><div class="chat-container" id="globalChatContainer">\`;
        history.forEach(msg => {
            let isOwn = msg.user_id === currentUser.id;
            html += \`<div class="chat-bubble \${isOwn ? 'own' : ''}"><b>\${escapeHtml(msg.user_name)}:</b> \${escapeHtml(msg.text)}<br><small>\${new Date(msg.date).toLocaleString()}</small></div>\`;
        });
        html += \`</div><textarea id="globalMsg" rows="2" placeholder="Сообщение для всех..."></textarea><button id="sendGlobalBtn" class="primary">💬 Отправить</button></div>\`;
        return html;
    }
    
    function renderStudentChat() {
        let history = DB.studentChat;
        let html = \`<div class="card"><h3>👨‍🎓 Чат учеников</h3><div class="chat-container">\`;
        history.forEach(msg => {
            let isOwn = msg.user_id === currentUser.id;
            html += \`<div class="chat-bubble \${isOwn ? 'own' : ''}"><b>\${escapeHtml(msg.user_name)}:</b> \${escapeHtml(msg.text)}<br><small>\${new Date(msg.date).toLocaleString()}</small></div>\`;
        });
        html += \`</div><textarea id="studentChatMsg" rows="2" placeholder="Сообщение для учеников..."></textarea><button id="sendStudentChatBtn" class="primary">💬 Отправить</button></div>\`;
        return html;
    }
    
    function renderTeacherChat() {
        let history = DB.teacherChat;
        let html = \`<div class="card"><h3>👥 Чат учителей</h3><div class="chat-container">\`;
        history.forEach(msg => {
            let fromUser = DB.users.find(u => u.id === msg.from_id);
            let isOwn = msg.from_id === currentUser.id;
            html += \`<div class="chat-bubble \${isOwn ? 'own' : ''}"><b>\${fromUser?.name}:</b> \${escapeHtml(msg.text)}<br><small>\${new Date(msg.date).toLocaleString()}</small></div>\`;
        });
        html += \`</div><textarea id="teacherChatMsg" rows="2" placeholder="Сообщение учителям..."></textarea><button id="sendTeacherMsgBtn" class="primary">💬 Отправить</button></div>\`;
        return html;
    }
    
    function renderAdminPanel() {
        let students = getAllStudents();
        let teachersList = DB.users.filter(u => u.role === 'teacher');
        return \`
        <div class="card">
            <h3>⚙️ Админ-панель</h3>
            <div class="admin-stats">
                <div class="stat-card"><div class="stat-number">\${DB.users.length}</div><div>Пользователей</div></div>
                <div class="stat-card"><div class="stat-number">\${students.length}</div><div>Учеников</div></div>
                <div class="stat-card"><div class="stat-number">\${teachersList.length}</div><div>Учителей</div></div>
            </div>
            <details><summary>📊 Управление пользователями</summary>
                <div class="flex-row">
                    <button id="addStudentBtn" class="primary">➕ Добавить ученика</button>
                    <button id="promoteBtn" class="warning">⭐ Повысить до учителя</button>
                    <button id="demoteBtn" class="warning">⬇️ Понизить до ученика</button>
                    <button id="resetPassBtn">🔑 Сбросить пароль</button>
                    <button id="banBtn" class="danger">🚫 Забанить/Разбанить</button>
                </div>
                <p style="margin-top:12px; font-size:0.7rem;">💡 ID учеников смотри в разделе "Ученики"</p>
            </details>
            <details><summary>👥 Список учителей</summary>
                <div class="table-wrapper"> <thead> <th>ID</th><th>Имя</th><th>Логин</th><th>Статус</th> </thead><tbody>
                \${teachersList.map(t => \` <td>\${t.id}</td><td>\${escapeHtml(t.name)}</td><td>\${escapeHtml(t.login)}</td><td>\${t.banned ? '🔴 Забанен' : '🟢 Активен'}</td> \`).join('')}
                </tbody> </div>
            </details>
            <details><summary>⭐ Управление оценками</summary>
                <select id="adminStudent"><option value="">Выберите ученика</option>\${students.map(s => \`<option value="\${s.id}">\${escapeHtml(s.name)} (ID:\${s.id})</option>\`).join('')}</select>
                <select id="adminTask"><option value="">Выберите задание</option>\${DB.tasks.map(t => \`<option value="\${t.id}">\${escapeHtml(t.title)}</option>\`).join('')}</select>
                <select id="adminGrade"><option value="">—</option><option value="5">5</option><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select>
                <button id="adminSetGradeBtn" class="primary">Установить оценку</button>
            </details>
            <details><summary>📝 Управление заданиями</summary>
                <select id="adminTaskTeacher"><option value="">Выберите учителя</option>\${teachersList.map(t => \`<option value="\${t.id}">\${escapeHtml(t.name)}</option>\`).join('')}</select>
                <input id="adminTaskTitle" placeholder="Название задания">
                <input id="adminTaskDesc" placeholder="Описание">
                <button id="adminCreateTaskBtn" class="primary">Создать задание</button>
                <hr>
                <select id="adminDeleteTask"><option value="">Выберите задание для удаления</option>\${DB.tasks.map(t => \`<option value="\${t.id}">\${escapeHtml(t.title)}</option>\`).join('')}</select>
                <button id="adminDeleteTaskBtn" class="danger">🗑 Удалить задание</button>
            </details>
            <details><summary>📤 Экспорт / Сброс</summary>
                <div class="flex-row">
                    <button id="exportDataBtn">📤 Экспорт данных</button>
                    <button id="clearAllBtn" class="danger">🗑 Сбросить все данные</button>
                </div>
            </details>
        </div>\`;
    }
    
    function attachContentEvents(isTeacher) {
        if (currentView === "dashboard" && isTeacher) {
            document.getElementById('quickTaskBtn')?.addEventListener('click', async () => {
                let title = prompt("Название задания");
                if (title) await addTask(title, prompt("Описание") || "", currentUser.id);
                render();
            });
            document.getElementById('quickGradeBtn')?.addEventListener('click', () => {
                currentView = "grades";
                render();
            });
        } else if (currentView === "dashboard" && !isTeacher) {
            document.getElementById('msgTeacherBtn')?.addEventListener('click', () => {
                currentView = "messages";
                render();
            });
        }
        
        if (currentView === "tasks" && isTeacher) {
            document.getElementById('newTaskBtn')?.addEventListener('click', async () => {
                let title = prompt("Название задания");
                if (title) await addTask(title, prompt("Описание") || "", currentUser.id);
                render();
            });
            document.querySelectorAll('[data-taskdel]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    await deleteTask(parseInt(btn.getAttribute('data-taskdel')));
                    render();
                });
            });
        }
        
        if (currentView === "grades" && isTeacher) {
            document.querySelectorAll('[data-grade-set]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    let data = JSON.parse(btn.getAttribute('data-grade-set'));
                    let select = document.getElementById(\`grade_\${data.studentId}_\${data.taskId}\`);
                    if (select) {
                        await setGrade(data.studentId, data.taskId, select.value);
                        render();
                    }
                });
            });
        }
        
        if (currentView === "messages" && !isTeacher) {
            document.getElementById('sendStudentMsgBtn')?.addEventListener('click', async () => {
                let tid = document.getElementById('teacherSelect').value;
                let text = document.getElementById('msgText').value;
                if (tid && text.trim()) {
                    await addMessageToTeacher(currentUser.id, parseInt(tid), text);
                    document.getElementById('msgText').value = '';
                    let teacher = DB.users.find(u => u.id === parseInt(tid));
                    let conv = getStudentMessages(currentUser.id, parseInt(tid));
                    let historyDiv = document.getElementById('chatHistory');
                    historyDiv.innerHTML = \`<h3>📜 Переписка с \${teacher?.name}</h3><div class="chat-container">\`;
                    conv.forEach(m => {
                        let fromName = m.from_id === currentUser.id ? "Вы" : teacher?.name;
                        historyDiv.innerHTML += \`<div class="chat-bubble \${m.from_id === currentUser.id ? 'own' : ''}"><b>\${fromName}:</b> \${escapeHtml(m.text)}<br><small>\${new Date(m.date).toLocaleString()}</small></div>\`;
                    });
                    historyDiv.innerHTML += \`</div>\`;
                }
            });
            document.getElementById('teacherSelect')?.addEventListener('change', () => {
                let tid = document.getElementById('teacherSelect').value;
                if (tid) {
                    let teacher = DB.users.find(u => u.id === parseInt(tid));
                    let conv = getStudentMessages(currentUser.id, parseInt(tid));
                    let historyDiv = document.getElementById('chatHistory');
                    historyDiv.innerHTML = \`<h3>📜 Переписка с \${teacher?.name}</h3><div class="chat-container">\`;
                    conv.forEach(m => {
                        let fromName = m.from_id === currentUser.id ? "Вы" : teacher?.name;
                        historyDiv.innerHTML += \`<div class="chat-bubble \${m.from_id === currentUser.id ? 'own' : ''}"><b>\${fromName}:</b> \${escapeHtml(m.text)}<br><small>\${new Date(m.date).toLocaleString()}</small></div>\`;
                    });
                    historyDiv.innerHTML += \`</div>\`;
                }
            });
        } else if (currentView === "messages" && isTeacher) {
            document.getElementById('sendReplyBtn')?.addEventListener('click', async () => {
                let sid = document.getElementById('replyStudentSelect').value;
                let text = document.getElementById('replyText').value;
                if (sid && text.trim()) {
                    await addMessageToTeacher(currentUser.id, parseInt(sid), text);
                    render();
                }
            });
        }
        
        if (currentView === "globalchat") {
            document.getElementById('sendGlobalBtn')?.addEventListener('click', async () => {
                let msg = document.getElementById('globalMsg').value;
                if (msg.trim()) {
                    await addGlobalChat(currentUser.id, currentUser.name, msg);
                    document.getElementById('globalMsg').value = '';
                    render();
                }
            });
        }
        
        if (currentView === "studentchat" && currentUser.role === 'student') {
            document.getElementById('sendStudentChatBtn')?.addEventListener('click', async () => {
                let msg = document.getElementById('studentChatMsg').value;
                if (msg.trim()) {
                    await addStudentChat(currentUser.id, currentUser.name, msg);
                    document.getElementById('studentChatMsg').value = '';
                    render();
                }
            });
        }
        
        if (currentView === "teacherchat" && isTeacher) {
            document.getElementById('sendTeacherMsgBtn')?.addEventListener('click', async () => {
                let msg = document.getElementById('teacherChatMsg').value;
                if (msg.trim()) {
                    await addTeacherChat(currentUser.id, msg);
                    document.getElementById('teacherChatMsg').value = '';
                    render();
                }
            });
        }
        
        if (currentUser.role === 'admin' && currentView === "adminpanel") {
            document.getElementById('addStudentBtn')?.addEventListener('click', async () => {
                let login = prompt("Логин ученика");
                let pass = prompt("Пароль");
                let name = prompt("Полное имя");
                if (login && pass && name) {
                    if (await addNewStudent(login, pass, name)) alert("Ученик добавлен!");
                    else alert("Логин занят");
                    render();
                }
            });
            document.getElementById('promoteBtn')?.addEventListener('click', async () => {
                let id = prompt("Введите ID ученика для повышения:");
                if (id && await promoteToTeacher(parseInt(id))) alert("Повышен до учителя!");
                else alert("Ошибка");
                render();
            });
            document.getElementById('demoteBtn')?.addEventListener('click', async () => {
                let id = prompt("Введите ID учителя для понижения:");
                if (id && await demoteToStudent(parseInt(id))) alert("Понижен до ученика!");
                else alert("Ошибка");
                render();
            });
            document.getElementById('resetPassBtn')?.addEventListener('click', async () => {
                let id = prompt("ID пользователя");
                let newPass = prompt("Новый пароль");
                if (id && newPass) {
                    await resetPassword(parseInt(id), newPass);
                    alert("Пароль изменён");
                    render();
                }
            });
            document.getElementById('banBtn')?.addEventListener('click', async () => {
                let id = prompt("ID пользователя для бана/разбана");
                if (id) {
                    await toggleBan(parseInt(id));
                    alert("Готово");
                    render();
                }
            });
            document.getElementById('adminSetGradeBtn')?.addEventListener('click', async () => {
                let sid = document.getElementById('adminStudent').value;
                let tid = document.getElementById('adminTask').value;
                let grade = document.getElementById('adminGrade').value;
                if (sid && tid && grade) {
                    await setGrade(parseInt(sid), parseInt(tid), grade);
                    alert("Оценка установлена");
                    render();
                } else alert("Выберите всё");
            });
            document.getElementById('adminCreateTaskBtn')?.addEventListener('click', async () => {
                let tid = document.getElementById('adminTaskTeacher').value;
                let title = document.getElementById('adminTaskTitle').value;
                let desc = document.getElementById('adminTaskDesc').value;
                if (tid && title) {
                    await addTask(title, desc, parseInt(tid));
                    alert("Задание создано");
                    document.getElementById('adminTaskTitle').value = '';
                    document.getElementById('adminTaskDesc').value = '';
                    render();
                } else alert("Заполните поля");
            });
            document.getElementById('adminDeleteTaskBtn')?.addEventListener('click', async () => {
                let tid = document.getElementById('adminDeleteTask').value;
                if (tid) {
                    await deleteTask(parseInt(tid));
                    alert("Задание удалено");
                    render();
                }
            });
            document.getElementById('exportDataBtn')?.addEventListener('click', () => {
                let dataStr = JSON.stringify(DB, null, 2);
                let blob = new Blob([dataStr], { type: "application/json" });
                let a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = \`diary_backup_\${new Date().toISOString().slice(0, 19)}.json\`;
                a.click();
            });
            document.getElementById('clearAllBtn')?.addEventListener('click', () => {
                if (confirm("Сбросить все данные? Это удалит всех учеников, оценки, сообщения и задания!")) {
                    localStorage.removeItem('diary_online');
                    location.reload();
                }
            });
        }
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
    }
    
    connectSocket();
</script>
</body>
</html>`);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));