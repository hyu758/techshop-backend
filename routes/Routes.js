const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');

router.post('/register', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/updateUser/:id', userController.updateUser);
router.get('/getUsers', userController.getUsers);
router.get('/getUserById/:id', userController.getUserById);
// Product
router.get('/getAllProducts', productController.getAllProducts);
router.get('/getProductDetails/:id', productController.getProductDetails);
router.post('/createProduct', productController.createProduct);
router.put('/updateProduct/:id', productController.updateProduct);

module.exports = router;
