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
            `INSERT INTO orders (user_id, status, total_amount, phone, customer_name, address) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *`,
            [userId, orderStatus.PENDING, amount, phone, name, address]
        );

        const newOrderId = newOrderResult.rows[0].id;
        console.log(`New Order ID: ${newOrderId}`);
        await pool.query('COMMIT');
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
    console.log("getOrderByUser " + userId);
    
    try {
        // Thực hiện truy vấn cơ sở dữ liệu để lấy đơn hàng và sản phẩm
        const result = await pool.query(
            `SELECT 
                orders.id AS order_id, 
                orders.total_amount, 
                orders.status, 
                orders.phone, 
                orders.customer_name, 
                orders.address, 
                products.name AS product_name, 
                products.price, 
                products.id AS product_id,
                products.image_url, 
                orderitems.quantity,
                orderitems.israted,
                orderitems.ratevalue
            FROM orders 
            INNER JOIN orderitems ON orders.id = orderitems.order_id
            INNER JOIN products ON orderitems.product_id = products.id
            WHERE orders.user_id = $1
            ORDER BY orders.created_at DESC;`,
            [userId]
        );

        // Kiểm tra nếu không có đơn hàng nào
        if (result.rows.length === 0) {
            return res.status(404).json({ error: `No orders found for user ${userId}` });
        }

        // Gom các sản phẩm theo từng order_id
        const orders = {};
        
        result.rows.forEach(row => {
            const { order_id, total_amount, status, phone, customer_name, address, product_name, price, image_url, quantity, product_id, israted, ratevalue } = row;

            if (!orders[order_id]) {
                // Nếu order_id chưa tồn tại trong object, khởi tạo một đối tượng mới cho đơn hàng này
                orders[order_id] = {
                    order_id,
                    total_amount,
                    status,
                    phone,
                    customer_name,
                    address,
                    products: []
                };
            }

            // Thêm sản phẩm vào danh sách sản phẩm của đơn hàng
            orders[order_id].products.push({
                product_name,
                price,
                image_url,
                quantity,
                product_id,
                isRated: israted, // Thêm trường isRated vào đối tượng sản phẩm
                rateValue: ratevalue // Thêm trường rateValue vào đối tượng sản phẩm
            });
        });

        // Chuyển đổi object thành array
        const ordersArray = Object.values(orders);

        // Trả về kết quả dưới dạng JSON
        res.status(200).json(ordersArray);
    }
    catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

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
        console.log(type)
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

async function updateRatingOrderItems(orderId, productId, rating) {
    try {
        // Câu lệnh SQL để cập nhật thông tin đánh giá
        console.log('update orderitems', orderId, productId, rating)
        const result = await pool.query(
            'UPDATE orderitems SET israted = true, ratevalue = $1 WHERE order_id = $2 and product_id = $3',
            [rating, orderId, productId]
        );

        // Kiểm tra nếu không có hàng nào bị ảnh hưởng
        if (result.rowCount === 0) {
            throw new Error('Order item not found');
        }

        // Trả về thông tin thành công hoặc có thể không trả gì nếu không cần
        return { message: 'Rating updated successfully' };
    } catch (error) {
        console.error('Error updating rating:', error);
        throw error;
    }
}

const getOrdersByPage = async (req, res) => {
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
        // Truy vấn dữ liệu và sắp xếp theo created_at từ mới nhất đến cũ nhất
        const result = await pool.query(
            'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limitNumber, offset]
        );
        
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    getOrdersByPage,
    getCustomers,
    getOrderItemsByOrderId,
    orderItemUseCase,
    getOrderByUser,
    updateRatingOrderItems,
};