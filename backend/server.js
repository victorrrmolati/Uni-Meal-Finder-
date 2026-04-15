// ============================================================
//  Meal Finder App — Node.js + Express Backend
//  Updated to match renamed tables:
//  user, vendor, meal, cart_item, order, order_item, notification
// ============================================================

require('dotenv').config();
const express = require('express');
const mysql   = require('mysql2/promise');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://uni-meal-finder.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// ── DATABASE ─────────────────────────────────────────────────
const db = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     process.env.DB_PORT || 3306,
 
});

(async () => {
  try {
    await db.query('SELECT 1');
    console.log('Connected to MySQL database');
    console.log('Server running at http://localhost:' + PORT);
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
})();

// ── AUTH MIDDLEWARE ───────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied for your role' });
    }
    next();
  };
}

// ============================================================
//  AUTH ROUTES
// ============================================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const validRoles = ['student', 'staff', 'vendor'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    const [existing] = await db.query(
      'SELECT user_id FROM `user` WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO `user` (user_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );
    res.status(201).json({ message: 'Account created', userId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM `user` WHERE email = ?', [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id:    user.user_id,
        name:  user.user_name,
        email: user.email,
        role:  user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// ============================================================
//  VENDOR ROUTES
// ============================================================

// GET /api/vendors/all — must come BEFORE /api/vendors/:id
app.get('/api/vendors/all', authMiddleware, async (req, res) => {
  try {
    const [vendors] = await db.query(
      'SELECT vendor_id AS id, user_id, vendor_name AS name, description, location, logo_url FROM vendor'
    );
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors', details: err.message });
  }
});

// GET /api/vendors — public, used on the vendors listing page
app.get('/api/vendors', async (req, res) => {
  try {
    const [vendors] = await db.query(
      `SELECT vendor_id AS id, vendor_name AS name, description, location, logo_url
       FROM vendor WHERE is_active = TRUE`
    );
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors', details: err.message });
  }
});

// GET /api/vendors/:id
app.get('/api/vendors/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT vendor_id AS id, vendor_name AS name, description, location, logo_url
       FROM vendor WHERE vendor_id = ? AND is_active = TRUE`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor', details: err.message });
  }
});

// POST /api/vendors/register — vendor registers their stall
app.post('/api/vendors/register', authMiddleware, requireRole('vendor'), async (req, res) => {
  const { name, description, location, logo_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Vendor name is required' });
  try {
    const [existing] = await db.query(
      'SELECT vendor_id FROM vendor WHERE user_id = ?', [req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Vendor profile already exists' });
    }
    const [result] = await db.query(
      'INSERT INTO vendor (user_id, vendor_name, description, location, logo_url) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, name, description, location, logo_url]
    );
    res.status(201).json({ message: 'Vendor registered', vendorId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register vendor', details: err.message });
  }
});

// PUT /api/vendors/me
app.put('/api/vendors/me', authMiddleware, requireRole('vendor'), async (req, res) => {
  const { name, description, location, logo_url, is_active } = req.body;
  try {
    await db.query(
      `UPDATE vendor SET
        vendor_name = COALESCE(?, vendor_name),
        description = COALESCE(?, description),
        location    = COALESCE(?, location),
        logo_url    = COALESCE(?, logo_url),
        is_active   = COALESCE(?, is_active)
       WHERE user_id = ?`,
      [name, description, location, logo_url, is_active, req.user.id]
    );
    res.json({ message: 'Vendor profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vendor', details: err.message });
  }
});

// ============================================================
//  MEAL ROUTES
// ============================================================

// GET /api/vendors/:vendorId/meals
app.get('/api/vendors/:vendorId/meals', async (req, res) => {
  try {
    const [meals] = await db.query(
      `SELECT meal_id AS id, meal_name AS name, description, price, image_url, is_available
       FROM meal WHERE vendor_id = ?`,
      [req.params.vendorId]
    );
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch meals', details: err.message });
  }
});

// POST /api/meals — vendor adds a meal
app.post('/api/meals', authMiddleware, requireRole('vendor'), async (req, res) => {
  const { name, description, price, image_url } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });
  try {
    const [vendorRows] = await db.query(
      'SELECT vendor_id FROM vendor WHERE user_id = ?', [req.user.id]
    );
    if (vendorRows.length === 0) {
      return res.status(404).json({ error: 'Vendor profile not found' });
    }
    const vendorId = vendorRows[0].vendor_id;
    const [result] = await db.query(
      'INSERT INTO meal (vendor_id, meal_name, description, price, image_url) VALUES (?, ?, ?, ?, ?)',
      [vendorId, name, description, price, image_url]
    );
    res.status(201).json({ message: 'Meal added', mealId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add meal', details: err.message });
  }
});

// PUT /api/meals/:id — vendor edits a meal
app.put('/api/meals/:id', authMiddleware, requireRole('vendor'), async (req, res) => {
  const { name, description, price, image_url, is_available } = req.body;
  try {
    await db.query(
      `UPDATE meal SET
        meal_name    = COALESCE(?, meal_name),
        description  = COALESCE(?, description),
        price        = COALESCE(?, price),
        image_url    = COALESCE(?, image_url),
        is_available = COALESCE(?, is_available)
       WHERE meal_id = ?`,
      [name, description, price, image_url, is_available, req.params.id]
    );
    res.json({ message: 'Meal updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update meal', details: err.message });
  }
});

// DELETE /api/meals/:id
app.delete('/api/meals/:id', authMiddleware, requireRole('vendor'), async (req, res) => {
  try {
    await db.query('DELETE FROM meal WHERE meal_id = ?', [req.params.id]);
    res.json({ message: 'Meal deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete meal', details: err.message });
  }
});

// ============================================================
//  CART ROUTES
// ============================================================

// GET /api/cart
app.get('/api/cart', authMiddleware, async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT ci.cart_id AS id, ci.quantity,
              m.meal_name AS name, m.description, m.price, m.image_url,
              v.vendor_name AS vendor_name
       FROM cart_item ci
       JOIN meal   m ON ci.meal_id   = m.meal_id
       JOIN vendor v ON m.vendor_id  = v.vendor_id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart', details: err.message });
  }
});

// POST /api/cart
app.post('/api/cart', authMiddleware, async (req, res) => {
  const { meal_id, quantity = 1 } = req.body;
  if (!meal_id) return res.status(400).json({ error: 'meal_id is required' });
  try {
    await db.query(
      `INSERT INTO cart_item (user_id, meal_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user.id, meal_id, quantity]
    );
    res.json({ message: 'Added to cart' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to cart', details: err.message });
  }
});

// DELETE /api/cart/:id
app.delete('/api/cart/:id', authMiddleware, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM cart_item WHERE cart_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item', details: err.message });
  }
});

// DELETE /api/cart
app.delete('/api/cart', authMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM cart_item WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart', details: err.message });
  }
});

// ============================================================
//  ORDER ROUTES
// ============================================================

// POST /api/orders
app.post('/api/orders', authMiddleware, async (req, res) => {
  const { delivery_type, delivery_address, payment_method } = req.body;
  if (!delivery_type || !payment_method) {
    return res.status(400).json({ error: 'delivery_type and payment_method are required' });
  }
  try {
    const [cartItems] = await db.query(
      `SELECT ci.quantity, m.price, m.vendor_id
       FROM cart_item ci
       JOIN meal m ON ci.meal_id = m.meal_id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );
    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }
    const total_price = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );
    const vendor_id = cartItems[0].vendor_id;

    const [orderResult] = await db.query(
      `INSERT INTO orders (user_id, vendor_id, delivery_type, delivery_address, payment_method, total_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, vendor_id, delivery_type, delivery_address, payment_method, total_price]
    );
    const orderId = orderResult.insertId;

    const [fullCart] = await db.query(
      `SELECT ci.meal_id, ci.quantity, m.price
       FROM cart_item ci JOIN meal m ON ci.meal_id = m.meal_id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );
    for (const item of fullCart) {
      await db.query(
        'INSERT INTO order_item (order_id, meal_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, item.meal_id, item.quantity, item.price]
      );
    }

    await db.query('DELETE FROM cart_item WHERE user_id = ?', [req.user.id]);

    await db.query(
      'INSERT INTO notification (user_id, message) VALUES (?, ?)',
      [req.user.id, `Your order #${orderId} has been confirmed!`]
    );

    res.status(201).json({ message: 'Order confirmed!', orderId, total_price });
  } catch (err) {
    res.status(500).json({ error: 'Failed to place order', details: err.message });
  }
});

// GET /api/orders
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.order_id AS id, o.status, o.delivery_type, o.payment_method,
              o.total_price, o.created_at, v.vendor_name AS vendor_name
       orders o
       JOIN vendor v ON o.vendor_id = v.vendor_id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
});

// GET /api/orders/:id
app.get('/api/orders/:id', authMiddleware, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, v.vendor_name AS vendor_name
       orders o JOIN vendor v ON o.vendor_id = v.vendor_id
       WHERE o.order_id = ? AND o.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });

    const [items] = await db.query(
      `SELECT oi.quantity, oi.unit_price, m.meal_name AS name, m.image_url
       FROM order_item oi JOIN meal m ON oi.meal_id = m.meal_id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );
    res.json({ ...orders[0], items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order', details: err.message });
  }
});

app.put('/api/orders/:id/edit', authMiddleware, async (req, res) => {
  const { delivery_type, delivery_address, payment_method } = req.body;

  try {
    // Only allow editing if order is still pending
    const [rows] = await db.query(
      'SELECT status, user_id FROM orders WHERE order_id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own orders' });
    }

    if (rows[0].status !== 'pending') {
      return res.status(400).json({
        error: `Cannot edit order — it is already ${rows[0].status}. Only pending orders can be edited.`
      });
    }

    await db.query(
      `UPDATE orders SET
        delivery_type    = COALESCE(?, delivery_type),
        delivery_address = ?,
        payment_method   = COALESCE(?, payment_method)
       WHERE order_id = ?`,
      [delivery_type, delivery_address, payment_method, req.params.id]
    );

    // Notify the user
    await db.query(
      'INSERT INTO notification (user_id, message) VALUES (?, ?)',
      [req.user.id, `Your order #${req.params.id} has been updated successfully.`]
    );

    res.json({ message: 'Order updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order', details: err.message });
  }
});





app.get('/api/vendors/:vendorId/orders', authMiddleware, requireRole('vendor'), async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT 
        o.order_id    AS id,
        o.status,
        o.delivery_type,
        o.delivery_address,
        o.payment_method,
        o.total_price,
        o.created_at,
        u.user_name   AS customer_name
       orders o
       JOIN \`user\` u ON o.user_id = u.user_id
       WHERE o.vendor_id = ?
       ORDER BY o.created_at DESC`,
      [req.params.vendorId]
    );

    // Fetch items for each order
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT m.meal_name AS name, oi.quantity, oi.unit_price
         FROM order_item oi
         JOIN meal m ON oi.meal_id = m.meal_id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor orders', details: err.message });
  }
});


// PUT /api/orders/:id/status
app.put('/api/orders/:id/status', authMiddleware, requireRole('vendor'), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    await db.query(
      'UPDATE orders SET status = ? WHERE order_id = ?', [status, req.params.id]
    );
    const [orderRows] = await db.query(
      'SELECT user_id FROM orders WHERE order_id = ?', [req.params.id]
    );
    if (orderRows.length > 0) {
      await db.query(
        'INSERT INTO notification (user_id, message) VALUES (?, ?)',
        [orderRows[0].user_id, `Your order #${req.params.id} is now: ${status}`]
      );
    }
    res.json({ message: `Order status updated to: ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status', details: err.message });
  }
});

// ============================================================
//  NOTIFICATION ROUTES
// ============================================================

app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const [notifications] = await db.query(
      'SELECT * FROM notification WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await db.query(
      'UPDATE notification SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification', details: err.message });
  }
});

// ============================================================
//  FAVOURITES ROUTES
// ============================================================

app.get('/api/favourites', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT f.favourite_id AS id, m.meal_name AS name, m.price, m.image_url,
              v.vendor_name AS vendor_name
       FROM favourite f
       JOIN meal   m ON f.meal_id   = m.meal_id
       JOIN vendor v ON m.vendor_id = v.vendor_id
       WHERE f.user_id = ?`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch favourites', details: err.message });
  }
});

app.post('/api/favourites', authMiddleware, async (req, res) => {
  const { meal_id } = req.body;
  try {
    await db.query(
      'INSERT IGNORE INTO favourite (user_id, meal_id) VALUES (?, ?)',
      [req.user.id, meal_id]
    );
    res.json({ message: 'Added to favourites' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add favourite', details: err.message });
  }
});

app.delete('/api/favourites/:mealId', authMiddleware, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM favourite WHERE user_id = ? AND meal_id = ?',
      [req.user.id, req.params.mealId]
    );
    res.json({ message: 'Removed from favourites' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove favourite', details: err.message });
  }
});

// ============================================================
//  START SERVER
// ============================================================
app.listen(PORT, () => {});

