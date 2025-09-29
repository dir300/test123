const { readJSONFile, writeJSONFile } = require('./database');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');

// Admin user IDs (можно добавить свои)
const ADMIN_USER_IDS = [
    123456789, // Тестовый пользователь
    // Добавьте сюда ID администраторов из Telegram
];

// Аутентификация пользователя
async function authenticateUser(userData) {
    try {
        const users = await readJSONFile(USERS_FILE);
        
        // Поиск существующего пользователя
        let user = users.find(u => u.id === userData.id);
        
        if (user) {
            // Обновляем данные пользователя
            user = { ...user, ...userData, lastSeen: new Date().toISOString() };
            const userIndex = users.findIndex(u => u.id === userData.id);
            users[userIndex] = user;
        } else {
            // Создаем нового пользователя
            user = {
                ...userData,
                firstSeen: new Date().toISOString(),
                lastSeen: new Date().toISOString()
            };
            users.push(user);
        }
        
        await writeJSONFile(USERS_FILE, users);
        
        // Проверяем является ли пользователь администратором
        const isAdmin = ADMIN_USER_IDS.includes(userData.id);
        
        return {
            success: true,
            user: user,
            isAdmin: isAdmin
        };
        
    } catch (error) {
        console.error('Auth error:', error);
        return {
            success: false,
            isAdmin: false
        };
    }
}

// Проверка прав администратора
function isAdmin(userId) {
    return ADMIN_USER_IDS.includes(userId);
}

module.exports = {
    authenticateUser,
    isAdmin
};
