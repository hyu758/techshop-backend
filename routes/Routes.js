const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const orderItemController = require('../controllers/orderItemController');
const cartController = require('../controllers/cartController');

// Các route cho user
router.post('/register', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/updateUser/:id', userController.updateUser);
router.get('/getUsers', userController.getUsers);
router.get('/getUserById/:id', userController.getUserById);

// Các route cho product
router.get('/getAllProducts', productController.getAllProducts);
router.get('/getProductDetails/:id', productController.getProductDetails);
router.post('/createProduct', productController.createProduct);
router.put('/updateProduct/:id', productController.updateProduct);

// Order
router.post('/orderItem', orderItemController.orderItemUseCase);
router.get('/getOrdersByStatus/:userId/:status', orderItemController.getOrderItemByUserAndStatus);

//Cart
router.post('/addToCart', cartController.addToCart);
router.get('/getCartByUserId/:userId', cartController.getCart);

module.exports = router;
