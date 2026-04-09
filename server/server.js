const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
  res.send('Backend po funksionon!');
});

// Routes
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');

app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/auth', authRoutes);

// Start server
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});