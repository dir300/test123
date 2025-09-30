// Админ-панель
const API_BASE_URL = window.location.origin + '/api';
let products = [];
let categories = [];
let orders = [];
let stats = {};

// Инициализация админ-панели
async function initAdmin() {
    try {
        await loadAdminData();
        renderStats();
        renderProductsList();
        renderCategoriesList();
        renderOrdersList();
        loadCategoryOptions();
    } catch (error) {
        console.error('Admin init error:', error);
        alert('Ошибка загрузки данных админ-панели');
    }
}

// Загрузка данных для админ-панели
async function loadAdminData() {
    const [productsRes, categoriesRes, ordersRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/products`),
        fetch(`${API_BASE_URL}/categories`),
        fetch(`${API_BASE_URL}/orders`),
        fetch(`${API_BASE_URL}/admin/stats`)
    ]);

    products = await productsRes.json();
    categories = await categoriesRes.json();
    orders = await ordersRes.json();
    stats = await statsRes.json();
}

// Переключение вкладок
function switchTab(tabName) {
    // Скрыть все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убрать активный класс у всех кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показать выбранную вкладку
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Активная кнопка
    event.target.classList.add('active');
}

// Рендер статистики
function renderStats() {
    document.getElementById('totalProducts').textContent = stats.totalProducts || products.length;
    document.getElementById('totalOrders').textContent = stats.totalOrders || orders.length;
    document.getElementById('totalRevenue').textContent = formatPrice(stats.totalRevenue || 
        orders.reduce((sum, order) => sum + order.total, 0));
    document.getElementById('totalUsers').textContent = stats.totalUsers || 
        new Set(orders.map(order => order.user?.id)).size;
}

// Загрузка опций категорий
function loadCategoryOptions() {
    const select = document.getElementById('productCategory');
    select.innerHTML = '';
    
    categories.forEach(category => {
        if (category.id !== 'all') {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.icon} ${category.name}`;
            select.appendChild(option);
        }
    });
}

// Сохранение товара
async function saveProduct(event) {
    event.preventDefault();
    
    const productData = {
    name: document.getElementById('productName').value,
    price: parseInt(document.getElementById('productPrice').value),
    category: document.getElementById('productCategory').value,
    description: document.getElementById('productDescription').value,
    image: document.getElementById('productIcon').value,
    inStock: document.getElementById('productInStock').checked,
    minWeight: parseInt(document.getElementById('productMinWeight').value),
    step: parseInt(document.getElementById('productStep').value),
    unit: document.getElementById('productUnit').value
    };
    
    const productId = document.getElementById('productId').value;
    
    try {
        const url = productId ? `${API_BASE_URL}/products/${productId}` : `${API_BASE_URL}/products`;
        const method = productId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            alert('Товар сохранен!');
            resetProductForm();
            await loadAdminData();
            renderProductsList();
            renderStats();
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        alert('Ошибка сохранения товара');
    }
}

// Редактирование товара
function editProduct(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) return;
    
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productIcon').value = product.image;
    document.getElementById('productInStock').checked = product.inStock !== false;
    document.getElementById('productMinWeight').value = product.minWeight || 100;
    document.getElementById('productStep').value = product.step || 50;
    document.getElementById('productUnit').value = product.unit || 'г';
        
    switchTab('products');
}

// Удаление товара
async function deleteProduct(productId) {
    if (!confirm('Удалить этот товар?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Товар удален!');
            await loadAdminData();
            renderProductsList();
            renderStats();
        } else {
            throw new Error('Delete failed');
        }
    } catch (error) {
        alert('Ошибка удаления товара');
    }
}

// Сброс формы товара
function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
}

// Рендер списка товаров
function renderProductsList() {
    const container = document.getElementById('productsList');
    container.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'admin-card';
        productCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="font-size: 24px;">${product.image}</span>
                        <h4 style="margin: 0;">${product.name}</h4>
                        ${product.inStock === false ? '<span style="color: var(--error-color); font-size: 12px;">(Нет в наличии)</span>' : ''}
                    </div>
                    <div style="color: var(--hint-color); margin-bottom: 8px;">${product.description}</div>
                    <div style="display: flex; gap: 12px; font-size: 14px;">
                        <span><strong>Цена:</strong> ${formatPrice(product.price)}/${product.unit === 'г' ? 'кг' : product.unit === 'мл' ? 'л' : 'шт'}</span>
                        <span><strong>Вес:</strong> от ${product.minWeight}${product.unit}, шаг ${product.step}${product.unit}</span>
                    </div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-warning btn-sm" onclick="editProduct(${product.id})">✏️</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">🗑️</button>
                </div>
            </div>
        `;
        container.appendChild(productCard);
    });
}

// Сохранение категории
async function saveCategory(event) {
    event.preventDefault();
    
    const categoryData = {
        name: document.getElementById('categoryName').value,
        icon: document.getElementById('categoryIcon').value
    };
    
    const categoryId = document.getElementById('categoryId').value;
    
    try {
        const url = categoryId ? `${API_BASE_URL}/categories/${categoryId}` : `${API_BASE_URL}/categories`;
        const method = categoryId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoryData)
        });
        
        if (response.ok) {
            alert('Категория сохранена!');
            resetCategoryForm();
            await loadAdminData();
            renderCategoriesList();
            loadCategoryOptions();
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        alert('Ошибка сохранения категории');
    }
}

// Редактирование категории
function editCategory(categoryId) {
    const category = categories.find(c => c.id == categoryId);
    if (!category || category.id === 'all') return;
    
    document.getElementById('categoryId').value = category.id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryIcon').value = category.icon;
    
    switchTab('categories');
}

// Удаление категории
async function deleteCategory(categoryId) {
    if (categoryId === 'all') return;
    
    // Проверяем есть ли товары в этой категории
    const productsInCategory = products.filter(p => p.category === categoryId);
    if (productsInCategory.length > 0) {
        alert('Нельзя удалить категорию, в которой есть товары!');
        return;
    }
    
    if (!confirm('Удалить эту категорию?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Категория удалена!');
            await loadAdminData();
            renderCategoriesList();
            loadCategoryOptions();
        } else {
            throw new Error('Delete failed');
        }
    } catch (error) {
        alert('Ошибка удаления категории');
    }
}

// Сброс формы категории
function resetCategoryForm() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
}

// Рендер списка категорий
function renderCategoriesList() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = '';
    
    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'admin-card';
        
        const productsCount = products.filter(p => p.category === category.id).length;
        const canDelete = category.id !== 'all' && productsCount === 0;
        
        categoryCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">${category.icon}</span>
                    <div>
                        <h4 style="margin: 0;">${category.name}</h4>
                        <div style="color: var(--hint-color); font-size: 14px;">
                            Товаров: ${productsCount}
                        </div>
                    </div>
                </div>
                <div class="btn-group">
                    ${category.id !== 'all' ? `
                        <button class="btn btn-warning btn-sm" onclick="editCategory('${category.id}')">✏️</button>
                    ` : ''}
                    ${canDelete ? `
                        <button class="btn btn-danger btn-sm" onclick="deleteCategory('${category.id}')">🗑️</button>
                    ` : ''}
                </div>
            </div>
        `;
        container.appendChild(categoryCard);
    });
}

// Рендер списка заказов
function renderOrdersList() {
    const container = document.getElementById('ordersList');
    container.innerHTML = '';
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="admin-card">Заказов пока нет</div>';
        return;
    }
    
    orders.reverse().forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'admin-card';
        
        const orderDate = new Date(order.timestamp).toLocaleDateString('ru-RU');
        const productsList = order.products.map(item => 
            `${item.product.name} × ${item.quantity}`
        ).join(', ');
        
        orderCard.innerHTML = `
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 8px;">
                    <h4 style="margin: 0;">Заказ #${order.id}</h4>
                    <span style="color: var(--hint-color); font-size: 14px;">${orderDate}</span>
                </div>
                <div style="color: var(--hint-color); margin-bottom: 8px;">
                    👤 ${order.user.first_name} ${order.user.last_name || ''} (@${order.user.username || 'без username'})
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Товары:</strong> ${productsList}
                </div>
                <div style="font-size: 18px; font-weight: 600; color: var(--link-color);">
                    ${formatPrice(order.total)}
                </div>
            </div>
        `;
        container.appendChild(orderCard);
    });
}

// Вспомогательные функции
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
    }).format(price);
}

function getCategoryName(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Другое';
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initAdmin);
