// ========== ХРАНИЛИЩЕ ДАННЫХ (localStorage) ==========
let currentUser = null;
let activeChat = null;
let users = [];
let chats = [];
let messages = {};
let guestMode = false;

// Инициализация
function init() {
    loadData();
    setupEventListeners();
    checkAuth();
    startPolling();
}

// Загрузка данных из localStorage
function loadData() {
    const storedUsers = localStorage.getItem('telegram_clone_users');
    if (storedUsers) {
        users = JSON.parse(storedUsers);
    } else {
        // Демо-пользователи
        users = [
            { id: 'user1', username: 'alex', password: '123', email: 'alex@example.com', avatar: 'A', online: true },
            { id: 'user2', username: 'maria', password: '123', email: 'maria@example.com', avatar: 'M', online: true },
            { id: 'user3', username: 'john', password: '123', email: 'john@example.com', avatar: 'J', online: false }
        ];
        saveUsers();
    }
    
    const storedChats = localStorage.getItem('telegram_clone_chats');
    if (storedChats) {
        chats = JSON.parse(storedChats);
    } else {
        chats = [
            { id: 'chat1', participants: ['user1', 'user2'], lastMessage: 'Привет!', lastTime: new Date().toISOString() },
            { id: 'chat2', participants: ['user1', 'user3'], lastMessage: 'Как дела?', lastTime: new Date().toISOString() }
        ];
        saveChats();
    }
    
    const storedMessages = localStorage.getItem('telegram_clone_messages');
    if (storedMessages) {
        messages = JSON.parse(storedMessages);
    } else {
        messages = {
            'chat1': [
                { id: 'msg1', senderId: 'user2', text: 'Привет!', time: new Date().toISOString(), read: true },
                { id: 'msg2', senderId: 'user1', text: 'Здравствуй!', time: new Date().toISOString(), read: true }
            ],
            'chat2': [
                { id: 'msg3', senderId: 'user3', text: 'Как дела?', time: new Date().toISOString(), read: true }
            ]
        };
        saveMessages();
    }
}

// Сохранение данных
function saveUsers() { localStorage.setItem('telegram_clone_users', JSON.stringify(users)); }
function saveChats() { localStorage.setItem('telegram_clone_chats', JSON.stringify(chats)); }
function saveMessages() { localStorage.setItem('telegram_clone_messages', JSON.stringify(messages)); }

// Проверка авторизации
function checkAuth() {
    const savedUser = localStorage.getItem('telegram_clone_current_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (currentUser.isGuest) guestMode = true;
        showMainApp();
    } else {
        showAuthModal();
    }
}

// Показать модалку авторизации
function showAuthModal() {
    document.getElementById('authModal').classList.remove('hidden');
    document.getElementById('chatArea').style.display = 'none';
}

// Скрыть модалку
function hideAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('chatArea').style.display = 'flex';
}

// Показать основное приложение
function showMainApp() {
    hideAuthModal();
    updateSidebar();
    updateUserInfo();
    if (activeChat) loadChat(activeChat);
}

// Обновление сайдбара
function updateSidebar() {
    const chatsList = document.getElementById('chatsList');
    if (!chatsList) return;
    
    const userChats = chats.filter(chat => chat.participants.includes(currentUser.id));
    
    if (userChats.length === 0) {
        chatsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #8e8e8e;">Нет чатов<br>Нажмите ✏️ для создания</div>';
        return;
    }
    
    chatsList.innerHTML = userChats.map(chat => {
        const otherUser = users.find(u => u.id !== currentUser.id && chat.participants.includes(u.id));
        const lastMsg = chat.lastMessage || 'Новое сообщение';
        const time = chat.lastTime ? new Date(chat.lastTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
        
        return `
            <div class="chat-item" data-chat-id="${chat.id}" onclick="selectChat('${chat.id}')">
                <div class="chat-avatar">${otherUser ? otherUser.avatar : '?'}</div>
                <div class="chat-info">
                    <div class="chat-name">${otherUser ? otherUser.username : 'Unknown'}</div>
                    <div class="chat-preview">${lastMsg.substring(0, 30)}</div>
                </div>
                <div class="chat-time">${time}</div>
            </div>
        `;
    }).join('');
}

// Обновление информации о пользователе
function updateUserInfo() {
    if (!currentUser) return;
    document.getElementById('sidebarUsername').innerText = currentUser.username;
    document.getElementById('userAvatar').innerHTML = `<i class="fas fa-user"></i>`;
}

// Выбор чата
function selectChat(chatId) {
    activeChat = chatId;
    loadChat(chatId);
    updateActiveChatInSidebar(chatId);
}

// Обновление активного чата в сайдбаре
function updateActiveChatInSidebar(chatId) {
    document.querySelectorAll('.chat-item').forEach(item => {
        if (item.dataset.chatId === chatId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Загрузка сообщений чата
function loadChat(chatId) {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    
    const otherUser = users.find(u => u.id !== currentUser.id && chat.participants.includes(u.id));
    document.getElementById('chatName').innerText = otherUser ? otherUser.username : 'Чат';
    document.getElementById('chatAvatar').innerHTML = otherUser ? `<i class="fas fa-user"></i>` : `<i class="fas fa-comments"></i>`;
    
    const chatMessages = messages[chatId] || [];
    
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = chatMessages.map(msg => {
        const isOutgoing = msg.senderId === currentUser.id;
        const sender = users.find(u => u.id === msg.senderId);
        const time = new Date(msg.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        
        return `
            <div class="message ${isOutgoing ? 'outgoing' : 'incoming'}">
                <div class="message-bubble">
                    ${msg.text}
                    <div class="message-info">
                        ${!isOutgoing ? `<span class="message-sender">${sender ? sender.username : ''}</span>` : ''}
                        <span class="message-time">${time}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    scrollToBottom();
}

// Отправка сообщения
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || !activeChat) return;
    
    const newMessage = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        text: text,
        time: new Date().toISOString(),
        read: false
    };
    
    if (!messages[activeChat]) messages[activeChat] = [];
    messages[activeChat].push(newMessage);
    saveMessages();
    
    // Обновляем последнее сообщение в чате
    const chat = chats.find(c => c.id === activeChat);
    if (chat) {
        chat.lastMessage = text;
        chat.lastTime = new Date().toISOString();
        saveChats();
    }
    
    input.value = '';
    loadChat(activeChat);
    updateSidebar();
    
    // Имитация ответа от бота (если чат с гостем)
    simulateReply();
}

// Имитация ответа
function simulateReply() {
    const chat = chats.find(c => c.id === activeChat);
    if (!chat) return;
    
    const otherUser = users.find(u => u.id !== currentUser.id && chat.participants.includes(u.id));
    if (otherUser && otherUser.username === 'guest_bot') {
        setTimeout(() => {
            const autoReply = {
                id: Date.now().toString(),
                senderId: otherUser.id,
                text: 'Это автоответчик. Пользователь сейчас не в сети.',
                time: new Date().toISOString(),
                read: false
            };
            if (!messages[activeChat]) messages[activeChat] = [];
            messages[activeChat].push(autoReply);
            saveMessages();
            loadChat(activeChat);
            updateSidebar();
            showNotification('Новое сообщение от ' + otherUser.username);
        }, 2000);
    }
}

// Прокрутка вниз
function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

// Показать уведомление
function showNotification(message) {
    const notif = document.getElementById('notification');
    notif.innerText = message;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 3000);
}

// Создание нового чата
function createNewChat(username) {
    const otherUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.id !== currentUser.id);
    
    if (!otherUser) {
        showNotification('Пользователь не найден');
        return false;
    }
    
    // Проверяем, существует ли уже чат
    const existingChat = chats.find(chat => 
        chat.participants.includes(currentUser.id) && 
        chat.participants.includes(otherUser.id)
    );
    
    if (existingChat) {
        selectChat(existingChat.id);
        showNotification('Чат уже существует');
        return false;
    }
    
    const newChat = {
        id: 'chat_' + Date.now(),
        participants: [currentUser.id, otherUser.id],
        lastMessage: '',
        lastTime: new Date().toISOString()
    };
    
    chats.push(newChat);
    saveChats();
    updateSidebar();
    selectChat(newChat.id);
    showNotification('Чат создан!');
    return true;
}

// Регистрация пользователя
function registerUser(username, email, password) {
    if (users.find(u => u.username === username)) {
        showNotification('Имя пользователя уже занято');
        return false;
    }
    
    const newUser = {
        id: 'user_' + Date.now(),
        username: username,
        password: password,
        email: email || '',
        avatar: username[0].toUpperCase(),
        online: true,
        registered: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers();
    
    currentUser = newUser;
    localStorage.setItem('telegram_clone_current_user', JSON.stringify(currentUser));
    guestMode = false;
    showMainApp();
    showNotification('Добро пожаловать, ' + username + '!');
    return true;
}

// Вход пользователя
function loginUser(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        showNotification('Неверное имя пользователя или пароль');
        return false;
    }
    
    currentUser = user;
    localStorage.setItem('telegram_clone_current_user', JSON.stringify(currentUser));
    guestMode = false;
    showMainApp();
    showNotification('С возвращением, ' + username + '!');
    return true;
}

// Гостевой режим
function guestLogin() {
    const guestId = 'guest_' + Date.now();
    const guestUsername = 'Гость_' + Math.floor(Math.random() * 10000);
    
    currentUser = {
        id: guestId,
        username: guestUsername,
        isGuest: true,
        avatar: 'G',
        online: true
    };
    
    guestMode = true;
    localStorage.setItem('telegram_clone_current_user', JSON.stringify(currentUser));
    showMainApp();
    showNotification('Вы вошли как гость');
}

// Выход из аккаунта
function logout() {
    currentUser = null;
    activeChat = null;
    localStorage.removeItem('telegram_clone_current_user');
    showAuthModal();
    showNotification('Вы вышли из аккаунта');
}

// Поиск пользователей
function searchUsers(query) {
    if (!query) return [];
    return users.filter(u => 
        u.username.toLowerCase().includes(query.toLowerCase()) && 
        u.id !== currentUser.id
    );
}

// Показ результатов поиска
function showSearchResults(query) {
    const results = searchUsers(query);
    const resultsDiv = document.getElementById('searchResults');
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<div style="color: #8e8e8e; text-align: center;">Пользователи не найдены</div>';
        return;
    }
    
    resultsDiv.innerHTML = results.map(user => `
        <div class="search-result-item" onclick="createNewChat('${user.username}'); document.getElementById('newChatModal').classList.add('hidden');">
            <strong>${user.username}</strong>
            ${user.email ? `<div style="font-size: 12px; color: #8e8e8e;">${user.email}</div>` : ''}
        </div>
    `).join('');
}

// Настройка событий
function setupEventListeners() {
    // Отправка сообщения
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Новый чат
    document.getElementById('newChatBtn').addEventListener('click', () => {
        document.getElementById('newChatModal').classList.remove('hidden');
        document.getElementById('newChatUsername').value = '';
        document.getElementById('searchResults').innerHTML = '';
    });
    
    // Поиск пользователей для нового чата
    document.getElementById
