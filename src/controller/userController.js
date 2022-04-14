const userModel = require("../model/userModel")
const validator = require("../validator/validator")
const aws = require("../aws/aws")
const bcrypt = require('bcrypt')


// Create User Api --------------------------------------------------
const createUser = async (req, res) => {
    try {
        let data = req.body;
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, msg: "Bad request, No data provided." }) };

        let { fname, lname, profileImage, email, phone, password, address } = data

        if (!validator.isValid(fname)) { return res.status(400).send({ status: false, msg: "fname is required" }) }
        if (!validator.isValid(lname)) { return res.status(400).send({ status: false, msg: "lname is required" }) }

        // Profile Image Create :
        let files = req.files;
        if (Object.keys(files).length == 0) { return res.status(400).send({ status: false, msg: "ProfileImage is required" }) }
        const fileRes = await aws.uploadFile(files[0]);
        data.profileImage = fileRes.Location;

        // Email validation :
        if (!validator.isValid(email)) { return res.status(400).send({ status: false, msg: "email is required" }) }
        if (!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(email.trim()))) { return res.status(400).send({ status: false, msg: "Please provide a valid email" }) };
        let duplicateEmail = await userModel.findOne({ email: email })
        if (duplicateEmail) return res.status(400).send({ status: false, msg: 'Email is already exist' })

        // Phone number Validation :
        if (!validator.isValid(phone)) { return res.status(400).send({ status: false, msg: "phone is required" }) }
        if (!(/^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/.test(phone.trim()))) { return res.status(400).send({ status: false, msg: "please provide a valid moblie Number" }) }
        let duplicateNumber = await userModel.findOne({ phone: phone })
        if (duplicateNumber) return res.status(400).send({ status: false, msg: 'Phone number is already exist' })

        // Password Validation :
        if (!validator.isValid(password)) { return res.status(400).send({ status: false, msg: "password is required" }) }
        if (!(password.length >= 8 && password.length <= 15)) { return res.status(400).send({ status: false, message: "Password length should be 8 to 15 characters" }) }
        if (!(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(password.trim()))) { return res.status(400).send({ status: false, msg: "please provide atleast one uppercase letter ,one lowercase, one character and one number " }) }
        let securePassword = await bcrypt.hash(password, 4)
        password = securePassword

        if (!address) { return res.status(400).send({ status: false, msg: "Address is required" }) }

        // Shipping Address Validation :
        if (!address.shipping) { return res.status(400).send({ status: false, msg: "Shipping address is required" }) }
        if (!validator.isValid(address.shipping.street)) { return res.status(400).send({ status: false, msg: "street is required for Shipping address" }) }
        if (!validator.isValid(address.shipping.city)) { return res.status(400).send({ status: false, msg: "city is required for Shipping address" }) }
        if (!validator.isValid(address.shipping.pincode)) { return res.status(400).send({ status: false, msg: "pincode is required for Shipping address" }) }
        if (!(/^[1-9][0-9]{5}$/.test(address.shipping.pincode.trim()))) { return res.status(400).send({ status: false, msg: "Pleasee provide a valid pincode for shipping address" }) }

        // Billing Adrress validation :
        if (!address.billing) { return res.status(400).send({ status: false, msg: "billing address is required" }) }
        if (!validator.isValid(address.billing.street)) { return res.status(400).send({ status: false, msg: "street is required for Billing address" }) }
        if (!validator.isValid(address.billing.city)) { return res.status(400).send({ status: false, msg: "city is required for Billing address" }) }
        if (!validator.isValid(address.billing.pincode)) { return res.status(400).send({ status: false, msg: "pincode is required for Billing address" }) }
        if (!(/^[1-9][0-9]{5}$/.test(address.billing.pincode.trim()))) { return res.status(400).send({ status: false, msg: "Pleasee provide a valid pincode for billing address" }) }

        let userCreated = await userModel.create(data);
        res.status(201).send({ status: true, message: "User created successfully", data: userCreated })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


// Get User Profile Api ---------------------------------------------
const getUserProfile = async (req, res) => {
    try {
        let userId = req.params.userId;
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(userId.trim()))) { return res.status(400).send({ status: false, message: "Please put valid user id Params" }) }

        let user = await userModel.findById(userId);
        if (!user) return res.status(404).send({ status: false, message: "No user found according to your search" })
        return res.status(200).send({ status: true, message: "User Profile Details", data: user });
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


// Update User Profile Api ------------------------------------------
const updateUser = async (req, res) => {
    try {
        let userId = req.params.userId;
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(userId.trim()))) { return res.status(400).send({ status: false, message: "Please put valid user id Params" }) }

        let user = await userModel.findById(userId)
        if (!user) { return res.status(400).send({ status: false, msg: `Provided UserId ${userId} Does not exists.` }) }

        let data = req.body
        let { fname, lname, profileImage, email, phone, password, address } = data

        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, msg: "Pls, provide some data to update." }) }

        if (fname == 0) { return res.status(400).send({ status: false, msg: "First name cannot be empty" }) }
        if (lname == 0) { return res.status(400).send({ status: false, msg: "Last name cannot be empty" }) }

        let files = req.files
        if (Object.keys(files).length != 0) {
            const fileRes = await aws.uploadFile(files[0]);
            profileImage = fileRes.Location;
        }

        if (password == 0) { return res.status(400).send({ status: false, msg: "Password Cannot be empty" }) }
        if (password) if (!(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(password.trim()))) { return res.status(400).send({ status: false, msg: "Please provide a valid password,   Example :Abcd@452" }) }
        if (password) { password = await bcrypt.hash(password, 4) }

        if (email == 0) { return res.status(400).send({ status: false, msg: "Email Cannot be empty" }) };
        if (email) if (!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/.test(email.trim()))) { return res.status(400).send({ status: false, msg: "Please provide a valid email to update" }) };
        let emailDup = await userModel.findOne({ email: email })
        if (emailDup) { return res.status(400).send({ status: false, msg: "Email cannot be duplicate" }) }

        if (phone == 0) { return res.status(400).send({ status: false, msg: "Mobile Number Cannot be empty" }) };
        if (phone) if (!(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/.test(phone.trim()))) { return res.status(400).send({ status: false, msg: "please provide a valid moblie Number to update" }) };
        let phoneDup = await userModel.findOne({ phone: phone })
        if (phoneDup) { return res.status(400).send({ status: false, msg: "Phone number cannot be duplicate" }) }

        let jsonData = JSON.parse(JSON.stringify(data))
        if (jsonData.address == 0) { return res.status(400).send({ status: false, msg: "Please add shipping or billing address to update" }) }
        if (address) {
            let jsonAddress = JSON.parse(JSON.stringify(address))
            if (!(Object.keys(jsonAddress).includes("shipping") || Object.keys(jsonAddress).includes("billing"))) { return res.status(400).send({ msg: "Please add shipping or billing address to update" }) }

            let { shipping, billing } = jsonData.address
            if (shipping == 0) { return res.status(400).send({ status: false, msg: " Please add street ,city or pincode to update for shipping" }) }
            if (shipping) {
                if (!(Object.keys(shipping).includes("street") || Object.keys(shipping).includes("city") || Object.keys(shipping).includes("pincode"))) { return res.status(400).send({ msg: "Please add street,city or pincode for shipping to update" }) }

                if (shipping.street == 0) return res.status(400).send({ status: false, message: `Please provide shipping address's Street` });
                if (shipping.city == 0) return res.status(400).send({ status: false, message: `Please provide shipping address's city` });
                if (shipping.pincode == 0) return res.status(400).send({ status: false, message: `Please provide shipping address's pincode` });
                if (shipping.pincode) { if (!(/^[1-9][0-9]{5}$/.test(jsonData.address.shipping.pincode))) { return res.status(400).send({ status: false, msg: "Pleasee provide a valid pincode to update" }) } }
                var shippingStreet = shipping.street
                var shippingCity = shipping.city
                var shippingPincode = shipping.pincode
            }

            if (billing == 0) { return res.status(400).send({ status: false, msg: " Please add street ,city or pincode to update for billing" }) }
            if (billing) {
                if (!(Object.keys(billing).includes("street") || Object.keys(billing).includes("city") || Object.keys(billing).includes("pincode"))) { return res.status(400).send({ msg: "Please add street,city or pincode for billing to update" }) }

                if (billing.street == 0) return res.status(400).send({ status: false, message: `Please provide billing address's Street` });
                if (billing.city == 0) return res.status(400).send({ status: false, message: `Please provide billing address's city` });
                if (billing.pincode == 0) return res.status(400).send({ status: false, message: `Please provide billing address's pincode` });
                if (billing.pincode) { if (!(/^[1-9][0-9]{5}$/.test(jsonData.address.billing.pincode))) { return res.status(400).send({ status: false, msg: "Pleasee provide a valid pincode to update" }) } }
                var billingStreet = billing.street
                var billingCity = billing.city
                var billingPincode = billing.pincode
            }
        }
        let updatedUser = await userModel.findOneAndUpdate({ _id: userId },
            {
                $set:
                {
                    fname: fname,
                    lname: lname,
                    email: email,
                    phone: phone,
                    password: password,
                    profileImage: data.profileImage,
                    "address.shipping.street": shippingStreet,
                    "address.shipping.city": shippingCity,
                    "address.shipping.pincode": shippingPincode,
                    "address.billing.street": billingStreet,
                    "address.billing.city": billingCity,
                    "address.billing.pincode": billingPincode,
                }
            }, { new: true })
        return res.status(201).send({ status: true, updatedUser: updatedUser })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}



module.exports = {
    createUser,
    getUserProfile,
    updateUser
}