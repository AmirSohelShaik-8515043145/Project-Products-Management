const jwt = require("jsonwebtoken")
const bcrypt= require('bcrypt')
const userModel = require("../model/userModel")
const validator = require("../validator/validator")

const login = async function (req, res) {
    try {
        const data = req.body

        if (Object.keys(data) == 0) return res.status(400).send({ status: false, msg: "Bad Request, No data provided" })
     
        if (!validator.isValid(data.email)) { return res.status(400).send({ status: false, msg: "Email is required" }) }
        if (!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(data.email.trim()))){return res.status(400).send({ status:false, msg: "Please enter a valid Email."})};

        if (!validator.isValid(data.password)) { return res.status(400).send({ status: false, msg: "Password is required" }) };
        if (!(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(data.password))) { return res.status(400).send({ status: false, msg: "please provide a valid password with one uppercase letter ,one lowercase, one character and one number " }) }
        
        let user = await userModel.findOne({email:data.email})
        if(!user) {return res.status(400).send({ status: false, msg: "Email or Password is incorrect" })}

        let checkPass = user.password
        let checkUser = await bcrypt.compare(data.password,checkPass)
        if (checkUser==false) return res.status(400).send({ status: false, msg: "Email or Password is incorrect" })

        const token = jwt.sign({
            userId: user._id,
        }, "Group-19", {expiresIn: "30m" })
        return res.status(200).send({ status: true, msg: "You are successfully logged in", userId:user.id,token })
    }
    catch (error) {
        return res.status(500).send({ msg: error.message })
    }
}

module.exports.login = login