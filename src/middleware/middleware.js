const jwt = require("jsonwebtoken");
const userModel = require("../model/userModel")

const authentication = async function (req, res, next) {
    try {
        let token = req.header('Authorization', 'Bearer Token');
        if (!token) return res.status(400).send({ status: false, msg: "login is required, Set an auth" })

        let splitToken = token.split(" ")

        let verifiedtoken = jwt.verify(splitToken[1], "Group-19")
        if (!verifiedtoken) return res.status(400).send({ status: false, msg: "token is invalid" })
        next();
    }
    catch (error) {
        return res.status(500).send({ msg: error.message })
    }
}

let authorization = async function (req, res, next) {
    try {
        let token = req.header('Authorization', 'Bearer Token');
        let splitToken = token.split(" ")
        let decodedtoken = jwt.verify(splitToken[1], "Group-19")
        let userId = req.params.userId;
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(userId.trim()))) { return res.status(400).send({ status: false, message: "You should have put correct user Id inside params" }) }

        let user = await userModel.findOne({ _id: userId })
        if (!user) { return res.status(404).send({ status: false, msg: "user does not exist with this userId" }) }
        if (decodedtoken.userId != user._id) { return res.status(403).send({ status: false, msg: "You are not authorised" }) }
        next()
    }
    catch (error) {
        return res.status(500).send({ msg: error.message })
    }
}

module.exports = {
    authentication,
    authorization
}