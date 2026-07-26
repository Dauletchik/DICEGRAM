const API_URL = "https://a48778-c397.e.jrnm.app";

let currentUser = null;
let welcomeSupportMessage = "";

// Telegram WebApp адаптация
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

// Навигация по экранам
function goToStep(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Проверка имени
function validateStepName() {
    const name = document.getElementById('reg-name').value.trim();
    if (name.length < 2) {
        alert("Пожалуйста, введите ваше имя");
        return;
    }
    goToStep('step-username');
}

// Онлайн-проверка юзернейма
let checkTimeout = null;
function checkUsernameLive() {
    clearTimeout(checkTimeout);
    const username = document.getElementById('reg-username').value.trim();
    const statusDiv = document.getElementById('username-status');
    const btnNext = document.getElementById('btn-step-username');

    if (username.length < 3) {
        statusDiv.className = "status-msg error";
        statusDiv.innerText = "Мин. 3 символа";
        btnNext.disabled = true;
        return;
    }

    statusDiv.className = "status-msg";
    statusDiv.innerText = "Проверка...";

    checkTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`${API_URL}/api/check-username`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await res.json();

            if (data.available) {
                statusDiv.className = "status-msg success";
                statusDiv.innerText = "✓ Юзернейм свободен";
                btnNext.disabled = false;
            } else {
                statusDiv.className = "status-msg error";
                statusDiv.innerText = "✗ " + data.message;
                btnNext.disabled = true;
            }
        } catch (e) {
            statusDiv.className = "status-msg error";
            statusDiv.innerText = "Ошибка подключения к серверу";
        }
    }, 400);
}

// Отправка регистрации
async function submitRegistration() {
    const name = document.getElementById('reg-name').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value;
    const passConfirm = document.getElementById('reg-password-confirm').value;
    const statusDiv = document.getElementById('password-status');

    if (pass.length < 6) {
        statusDiv.innerText = "Пароль должен быть не менее 6 символов";
        return;
    }
    if (pass !== passConfirm) {
        statusDiv.innerText = "Пароли не совпадают";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, password: pass })
        });

        const data = await res.json();
        if (res.ok) {
            currentUser = data.user;
            welcomeSupportMessage = data.welcome_message.text;
            document.getElementById('generated-phone').innerText = currentUser.phone;
            goToStep('step-success');
        } else {
            statusDiv.innerText = data.detail || "Ошибка регистрации";
        }
    } catch (e) {
        statusDiv.innerText = "Ошибка сети";
    }
}

// Вход в мессенджер после успеха
function enterMessenger() {
    setupMessengerUI();
    goToStep('messenger-screen');
}

// Отрисовка профиля и первого чата
function setupMessengerUI() {
    document.getElementById('profile-name').innerText = currentUser.name;
    document.getElementById('profile-username').innerText = "@" + currentUser.username;
    document.getElementById('profile-phone').innerText = currentUser.phone;

    // Подгружаем чат поддержки
    const chatList = document.getElementById('chat-list');
    chatList.innerHTML = `
        <div class="chat-item" onclick="openSupportChat()">
            <div class="chat-avatar">🛡️</div>
            <div class="chat-info">
                <strong>DICEGRAM SUPPORT</strong>
                <p>Вы успешно зарегистрировались...</p>
            </div>
        </div>
    `;
}

// Открыть чат поддержки
function openSupportChat() {
    document.getElementById('chat-window').classList.add('active');
    const msgContainer = document.getElementById('chat-messages');
    msgContainer.innerHTML = `
        <div class="message-bubble">
            ${welcomeSupportMessage || "👋 Добро пожаловать в DICEGRAM!"}
        </div>
    `;
}

function closeChat() {
    document.getElementById('chat-window').classList.remove('active');
}

// Вход по номеру и паролю
async function submitLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value;
    const statusDiv = document.getElementById('login-status');

    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });

        const data = await res.json();
        if (res.ok) {
            currentUser = data.user;
            welcomeSupportMessage = "С возвращением в DICEGRAM!";
            setupMessengerUI();
            goToStep('messenger-screen');
        } else {
            statusDiv.innerText = data.detail || "Неверные данные";
        }
    } catch (e) {
        statusDiv.innerText = "Ошибка сервера";
    }
}

// Переключение вкладок нижней панели
function switchTab(tabId, title, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    btn.classList.add('active');
    document.getElementById('header-title').innerText = title;
}

// Выход из аккаунта
function logout() {
    currentUser = null;
    goToStep('welcome-screen');
}
