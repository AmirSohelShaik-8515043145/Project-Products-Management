const orderModel = require('../model/orderModel')
const validator = require('../validator/validator')

const createOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(userId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid user id in Params" }) }

        let data = req.body;
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, msg: "Provide a product details in body to Create a Order." }) };

        let { items, totalPrice, totalItems, totalQuantity } = data

        if (items.length == 0) { return res.status(400).send({ status: false, msg: 'items cant be empty' }) }
        if (!validator.isValid1(items)) { return res.status(400).send({ status: false, message: 'items is required in the request body' }) }
        if (!validator.isValid(totalPrice)) { return res.status(400).send({ status: false, message: 'totalPrice is required in the request body' }) }
        if (!validator.isValid(totalItems)) { return res.status(400).send({ status: false, message: 'totalItems is required in the request body' }) }
        if (!validator.isValid(totalQuantity)) { return res.status(400).send({ status: false, message: 'totalQuantity required in the request body' }) }

        const order = await orderModel.create(data);
        res.status(201).send({ status: true, msg: 'sucesfully created order', data: order })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, Message: error.message })
    }
}


const updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(userId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid user id in Params" }) }

        let orderId = req.body.orderId;
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, msg: "Provide a product details in body to Cancel a Order." }) };
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(userId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid order id in body" }) }
        
        const checkOrder = await orderModel.findOne({ _id: orderId, isDeleted: false })
        if (!(checkOrder.userId == userId)) {
            return res.status(400).send({ status: true, message: 'order not blongs to the user ' })
        } ""
        if (!(checkOrder.cancellable === true)) {
            return res.status(400).send({ status: true, message: 'order didnt have the cancellable policy ' })
        }
        let updateOrder = await orderModel.findOneAndUpdate({ _id: orderId }, { status: "canceled" }, { new: true })
        res.status(200).send({ status: true, msg: 'sucesfully updated', data: updateOrder })

    } catch (error) {
        res.status(500).send({ status: false, Message: error.message })
    }
}


module.exports.createOrder = createOrder
module.exports.updateOrder = updateOrder