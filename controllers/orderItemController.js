const pool = require('../db');
const productController = require("./productController")
const orderStatus = require('../enum/orderStatus')
const paymentController = require('../controllers/paymentController')
const topCustomerType = require('../enum/topCustomerType');
const userController = require('../controllers/userController')

async function getOrderItemsByOrderId(id) {
    try {
        const result = await pool.query('SELECT * FROM orderitems WHERE order_id = $1', [id]);

        if (result.rows.length === 0) {
            throw new Error('Order not found');
        }

        return result.rows;
    } catch (error) {
        throw error;
    }
};

async function updateOrderStatus(orderId, status) {
    try {
        const result = await pool.query(
            `UPDATE orders 
            SET status = $2 
            WHERE id = $1 
            RETURNING *`,
            [orderId, status]);

        if (result.rows.length === 0) {
            throw new Error('Order not found');
        }

        return result.rows;
    } catch (error) {
        throw error;
    }
}

const orderItemUseCase = async (req, res) => {
    const { userId, productIds, quantities, phone, name, address } = req.body;

    // Kiểm tra nếu số lượng và danh sách sản phẩm không khớp
    if (quantities.length !== productIds.length) {
        return res.status(400).json({ message: 'Quantities and productIds length mismatch!' });
    }

    try {
        // Lấy danh sách sản phẩm theo productIds
        let products = await productController.getProductsByIdIn(productIds);

        // Kiểm tra nếu số lượng sản phẩm trả về từ DB không khớp với productIds
        if (products.length !== productIds.length) {
            return res.status(404).json({ message: 'Some products not found!' });
        }

        // Tính toán giá cho từng sản phẩm
        let price = [];
        let amount = 0;
        for (let i = 0; i < products.length; i++) {
            let priceOfItem = (1 - products[i].discount) * products[i].price * quantities[i];
            price.push(priceOfItem);
            amount += priceOfItem;
        }

        // Bắt đầu transaction
        await pool.query('BEGIN');

        // Tạo đơn hàng mới với phone, name, và address
        const newOrderResult = await pool.query(
            `INSERT INTO orders (user_id, status, total_amount, phone, name, address) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *`,
            [userId, orderStatus.PENDING, amount, phone, name, address]
        );
        const newOrderId = newOrderResult.rows[0].id;
        console.log(`New Order ID: ${newOrderId}`);

        // Thêm các mục vào đơn hàng
        const insertOrderItemsPromises = productIds.map((productId, index) => {
            return pool.query(
                `INSERT INTO orderitems (order_id, product_id, quantity, price) 
                VALUES ($1, $2, $3, $4) 
                RETURNING *`,
                [newOrderId, productId, quantities[index], price[index]]
            );
        });

        // Chờ tất cả các truy vấn chèn dữ liệu hoàn tất
        await Promise.all(insertOrderItemsPromises);

        // Cập nhật số lượng sản phẩm
        const updateStockPromises = productIds.map((productId, index) => {
            return pool.query(
                'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [quantities[index], productId]
            );
        });

        // Chờ tất cả các truy vấn cập nhật hoàn tất
        await Promise.all(updateStockPromises);

        // Cam kết transaction
        await pool.query('COMMIT');

        // Thực hiện thanh toán
        let url = await paymentController.pay(userId, newOrderId, amount);

        // Phản hồi thành công
        res.status(200).json({ orderId: newOrderId, paymentUrl: url });
    } catch (error) {
        // Rollback transaction nếu có lỗi
        await pool.query('ROLLBACK');
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


const getOrderByUser = async (req, res) => {
    const { userId } = req.params;
    console.log("getOrderItemByUser " + userId);
    try {
        const result = await pool.query(
            `SELECT total_amount, status, phone, orders.name, address, products.name, products.price, products.image_url, products.rating
            FROM orders INNER JOIN orderitems ON orders.id = orderitems.order_id
            INNER JOIN products on orderitems.product_id = products.id
            WHERE orders.user_id = $1`,
            [userId]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Order not found' + userId});
        }

        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(400);
    }
}

const getCustomers = async (req, res) => {
    const { type } = req.params;
    console.log("top customer type: ", type);

    const { limit = 10, page = 0 } = req.query;

    const limitNumber = parseInt(limit, 10);
    const pageNumber = parseInt(page, 10);

    if (isNaN(limitNumber) || limitNumber <= 0) {
        return res.status(400).json({ error: "Invalid limit value" });
    }
    if (isNaN(pageNumber) || pageNumber < 0) {
        return res.status(400).json({ error: "Invalid page value" });
    }
    const offset = pageNumber * limitNumber;
    try {
        const userIds = []
        const value = []
        if (type == topCustomerType.ORDER_COUNT) {
            const result = await pool.query(
                `SELECT user_id, COUNT(*) AS order_count
                 FROM orders
                 WHERE status = $3
                 GROUP BY user_id
                 ORDER BY order_count DESC
                 LIMIT $1 OFFSET $2`,
                [limit, offset, orderStatus.DELIVERED]
            );

            if (result.rows.length === 0) {
                res.status(200).json({data: []});
            }

            userIds.push(...result.rows.map(row => row.user_id));
            value.push(...result.rows.map(row => row.order_count));
        }
        else {
            const result = await pool.query(
                `SELECT user_id, SUM(total_amount) AS spent
                 FROM orders
                 WHERE status = $3
                 GROUP BY user_id
                 ORDER BY spent DESC
                 LIMIT $1 OFFSET $2`,
                [limit, offset, orderStatus.DELIVERED]
            );

            if (result.rows.length === 0) {
                res.status(200).json({data: []});
            }
            
            userIds.push(...result.rows.map(row => row.user_id));
            value.push(...result.rows.map(row => row.spent));
        }
        let users = await userController.getUserByIdIn(userIds);

        const combinedData = userIds.map((userId, index) => ({
            userId: userId,
            userName: users[index].name || 'Unknown',
            value: value[index] || 0
        }));

        res.status(200).json({data: combinedData});
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(400);
    }
}

module.exports = {
    getCustomers,
    updateOrderStatus,
    getOrderItemsByOrderId,
    orderItemUseCase,
    getOrderByUser
};