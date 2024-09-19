const express = require('express');
const routes = require('./routes/Routes');
const cors = require('cors');
const pool = require('./db');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json());
app.use('/api', routes);

async function updatePendingOrders() {
    try {
        await pool.query(
            `UPDATE orders
             SET status = 'cancelled'
             WHERE status = 'pending'
             AND created_at <= NOW() - INTERVAL '15 minutes';`
        );
        console.log('Pending orders updated to canceled');
    } catch (error) {
        console.error('Error updating pending orders:', error);
    }
}

updatePendingOrders()


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

