const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const orderItemController = require('../controllers/orderItemController');
const cartController = require('../controllers/cartController');
const paymentController = require('../controllers/paymentController');
const ratingController = require('../controllers/ratingController')

// Các route cho user
router.post('/register', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/updateUser/:id', userController.updateUser);
router.get('/getAllUsers', userController.getAllUsers);
router.get('/getUserById/:id', userController.getUserById);

// Các route cho product
router.get('/getProductsInPage', productController.getProductsInPage);
router.get('/getProductDetails/:id', productController.getProductDetails);
router.post('/createProduct', productController.createProduct);
router.put('/updateProduct/:id', productController.updateProduct);
router.get('/getAllProducts', productController.getAllProducts);
// Order
router.post('/orderItem', orderItemController.orderItemUseCase);
router.get('/getOrderByUser/:userId', orderItemController.getOrderByUser);

//Cart
router.post('/addToCart', cartController.addToCart);
router.get('/getCartByUserId/:userId', cartController.getCart);
router.post('/updateCart/:userId', cartController.updateCart);
router.delete('/deleteFromCart/:userId', cartController.deleteFromCart);
router.delete('/deleteAllCart/:userId', cartController.deleteAllCart);

//Payment
router.post('/callback_zalopay', paymentController.callbackZaloPay);

//Top Customer
router.get('/getCustomers/:type', orderItemController.getCustomers);

//Rate
router.post('/rateProduct', ratingController.rateProduct)
module.exports = router;
