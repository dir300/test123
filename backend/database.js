const fs = require('fs').promises;
const path = require('path');

// File paths
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const CATEGORIES_FILE = path.join(__dirname, 'categories.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const USERS_FILE = path.join(__dirname, 'users.json');

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

// Initialize database with sample data
async function initDatabase() {
    try {
        // Check if products file exists, if not create with sample data
        try {
            await fs.access(PRODUCTS_FILE);
        } catch (error) {
            const sampleProducts = [
                {
                    id: 1,
                    name: "iPhone 15 Pro",
                    price: 99990,
                    description: "Новый iPhone с революционным дизайном и камерой",
                    image: "📱",
                    category: "electronics",
                    inStock: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: "MacBook Air M2",
                    price: 129990,
                    description: "Мощный и легкий ноутбук для работы и творчества",
                    image: "💻",
                    category: "laptops",
                    inStock: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 3,
                    name: "AirPods Pro",
                    price: 24990,
                    description: "Беспроводные наушники с активным шумоподавлением",
                    image: "🎧",
                    category: "audio",
                    inStock: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            await writeJSONFile(PRODUCTS_FILE, sampleProducts);
        }

        // Check if categories file exists
        try {
            await fs.access(CATEGORIES_FILE);
        } catch (error) {
            const sampleCategories = [
                { id: 'all', name: 'Все товары', icon: '🏠' },
                { id: 'electronics', name: 'Электроника', icon: '📱' },
                { id: 'laptops', name: 'Ноутбуки', icon: '💻' },
                { id: 'audio', name: 'Аудио', icon: '🎧' },
                { id: 'wearables', name: 'Гаджеты', icon: '⌚' }
            ];
            await writeJSONFile(CATEGORIES_FILE, sampleCategories);
        }

        // Initialize other files with empty arrays
        const files = [ORDERS_FILE, USERS_FILE];
        for (const file of files) {
            try {
                await fs.access(file);
            } catch (error) {
                await writeJSONFile(file, []);
            }
        }

        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    }
}

module.exports = {
    readJSONFile,
    writeJSONFile,
    initDatabase
};
