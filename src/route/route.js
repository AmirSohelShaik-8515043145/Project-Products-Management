const express = require("express")
const router = express.Router()

const { createUser, getUserProfile, updateUser } = require("../controller/userController")
const loginController = require('../controller/loginController')
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require('../controller/productController')
const { createCart, getCart, updateCart, deleteCart } = require('../controller/cartController')
const { createOrder, getOrder, updateOrder } = require('../controller/orderController')
const { authentication, authorization } = require("../middleware/middleware")


router.post('/register', createUser)
router.get('/user/:userId/profile', authentication, getUserProfile)
router.put('/user/:userId/profile', authentication, authorization, updateUser)

router.post('/login', loginController.login)

router.post('/products', createProduct)
router.get('/products', getProducts)
router.get('/products/:productId', getProductById)
router.put('/products/:productId', updateProduct)
router.delete('/products/:productId', deleteProduct)

router.post('/users/:userId/cart', authentication, authorization, createCart)
router.get('/users/:userId/cart', authentication, authorization, getCart)
router.put('/users/:userId/cart', authentication, authorization, updateCart)
router.delete('/users/:userId/cart', authentication, authorization, deleteCart)

router.post('/users/:userId/orders', authentication, authorization, createOrder)
router.get('/users/:userId/orders', authentication, authorization, getOrder)
router.put('/users/:userId/orders', authentication, authorization, updateOrder)

module.exports = router