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