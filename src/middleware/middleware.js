const jwt = require("jsonwebtoken");
const cartModel = require("../model/cartModel");
const userModel = require("../model/userModel")

const authentication = async function (req, res, next) {
    try {
        let token = req.header('Authorization', 'Bearer Token');
        if (!token) return res.status(400).send({ status: false, msg: "login is required, Set a header" })
        console.log(token)

        let splitToken = token.split(" ")[1]
        let decodedtoken = jwt.verify(splitToken, "Group-19")
        if (!decodedtoken) return res.status(400).send({ status: false, msg: "token is invalid" })
        next();
    }
    catch (error) {
        return res.status(500).send({ msg: error.message })
    }
}

let authorization = async function (req, res, next) {
    try {
        let token = req.header('Authorization', 'Bearer Token');
        let splitToken = token.split(" ")[1]
        let decodedtoken = jwt.verify(splitToken, "Group-19")
        let userId = req.params.userId;
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(userId.trim()))) { return res.status(400).send({ status: false, message: "You should have put correct Id inside params" }) }

        let user2 = await cartModel.findOne({ userId: userId })
        if (!user2) {
            let user1 = await userModel.findOne({ _id: userId })
            if (decodedtoken.userId != user1._id) { return res.status(403).send({ status: false, msg: "You are not authorised" }) }
            next()
        }
        else {
            if (decodedtoken.userId != user2.userId) { return res.status(403).send({ status: false, msg: "You are not authorised" }) }
            next()
        }
    }
    catch (error) {
        return res.status(500).send({ msg: error.message })
    }
}

module.exports = {
    authentication,
    authorization
}