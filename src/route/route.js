const express=require("express")
const router=express.Router()
const userController=require("../controller/userController")
const loginController = require('../controller/loginController')


router.post('/register',userController.createUser)
router.post('/login',loginController.login)

module.exports = router