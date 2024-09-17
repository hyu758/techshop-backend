require('dotenv').config();

const pool = require('../db');
const axios = require('axios').default;
const CryptoJS = require('crypto-js');
const bodyParser = require('body-parser');
const moment = require('moment');
const qs = require('qs');
const orderStatus = require('../enum/orderStatus');
const orderItemController = require('./orderItemController');

async function pay(userId, orderId, amount) {

    const embed_data = {
        //sau khi hoàn tất thanh toán sẽ đi vào link này (thường là link web thanh toán thành công của mình)
        redirecturl: '/',
    };

    const items = [];
    items.push(orderId);
    const transID = Math.floor(Math.random() * 1000000);

    const order = {
        app_id: process.env.APP_ID,
        app_trans_id: `${moment().format('YYMMDD')}_${transID}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
        app_user: userId.toString(),
        app_time: Date.now(), // miliseconds
        item: JSON.stringify(items),
        embed_data: JSON.stringify(embed_data),
        amount: amount,
        //khi thanh toán xong, zalopay server sẽ POST đến url này để thông báo cho server của mình
        //Chú ý: cần dùng ngrok để public url thì Zalopay Server mới call đến được
        callback_url: 'https://techshop-backend-c7hy.onrender.com/api/callback_zalopay',
        description: `Payment for the order #${transID} of user #${userId}`,
        bank_code: '',
    };

    // appid|app_trans_id|appuser|amount|apptime|embeddata|item
    const data =
        order.app_id +
        '|' +
        order.app_trans_id +
        '|' +
        order.app_user +
        '|' +
        order.amount +
        '|' +
        order.app_time +
        '|' +
        order.embed_data +
        '|' +
        order.item;

        order.mac = CryptoJS.HmacSHA256(data, process.env.KEY1_ZALOPAY).toString();

    try {
        const result = await axios.post(process.env.ENDPOINT_ZALOPAY, null, { params: order });

        return result.data.order_url;
    } catch (error) {
        throw new Error('pay fail!');
    }
}

const callbackZaloPay = (req, res) => {
    let result = {};

    try {
        let dataStr = req.body.data;
        let reqMac = req.body.mac;

        let mac = CryptoJS.HmacSHA256(dataStr, process.env.KEY2_ZALOPAY).toString();

        // kiểm tra callback hợp lệ (đến từ ZaloPay server)
        if (reqMac !== mac) {
            // callback không hợp lệ
            result.return_code = -1;
            result.return_message = "mac not equal";
        }
        else {
            // thanh toán thành công
            // merchant cập nhật trạng thái cho đơn hàng
            let dataJson = JSON.parse(dataStr, process.env.KEY2_ZALOPAY);
            console.log("update order's status = success where app_trans_id =", dataJson["app_trans_id"]);

            if (dataJson && dataJson["item"] && dataJson["item"].length > 0) {
                orderItemController.updateOrderStatus(dataJson["item"][0], orderStatus.DELIVERED);
                result.return_code = 1;
                result.return_message = "OK";
            } else {
                orderItemController.updateOrderStatus(dataJson["item"][0], orderStatus.CANCELLED);
                result.return_code = -1;
                result.return_message = "Invalid data structure";
            }
        }
    } catch (ex) {
        orderItemController.updateOrderStatus(dataJson["item"][0], orderStatus.CANCELLED);
        result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
        result.return_message = ex.message;
    }

    // thông báo kết quả cho ZaloPay server
    res.json(result);
};

module.exports = { pay, callbackZaloPay };