const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// File paths
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// Helper functions for file operations
async function readJSONFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log(`File ${filePath} not found, returning empty array`);
        return [];
    }
}

async function writeJSONFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Routes

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await readJSONFile(PRODUCTS_FILE);
        res.json(products);
    } catch (error) {
        console.error('Error reading products:', error);
        res.status(500).json({ error: 'Failed to load products' });
    }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const products = await readJSONFile(PRODUCTS_FILE);
        const product = products.find(p => p.id === parseInt(req.params.id));
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        console.error('Error reading product:', error);
        res.status(500).json({ error: 'Failed to load product' });
    }
});

// Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const { products, total, user } = req.body;
        
        // Validation
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Invalid products data' });
        }
        
        if (!total || typeof total !== 'number') {
            return res.status(400).json({ error: 'Invalid total amount' });
        }

        // Read existing orders
        const orders = await readJSONFile(ORDERS_FILE);
        
        // Create new order
        const newOrder = {
            id: 'ORDER-' + Date.now(),
            products: products,
            total: total,
            user: user,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Add to orders
        orders.push(newOrder);
        
        // Save to file
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

// Get order by ID
app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const orders = await readJSONFile(ORDERS_FILE);
        const order = orders.find(o => o.id === req.params.orderId);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(order);
    } catch (error) {
        console.error('Error reading order:', error);
        res.status(500).json({ error: 'Failed to load order' });
    }
});

// Get all orders (for admin)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await readJSONFile(ORDERS_FILE);
        res.json(orders);
    } catch (error) {
        console.error('Error reading orders:', error);
        res.status(500).json({ error: 'Failed to load orders' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 API available at http://localhost:${PORT}/api`);
    console.log(`🛍️ Frontend available at http://localhost:${PORT}`);
});