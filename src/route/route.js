const express=require("express")
const router=express.Router()
const userController=require("../controller/userController")
const loginController = require('../controller/loginController')
const productController = require('../controller/productController')


router.post('/register',userController.createUser)
router.get('/user/:userId/profile',userController.getUserProfile)
router.put('/user/:userId/profile',userController.updateUser)

router.post('/login',loginController.login)

router.post('/products',productController.createProduct)
router.get('/products',productController.getProducts)


module.exports=router