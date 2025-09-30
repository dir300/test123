const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Импорт модулей
const { 
    readJSONFile, 
    writeJSONFile, 
    initDatabase 
} = require('./database');

const { 
    authenticateUser, 
    isAdmin 
} = require('./auth');

// Инициализация базы данных
initDatabase();

// File paths
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const CATEGORIES_FILE = path.join(__dirname, 'categories.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const USERS_FILE = path.join(__dirname, 'users.json');

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// Serve static files
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/style.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/script.js'));
});

app.get('/admin.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.js'));
});

// API Routes

// Аутентификация
app.post('/api/auth', async (req, res) => {
    try {
        const userData = req.body;
        const result = await authenticateUser(userData);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Products
app.get('/api/products', async (req, res) => {
    try {
        const products = await readJSONFile(PRODUCTS_FILE);
        res.json(products);
    } catch (error) {
        console.error('Error reading products:', error);
        res.status(500).json({ error: 'Failed to load products' });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const products = await readJSONFile(PRODUCTS_FILE);
        const newProduct = {
            id: Date.now(),
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        await writeJSONFile(PRODUCTS_FILE, products);
        
        res.json({ success: true, product: newProduct });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const products = await readJSONFile(PRODUCTS_FILE);
        const productIndex = products.findIndex(p => p.id == req.params.id);
        
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        products[productIndex] = {
            ...products[productIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await writeJSONFile(PRODUCTS_FILE, products);
        res.json({ success: true, product: products[productIndex] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const products = await readJSONFile(PRODUCTS_FILE);
        const filteredProducts = products.filter(p => p.id != req.params.id);
        
        if (products.length === filteredProducts.length) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        await writeJSONFile(PRODUCTS_FILE, filteredProducts);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Categories
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await readJSONFile(CATEGORIES_FILE);
        res.json(categories);
    } catch (error) {
        console.error('Error reading categories:', error);
        res.status(500).json({ error: 'Failed to load categories' });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const categories = await readJSONFile(CATEGORIES_FILE);
        const newCategory = {
            id: req.body.name.toLowerCase().replace(/\s+/g, '-'),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        categories.push(newCategory);
        await writeJSONFile(CATEGORIES_FILE, categories);
        
        res.json({ success: true, category: newCategory });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create category' });
    }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const categories = await readJSONFile(CATEGORIES_FILE);
        const categoryIndex = categories.findIndex(c => c.id === req.params.id);
        
        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        categories[categoryIndex] = {
            ...categories[categoryIndex],
            ...req.body
        };
        
        await writeJSONFile(CATEGORIES_FILE, categories);
        res.json({ success: true, category: categories[categoryIndex] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update category' });
    }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        const categories = await readJSONFile(CATEGORIES_FILE);
        const filteredCategories = categories.filter(c => c.id !== req.params.id);
        
        if (categories.length === filteredCategories.length) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        await writeJSONFile(CATEGORIES_FILE, filteredCategories);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await readJSONFile(ORDERS_FILE);
        res.json(orders);
    } catch (error) {
        console.error('Error reading orders:', error);
        res.status(500).json({ error: 'Failed to load orders' });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const orders = await readJSONFile(ORDERS_FILE);
        const newOrder = {
            id: 'ORDER-' + Date.now(),
            ...req.body,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Сохраняем вес для каждого товара
        newOrder.products = newOrder.products.map(item => ({
            ...item,
            weight: item.weight || item.quantity // поддержка старых заказов
        }));
        
        orders.push(newOrder);
        await writeJSONFile(ORDERS_FILE, orders);
        
        console.log('New order created:', newOrder.id);
        
        res.json({
            success: true,
            orderId: newOrder.id,
            message: 'Order created successfully'
        });
        
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Весовая система для товаров
function openProductModal(product) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalProductTitle');
    const content = document.getElementById('modalProductContent');

    const cartItem = cart.find(item => item.product.id === product.id);
    const currentWeight = cartItem ? cartItem.weight : product.minWeight;

    title.textContent = product.name;
    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">${product.image}</div>
            <div style="font-size: 18px; color: var(--hint-color); margin-bottom: 8px;">
                ${getCategoryName(product.category)}
            </div>
            <div style="font-size: 14px; color: var(--hint-color); margin-bottom: 12px;">
                ${product.price} ₽/${product.unit === 'г' ? 'кг' : 'л'}
            </div>
            <div style="font-size: 24px; font-weight: 600; color: var(--link-color);">
                ${formatPrice(calculatePrice(product.price, currentWeight, product.unit))}
            </div>
        </div>
        <p style="margin-bottom: 20px; color: var(--text-color);">${product.description}</p>
        
        <div style="margin-bottom: 20px;">
            <label class="form-label">Вес:</label>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <button class="quantity-btn" onclick="changeWeight(${product.id}, -${product.step})">-</button>
                <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                    <input type="number" 
                           id="weightInput-${product.id}" 
                           class="form-input" 
                           style="text-align: center; padding: 8px;"
                           value="${currentWeight}"
                           min="${product.minWeight}"
                           step="${product.step}"
                           onchange="updateWeightFromInput(${product.id})">
                    <span>${product.unit}</span>
                </div>
                <button class="quantity-btn" onclick="changeWeight(${product.id}, ${product.step})">+</button>
            </div>
            <div style="font-size: 12px; color: var(--hint-color); text-align: center;">
                Мин.: ${product.minWeight}${product.unit}, шаг: ${product.step}${product.unit}
            </div>
        </div>
        
        ${product.inStock === false ? `
            <div style="text-align: center; color: var(--error-color); padding: 16px; background: var(--secondary-bg-color); border-radius: 8px; margin-bottom: 16px;">
                🔴 Нет в наличии
            </div>
        ` : `
            <button class="btn ${cartItem ? 'btn-success' : ''}" onclick="addToCartWithWeight(${product.id})">
                ${cartItem ? '✅ В корзине' : 'Добавить в корзину'}
            </button>
        `}
    `;

    modal.style.display = 'flex';
}

// Расчет цены на основе веса
function calculatePrice(pricePerKg, weight, unit) {
    if (unit === 'г') {
        return (pricePerKg * weight) / 1000;
    } else if (unit === 'мл') {
        return (pricePerKg * weight) / 1000;
    }
    return pricePerKg * weight;
}

// Изменение веса
function changeWeight(productId, delta) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const input = document.getElementById(`weightInput-${productId}`);
    let currentWeight = parseFloat(input.value) || product.minWeight;
    let newWeight = currentWeight + delta;

    if (newWeight < product.minWeight) {
        newWeight = product.minWeight;
    }

    input.value = newWeight;
    updateProductPrice(productId);
}

// Обновление веса из input
function updateWeightFromInput(productId) {
    const product = products.find(p => p.id === productId);
    const input = document.getElementById(`weightInput-${productId}`);
    let newWeight = parseFloat(input.value) || product.minWeight;

    if (newWeight < product.minWeight) {
        newWeight = product.minWeight;
        input.value = newWeight;
    }

    // Округление до шага
    const remainder = newWeight % product.step;
    if (remainder !== 0) {
        newWeight = newWeight - remainder + (remainder >= product.step / 2 ? product.step : 0);
        input.value = newWeight;
    }

    updateProductPrice(productId);
}

// Обновление цены при изменении веса
function updateProductPrice(productId) {
    const product = products.find(p => p.id === productId);
    const input = document.getElementById(`weightInput-${productId}`);
    const weight = parseFloat(input.value) || product.minWeight;
    const priceElement = document.querySelector(`#modalProductContent div:nth-child(1) div:nth-child(4)`);
    
    if (priceElement) {
        priceElement.textContent = formatPrice(calculatePrice(product.price, weight, product.unit));
    }
}

// Добавление в корзину с весом
function addToCartWithWeight(productId) {
    const product = products.find(p => p.id === productId);
    const input = document.getElementById(`weightInput-${productId}`);
    const weight = parseFloat(input.value) || product.minWeight;

    const existingItem = cart.find(item => item.product.id === productId);
    
    if (existingItem) {
        existingItem.weight = weight;
    } else {
        cart.push({
            product: product,
            weight: weight
        });
    }
    
    updateCartUI();
    showNotification('Товар добавлен в корзину');
}

// Обновление UI корзины с учетом веса
function updateCartUI() {
    const totalPrice = cart.reduce((sum, item) => sum + calculatePrice(item.product.price, item.weight, item.product.unit), 0);
    const totalCount = cart.length;

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
                        ${item.weight}${item.product.unit} × ${formatPrice(item.product.price)}/${item.product.unit === 'г' ? 'кг' : 'л'}
                    </div>
                </div>
                <div style="font-weight: 600; margin: 0 12px;">
                    ${formatPrice(calculatePrice(item.product.price, item.weight, item.product.unit))}
                </div>
                <button onclick="removeFromCart(${item.product.id})" style="background: none; border: none; color: var(--hint-color); font-size: 20px; cursor: pointer; padding: 4px;">×</button>
            </div>
        `).join('');
    }
}

// Admin Statistics
app.get('/api/admin/stats', async (req, res) => {
    try {
        const [products, orders, users] = await Promise.all([
            readJSONFile(PRODUCTS_FILE),
            readJSONFile(ORDERS_FILE),
            readJSONFile(USERS_FILE)
        ]);
        
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const uniqueUsers = new Set(orders.map(order => order.user?.id)).size;
        
        res.json({
            totalProducts: products.length,
            totalOrders: orders.length,
            totalRevenue: totalRevenue,
            totalUsers: uniqueUsers
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load stats' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// Fallback for all other routes - serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 API available at /api`);
    console.log(`🛍️ Frontend available at /`);
    console.log(`⚙️ Admin panel available at /admin`);
});

module.exports = app;