const express=require("express")
const router=express.Router()
const userController=require("../controller/userController")
const loginController = require('../controller/loginController')
const productController = require('../controller/productController')
const cartController = require('../controller/cartController')


router.post('/register',userController.createUser)
router.get('/user/:userId/profile',userController.getUserProfile)
router.put('/user/:userId/profile',userController.updateUser)

router.post('/login',loginController.login)

router.post('/products',productController.createProduct)
router.get('/products',productController.getProducts)
router.get('/products/:productId',productController.getProductById)
router.put('/products/:productId',productController.updateProduct)
router.delete('/products/:productId',productController.deleteProduct)

router.post('/users/:userId/cart',cartController.createCart)
router.put('/users/:userId/cart',cartController.updateCart)

module.exports=router