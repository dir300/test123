// State management
let cart = [];
let products = [];

// API configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Инициализация приложения
async function initApp() {
    showLoading(true);
    
    // Эмуляция Telegram Web App для локального тестирования
    if (!window.Telegram) {
        window.Telegram = {
            WebApp: {
                initData: 'test',
                initDataUnsafe: {
                    user: {
                        id: 123456789,
                        first_name: 'Тестовый',
                        last_name: 'Пользователь',
                        username: 'test_user'
                    }
                },
                expand: () => console.log('App expanded'),
                enableClosingConfirmation: () => console.log('Closing confirmation enabled'),
                showPopup: (params, callback) => {
                    if (confirm(params.message)) {
                        callback?.('confirm');
                    } else {
                        callback?.('cancel');
                    }
                },
                HapticFeedback: {
                    impactOccurred: (style) => console.log('Haptic:', style)
                }
            }
        };
    }

    const tg = window.Telegram.WebApp;
    updateUserInfo(tg.initDataUnsafe.user);
    
    try {
        products = await loadProducts();
        renderProducts();
        updateCartUI();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showError('Не удалось загрузить товары');
    } finally {
        showLoading(false);
    }
}

// Обновление информации о пользователе
function updateUserInfo(user) {
    const userInfo = document.getElementById('userInfo');
    if (user) {
        userInfo.innerHTML = `
            <div>👤 ${user.first_name} ${user.last_name || ''}</div>
            <div style="font-size: 12px;">@${user.username || 'без username'}</div>
        `;
    }
}

// Загрузка товаров с сервера
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Network error');
        return await response.json();
    } catch (error) {
        console.warn('Server not available, using mock data');
        // Возвращаем моковые данные если сервер недоступен
        return [
            {
                id: 1,
                name: "iPhone 15 Pro",
                price: 99990,
                description: "Новый iPhone с революционным дизайном и камерой",
                image: "📱",
                category: "phones"
            },
            {
                id: 2,
                name: "MacBook Air M2",
                price: 129990,
                description: "Мощный и легкий ноутбук для работы и творчества",
                image: "💻",
                category: "laptops"
            },
            {
                id: 3,
                name: "AirPods Pro",
                price: 24990,
                description: "Беспроводные наушники с активным шумоподавлением",
                image: "🎧",
                category: "audio"
            },
            {
                id: 4,
                name: "Apple Watch Series 9",
                price: 39990,
                description: "Умные часы для активного образа жизни",
                image: "⌚",
                category: "wearables"
            },
            {
                id: 5,
                name: "iPad Air",
                price: 59990,
                description: "Универсальный планшет для работы и развлечений",
                image: "📱",
                category: "tablets"
            },
            {
                id: 6,
                name: "Magic Keyboard",
                price: 12990,
                description: "Беспроводная клавиатура с подсветкой",
                image: "⌨️",
                category: "accessories"
            }
        ];
    }
}

// Рендер товаров
function renderProducts() {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-card';
        productElement.onclick = () => openProductModal(product);
        
        productElement.innerHTML = `
            <div class="product-image">${product.image}</div>
            <div class="product-title">${product.name}</div>
            <div class="product-price">${formatPrice(product.price)}</div>
        `;
        
        container.appendChild(productElement);
    });
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
        </div>
        <p style="margin-bottom: 20px; color: var(--text-color);">${product.description}</p>
        
        <div class="quantity-controls">
            <button class="quantity-btn" onclick="changeQuantity(${product.id}, -1)">-</button>
            <span class="quantity-display">${quantity}</span>
            <button class="quantity-btn" onclick="changeQuantity(${product.id}, 1)">+</button>
        </div>
        
        <button class="btn ${quantity > 0 ? 'btn-success' : ''}" onclick="addToCart(${product.id})">
            ${quantity > 0 ? '✅ В корзине' : 'Добавить в корзину'}
        </button>
    `;

    modal.style.display = 'flex';
}

// Изменение количества товара
function changeQuantity(productId, delta) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

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
        openProductModal(product);
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
        user: window.Telegram.WebApp.initDataUnsafe.user,
        timestamp: new Date().toISOString()
    };

    const tg = window.Telegram.WebApp;
    
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
}

// Обработка заказа
async function processOrder(orderData) {
    showLoading(true);
    
    try {
        // Отправка заказа на сервер
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
        } else {
            // Если сервер недоступен, создаем локальный заказ
            orderResult = {
                success: true,
                orderId: 'LOCAL-' + Date.now(),
                message: 'Заказ создан локально (сервер недоступен)'
            };
        }

        showOrderSuccess(orderResult, orderData);
        cart = [];
        updateCartUI();
        closeModal();
        
    } catch (error) {
        console.error('Order error:', error);
        showError('Ошибка при оформлении заказа');
    } finally {
        showLoading(false);
    }
}

// Показ успешного оформления заказа
function showOrderSuccess(orderResult, orderData) {
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('orderContent');
    
    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">
                Заказ #${orderResult.orderId}
            </div>
            <div style="color: var(--success-color); font-size: 24px; font-weight: 600; margin-bottom: 16px;">
                ${formatPrice(orderData.total)}
            </div>
            <p style="color: var(--text-color); margin-bottom: 8px;">
                ${orderResult.message}
            </p>
            <p style="color: var(--hint-color); font-size: 14px;">
                Товаров: ${orderData.products.reduce((sum, item) => sum + item.quantity, 0)} шт.
            </p>
        </div>
    `;
    
    modal.style.display = 'flex';
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
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

function showError(message) {
    alert('Ошибка: ' + message);
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