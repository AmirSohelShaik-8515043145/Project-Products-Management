const userModel = require("../model/userModel")
const validator = require("../validator/validator")
const aws = require("../aws/aws")
const bcrypt = require('bcrypt')


const createUser = async (req, res) => {
    try {
        let data = req.body;
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, msg: "Bad request, No data provided." }) };

        if (!validator.isValid(data.fname)) { return res.status(400).send({ status: false, msg: "fname is required" }) }
        if (!validator.isValid(data.lname)) { return res.status(400).send({ status: false, msg: "lname is required" }) }
        // if (!data.profileImage) { return res.status(400).send({ status: false, msg: "ProfileImage is required" }) }
        // let imageLink = await aws.uploadFile(req.files);
        // console.log(imageLink)
        // data.profileImage = imageLink


        let files = req.files;
        if (files) {
            for (const file of files) {
                const fileRes = await aws.uploadFile(file);
                data.profileImage = fileRes.Location;
            }
        }

        // Email validation :
        if (!validator.isValid(data.email)) { return res.status(400).send({ status: false, msg: "email is required" }) }
        if (!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(data.email.trim()))) { return res.status(400).send({ status: false, msg: "Please provide a valid email" }) };
        let duplicateEmail = await userModel.findOne({ email: data.email })
        if (duplicateEmail) return res.status(400).send({ status: false, msg: 'Email is already exist' })

        // Phone number Validation :
        if (!validator.isValid(data.phone)) { return res.status(400).send({ status: false, msg: "phone is required" }) }
        if (!(/^([+]\d{2})?\d{10}$/.test(data.phone.trim()))) { return res.status(400).send({ status: false, msg: "please provide a valid moblie Number" }) };
        let duplicateNumber = await userModel.findOne({ phone: data.phone })
        if (duplicateNumber) return res.status(400).send({ status: false, msg: 'Phone number is already exist' })

        // Password Validation :
        if (!validator.isValid(data.password)) { return res.status(400).send({ status: false, msg: "password is required" }) }
        if (!(data.password.length >= 8 && data.password.length <= 15)) { return res.status(400).send({ status: false, message: "Password length should be 8 to 15 characters" }) }
        if (!(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(data.password.trim()))) { return res.status(400).send({ status: false, msg: "please provide atleast one uppercase letter ,one lowercase, one character and one number " }) }
        let securePassword = await bcrypt.hash(data.password, 4)
        data.password = securePassword

        // Shipping Address Validation :
        if (!validator.isValid(data.address.shipping.street)) { return res.status(400).send({ status: false, msg: "street is required for Shipping address" }) }
        if (!validator.isValid(data.address.shipping.city)) { return res.status(400).send({ status: false, msg: "city is required for Shipping address" }) }
        if (!validator.isValid(data.address.shipping.pincode)) { return res.status(400).send({ status: false, msg: "pincode is required for Shipping address" }) }

        // Billing Adrress validation :
        if (!validator.isValid(data.address.shipping.street)) { return res.status(400).send({ status: false, msg: "street is required for Billing address" }) }
        if (!validator.isValid(data.address.shipping.city)) { return res.status(400).send({ status: false, msg: "city is required for Billing address" }) }
        if (!validator.isValid(data.address.shipping.pincode)) { return res.status(400).send({ status: false, msg: "pincode is required for Billing address" }) }

        let userCreated = await userModel.create(data);
        res.status(201).send({ status: true, message: "User created successfully", data: userCreated })
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })
    }
}

module.exports.createUser = createUser