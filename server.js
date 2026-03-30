const express = require('express');
const cors = require('cors');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

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

function initDatabase() {
  database.users = [
    { id: 1, login: "maxsovs", password: "00912tor", name: "Торобаев Миржигит", role: "teacher", banned: false },
    { id: 2, login: "elkades", password: "34762elk", name: "Айтымбетов Элназар", role: "teacher", banned: false },
    { id: 3, login: "ayanaaa", password: "87543ya", name: "Илесбекова Аяна", role: "teacher", banned: false },
    { id: 999, login: "godmode", password: "adminroot", name: "Системный Администратор", role: "admin", banned: false }
  ];
  
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
  
  database.tasks = [
    { id: 1, title: "Контрольная по математике", description: "Дроби, проценты", deadline: "2026-04-15", teacher_id: 1 },
    { id: 2, title: "Сочинение по литературе", description: "Мой любимый герой", deadline: "2026-04-18", teacher_id: 1 },
    { id: 3, title: "Тест по истории КР", description: "Древние цивилизации", deadline: "2026-04-20", teacher_id: 2 },
    { id: 4, title: "Проект по биологии", description: "Экосистемы", deadline: "2026-04-22", teacher_id: 2 },
    { id: 5, title: "Лабораторная по физике", description: "Измерение скорости", deadline: "2026-04-17", teacher_id: 3 },
    { id: 6, title: "Эссе по английскому", description: "My future profession", deadline: "2026-04-25", teacher_id: 3 }
  ];
  
  database.grades = [];
  database.messages = [];
  database.teacherChat = [];
  database.globalChat = [];
  database.studentChat = [];
  database.actionLog = [];
}

initDatabase();

app.get('/api/data', (req, res) => {
  res.json(database);
});

app.post('/api/update', (req, res) => {
  const { table, data, action } = req.body;
  
  if (action === 'add') {
    if (!database[table]) database[table] = [];
    database[table].push(data);
    io.emit('data-updated', { table, data, action: 'add' });
  } else if (action === 'update') {
    const index = database[table].findIndex(item => item.id === data.id);
    if (index !== -1) database[table][index] = { ...database[table][index], ...data };
    io.emit('data-updated', { table, data, action: 'update' });
  } else if (action === 'delete') {
    database[table] = database[table].filter(item => item.id !== data.id);
    io.emit('data-updated', { table, data, action: 'delete' });
  }
  
  res.json({ success: true });
});

io.on('connection', (socket) => {
  console.log('Пользователь подключился');
  socket.emit('initial-data', database);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});