// index.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const shoppingListPath = path.join(__dirname, 'data', 'shoppingList.json');

// Helper function to read the JSON file
function readShoppingList() {
    try {
        const data = fs.readFileSync(shoppingListPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading shopping list:', err);
        return [];
    }
}

// Helper function to write to the JSON file
function writeShoppingList(data) {
    try {
        fs.writeFileSync(shoppingListPath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing to shopping list:', err);
    }
}

// Create the server
const server = http.createServer((req, res) => {
    // Set header for JSON responses
    res.setHeader('Content-Type', 'application/json');

    // GET /shopping-list - Retrieve the shopping list
    if (req.method === 'GET' && req.url === '/shopping-list') {
        const shoppingList = readShoppingList();
        res.writeHead(200);
        res.end(JSON.stringify(shoppingList));
    }
    
    // POST /shopping-list - Add a new item to the shopping list
    else if (req.method === 'POST' && req.url === '/shopping-list') {
        let body = '';
        req.on('data', chunk => body += chunk);
        
        req.on('end', () => {
            const newItem = JSON.parse(body);

            // Validation
            if (!newItem.name || typeof newItem.quantity !== 'number' || newItem.quantity <= 0) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid item format' }));
                return;
            }

            const shoppingList = readShoppingList();
            shoppingList.push(newItem);
            writeShoppingList(shoppingList);

            res.writeHead(201);
            res.end(JSON.stringify(newItem));
        });
    }
    
    // PUT /shopping-list/:name - Update an existing item
    else if (req.method === 'PUT' && req.url.startsWith('/shopping-list/')) {
        const itemName = req.url.split('/').pop();
        let body = '';
        req.on('data', chunk => body += chunk);
        
        req.on('end', () => {
            const updatedItem = JSON.parse(body);

            // Validation
            if (!updatedItem.name || typeof updatedItem.quantity !== 'number' || updatedItem.quantity <= 0) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid item format' }));
                return;
            }

            const shoppingList = readShoppingList();
            const index = shoppingList.findIndex(item => item.name === itemName);

            if (index === -1) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Item not found' }));
                return;
            }

            shoppingList[index] = { ...shoppingList[index], ...updatedItem };
            writeShoppingList(shoppingList);

            res.writeHead(200);
            res.end(JSON.stringify(shoppingList[index]));
        });
    }
    
    // DELETE /shopping-list/:name - Remove an item from the shopping list
    else if (req.method === 'DELETE' && req.url.startsWith('/shopping-list/')) {
        const itemName = req.url.split('/').pop();
        const shoppingList = readShoppingList();
        const index = shoppingList.findIndex(item => item.name === itemName);

        if (index === -1) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Item not found' }));
            return;
        }

        const deletedItem = shoppingList.splice(index, 1);
        writeShoppingList(shoppingList);

        res.writeHead(200);
        res.end(JSON.stringify(deletedItem[0]));
    }
    
    // Handle unknown routes
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:3001`);
});
