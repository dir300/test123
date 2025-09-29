// State management
let cart = [];
let products = [];
let categories = [];
let currentUser = null;
let currentCategory = 'all';

// API configuration
const API_BASE_URL = window.location.origin + '/api';

// Инициализация приложения
async function initApp() {
    showLoading(true);
    
    try {
        // Инициализация Telegram Web App
        await initTelegramApp();
        
        // Загрузка данных
        await loadInitialData();
        
        // Рендер интерфейса
        renderCategories();
        renderProducts();
        updateCartUI();
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showError('Не удалось загрузить приложение');
    } finally {
        showLoading(false);
    }
}

// Инициализация Telegram App
async function initTelegramApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        tg.enableClosingConfirmation();
        
        // Получаем данные пользователя
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            currentUser = tg.initDataUnsafe.user;
            await authenticateUser(currentUser);
        } else {
            // Для тестирования вне Telegram
            currentUser = {
                id: 123456789,
                first_name: 'Тестовый',
                last_name: 'Пользователь',
                username: 'test_user',
                is_bot: false
            };
            await authenticateUser(currentUser);
        }
        
        updateUserInfo();
    } else {
        // Режим тестирования в браузере
        console.warn('Telegram Web App not found, running in test mode');
        currentUser = {
            id: 123456789,
            first_name: 'Тестовый',
            last_name: 'Пользователь',
            username: 'test_user',
            is_bot: false
        };
        await authenticateUser(currentUser);
        updateUserInfo();
    }
}

// Аутентификация пользователя
async function authenticateUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        // Показываем кнопку админа если пользователь админ
        if (result.isAdmin) {
            document.getElementById('adminBtn').style.display = 'block';
            document.getElementById('adminBtn').onclick = () => {
                window.open('./admin.html', '_blank');
            };
        }
        
    } catch (error) {
        console.warn('Auth failed, continuing without admin rights');
    }
}

// Загрузка初始数据
async function loadInitialData() {
    try {
        const [productsResponse, categoriesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/products`),
            fetch(`${API_BASE_URL}/categories`)
        ]);
        
        if (!productsResponse.ok || !categoriesResponse.ok) {
            throw new Error('Failed to load data');
        }
        
        products = await productsResponse.json();
        categories = await categoriesResponse.json();
        
    } catch (error) {
        console.warn('Server not available, using mock data');
        await loadMockData();
    }
}

// Загрузка моковых данных
async function loadMockData() {
    categories = [
        { id: 'all', name: 'Все товары', icon: '🏠' },
        { id: 'electronics', name: 'Электроника', icon: '📱' },
        { id: 'laptops', name: 'Ноутбуки', icon: '💻' },
        { id: 'audio', name: 'Аудио', icon: '🎧' },
        { id: 'wearables', name: 'Гаджеты', icon: '⌚' }
    ];
    
    products = [
        {
            id: 1,
            name: "iPhone 15 Pro",
            price: 99990,
            description: "Новый iPhone с революционным дизайном и камерой",
            image: "📱",
            category: "electronics",
            inStock: true
        },
        {
            id: 2,
            name: "MacBook Air M2",
            price: 129990,
            description: "Мощный и легкий ноутбук для работы и творчества",
            image: "💻",
            category: "laptops",
            inStock: true
        },
        {
            id: 3,
            name: "AirPods Pro",
            price: 24990,
            description: "Беспроводные наушники с активным шумоподавлением",
            image: "🎧",
            category: "audio",
            inStock: true
        },
        {
            id: 4,
            name: "Apple Watch Series 9",
            price: 39990,
            description: "Умные часы для активного образа жизни",
            image: "⌚",
            category: "wearables",
            inStock: true
        }
    ];
}

// Обновление информации о пользователе
function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (currentUser) {
        userInfo.innerHTML = `
            <div>👤 ${currentUser.first_name} ${currentUser.last_name || ''}</div>
            <div style="font-size: 12px;">@${currentUser.username || 'без username'}</div>
        `;
    }
}

// Рендер категорий
function renderCategories() {
    const container = document.getElementById('categoriesNav');
    container.innerHTML = '';
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = `category-btn ${currentCategory === category.id ? 'active' : ''}`;
        button.innerHTML = `${category.icon} ${category.name}`;
        button.onclick = () => switchCategory(category.id);
        container.appendChild(button);
    });
}

// Переключение категории
function switchCategory(categoryId) {
    currentCategory = categoryId;
    renderCategories();
    renderProducts();
}

// Рендер товаров
function renderProducts() {
    const container = document.getElementById('productsContainer');
    const emptyState = document.getElementById('emptyState');
    
    container.innerHTML = '';
    
    const filteredProducts = currentCategory === 'all' 
        ? products 
        : products.filter(product => product.category === currentCategory);
    
    if (filteredProducts.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    filteredProducts.forEach(product => {
        if (!product.inStock && product.inStock !== undefined) return;
        
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.onclick = () => openProductModal(product);
        
        productElement.innerHTML = `
            <div class="product-image">${product.image}</div>
            <div class="product-category">${getCategoryName(product.category)}</div>
            <div class="product-title">${product.name}</div>
            <div class="product-price">${formatPrice(product.price)}</div>
        `;
        
        container.appendChild(productElement);
    });
}

// Получение названия категории
function getCategoryName(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Другое';
}

// Открытие модального окна товара
function openProductModal(product) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalProductTitle');
    const content = document.getElementById('modalProductContent');

    const cartItem = cart.find(item => item.product.id === product.id);
    const quantity = cartItem ? cartItem.quantity : 0;

    title.textContent = product.name;
    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">${product.image}</div>
            <div style="font-size: 24px; font-weight: 600; color: var(--link-color); margin-bottom: 12px;">
                ${formatPrice(product.price)}
            </div>
            <div style="color: var(--hint-color); font-size: 14px; margin-bottom: 8px;">
                ${getCategoryName(product.category)}
            </div>
        </div>
        <p style="margin-bottom: 20px; color: var(--text-color);">${product.description}</p>
        
        ${product.inStock === false ? `
            <div style="text-align: center; color: var(--error-color); padding: 16px; background: var(--secondary-bg-color); border-radius: 8px; margin-bottom: 16px;">
                🔴 Нет в наличии
            </div>
        ` : `
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="changeQuantity(${product.id}, -1)">-</button>
                <span class="quantity-display">${quantity}</span>
                <button class="quantity-btn" onclick="changeQuantity(${product.id}, 1)">+</button>
            </div>
            
            <button class="btn ${quantity > 0 ? 'btn-success' : ''}" onclick="addToCart(${product.id})">
                ${quantity > 0 ? '✅ В корзине' : 'Добавить в корзину'}
            </button>
        `}
    `;

    modal.style.display = 'flex';
}

// Изменение количества товара
function changeQuantity(productId, delta) {
    const product = products.find(p => p.id === productId);
    if (!product || product.inStock === false) return;

    const existingItem = cart.find(item => item.product.id === productId);
    
    if (existingItem) {
        existingItem.quantity += delta;
        if (existingItem.quantity <= 0) {
            cart = cart.filter(item => item.product.id !== productId);
        }
    } else if (delta > 0) {
        cart.push({
            product: product,
            quantity: 1
        });
    }
    
    updateCartUI();
    
    // Обновляем модальное окно если оно открыто
    const modal = document.getElementById('productModal');
    if (modal.style.display === 'flex') {
        const currentProduct = products.find(p => p.id === productId);
        if (currentProduct) openProductModal(currentProduct);
    }
}

// Добавление в корзину
function addToCart(productId) {
    changeQuantity(productId, 1);
    showNotification('Товар добавлен в корзину');
}

// Удаление из корзины
function removeFromCart(productId) {
    cart = cart.filter(item => item.product.id !== productId);
    updateCartUI();
    showNotification('Товар удален из корзины');
}

// Обновление UI корзины
function updateCartUI() {
    const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    document.getElementById('totalPrice').textContent = formatPrice(totalPrice);
    document.getElementById('cartCount').textContent = totalCount;

    // Обновляем содержимое модального окна корзины
    const cartContent = document.getElementById('cartContent');
    if (cart.length === 0) {
        cartContent.innerHTML = '<p style="text-align: center; color: var(--hint-color);">Корзина пуста</p>';
    } else {
        cartContent.innerHTML = cart.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--secondary-bg-color);">
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${item.product.name}</div>
                    <div style="color: var(--link-color); font-size: 14px;">
                        ${formatPrice(item.product.price)} × ${item.quantity}
                    </div>
                </div>
                <div style="font-weight: 600; margin: 0 12px;">
                    ${formatPrice(item.product.price * item.quantity)}
                </div>
                <button onclick="removeFromCart(${item.product.id})" style="background: none; border: none; color: var(--hint-color); font-size: 20px; cursor: pointer; padding: 4px;">×</button>
            </div>
        `).join('');
    }
}

// Открытие корзины
function openCart() {
    if (cart.length === 0) {
        showNotification('Корзина пуста');
        return;
    }
    document.getElementById('cartModal').style.display = 'flex';
}

// Оформление заказа
async function proceedToCheckout() {
    if (cart.length === 0) return;

    const orderData = {
        products: cart,
        total: cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
        user: currentUser,
        timestamp: new Date().toISOString()
    };

    const tg = window.Telegram?.WebApp;
    
    if (tg) {
        tg.showPopup({
            title: 'Подтверждение заказа',
            message: `Подтвердите заказ на сумму ${formatPrice(orderData.total)}`,
            buttons: [
                {id: 'cancel', type: 'cancel', text: 'Отмена'},
                {id: 'confirm', type: 'default', text: 'Подтвердить'}
            ]
        }, async (buttonId) => {
            if (buttonId === 'confirm') {
                await processOrder(orderData);
            }
        });
    } else {
        // Для тестирования в браузере
        if (confirm(`Подтвердите заказ на сумму ${formatPrice(orderData.total)}`)) {
            await processOrder(orderData);
        }
    }
}

// Обработка заказа
async function processOrder(orderData) {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        let orderResult;
        
        if (response.ok) {
            orderResult = await response.json();
            showNotification('✅ Заказ успешно оформлен!');
            cart = [];
            updateCartUI();
            closeModal();
        } else {
            throw new Error('Order failed');
        }
        
    } catch (error) {
        console.error('Order error:', error);
        showError('Ошибка при оформлении заказа');
    } finally {
        showLoading(false);
    }
}

// Вспомогательные функции
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
    }).format(price);
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function showLoading(show) {
    document.getElementById('loadingIndicator').classList.toggle('loading', show);
}

function showNotification(message) {
    // В Telegram Mini Apps
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showPopup({
            title: 'Уведомление',
            message: message
        });
        return;
    }
    
    // В браузере
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

function showError(message) {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showPopup({
            title: 'Ошибка',
            message: message
        });
    } else {
        alert('Ошибка: ' + message);
    }
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', initApp);

// Закрытие модального окна по клику вне его
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
});

// Закрытие по ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});