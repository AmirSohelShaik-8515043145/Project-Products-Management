const express = require("express")
const router = express.Router()
const userController = require("../controller/userController")
const loginController = require('../controller/loginController')
const productController = require('../controller/productController')
const cartController = require('../controller/cartController')
const orderController = require('../controller/orderController')
const { authentication, authorization } = require("../middleware/middleware")


router.post('/register', userController.createUser)
router.get('/user/:userId/profile', authentication, userController.getUserProfile)
router.put('/user/:userId/profile', authentication, authorization, userController.updateUser)

router.post('/login', loginController.login)

router.post('/products', productController.createProduct)
router.get('/products', productController.getProducts)
router.get('/products/:productId', productController.getProductById)
router.put('/products/:productId', productController.updateProduct)
router.delete('/products/:productId', productController.deleteProduct)

router.post('/users/:userId/cart', authentication, authorization, cartController.createCart)
router.get('/users/:userId/cart', authentication, authorization, cartController.getCart)
router.put('/users/:userId/cart', authentication, authorization, cartController.updateCart)
router.delete('/users/:userId/cart', authentication, authorization, cartController.deleteCart)

router.post('/users/:userId/orders', authentication, authorization, orderController.createOrder)
router.get('/users/:userId/orders', orderController.getOrder)
router.put('/users/:userId/orders', authentication, authorization, orderController.updateOrder)

module.exports = router