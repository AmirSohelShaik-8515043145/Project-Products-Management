const userModel = require('../model/userModel')
const cartModel = require('../model/cartModel')
const orderModel = require('../model/orderModel')
const validator = require('../validator/validator')


// Create Order Api------------------------------------------------------------------------------------------------------------------------------------------------------------
const createOrder = async function (req, res) {
    try {
        let userId = req.params.userId;
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(userId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid user id in Params" }) }

        let user = await userModel.findById(userId)
        if (!user) { return res.status(400).send({ status: false, msg: `Provided UserId ${userId} Does not exists.` }) }

        let data = req.body;
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, msg: "Provide a order details in body to add craete a order" }) };

        let { cartId, cancellable, status } = data

        if (!cartId) { return res.status(400).send({ status: false, message: "For create a order you have to put a cartId in body" }) }
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(cartId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid card id in body" }) }

        const findCart = await cartModel.findOne({ _id: cartId, userId: userId })
        if(!findCart) {return res.status(400).send({ status: false, message: "No cart found with this cartId" })}

        if (cancellable) {
            if ((typeof (cancellable) != "boolean")) { return res.status(400).send({ status: false, message: 'Cancellable must be boolean , either true or false' }) }
        }

        let arr = ['pending', 'completed', 'cancelled']
        if (status) {
            if (!(arr.includes(status))) { return res.status(400).send({ status: false, message: `Status must be among [${arr}]` }) }
        }

        if (findCart.items.length == 0) { return res.status(202).send({ status: false, message: 'Please add some products in cart to make an order' }) }

        let count = 0
        for (let i = 0; i < findCart.items.length; i++) {
            count = count + findCart.items[i].quantity
        }

        const orderDetails = {
            userId: userId,
            items: findCart.items,
            totalPrice: findCart.totalPrice,
            totalItems: findCart.totalItems,
            totalQuantity: count,
            cancellable,
            status,
        }

        const order = await orderModel.create(orderDetails);
        await cartModel.findOneAndUpdate({ _id: cartId, userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } })
        return res.status(200).send({ status: true, message: 'Order placed', data: order })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


// Update Order Api------------------------------------------------------------------------------------------------------------------------------------------------------------
const updateOrder = async (req, res) => {
    try {
        let userId = req.params.userId;
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(userId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid user id in Params" }) }

        let user = await userModel.findById(userId)
        if (!user) { return res.status(400).send({ status: false, msg: `Provided UserId ${userId} Does not exists.` }) }

        let data = req.body;
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, msg: "Provide a orderId in body to update a order" }) };

        const { orderId, status } = data

        if (!orderId) { return res.status(400).send({ status: false, message: "For update a order you have to put a orderId in body" }) }
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(orderId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid order id in body" }) }

        let findOrder = await orderModel.findOne({_id:orderId,userId: userId })
        if(!findOrder) {return res.status(400).send({ status: false, message: "No order found with this Order Id " })}

        let arr = ['pending', 'completed', 'cancelled']
        if (!validator.isValid(status)) { return res.status(400).send({ status: false, message: "status is required for order updation" }) }
        if (!(arr.includes(status))) { return res.status(400).send({ status: false, message: `Status must be among [${arr}]` }) }


        if (findOrder.cancellable == true) {
            if (findOrder.status == 'pending') {
                const updateStatus = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true })
                return res.status(200).send({ status: true, message: 'Successfully updated the order details', data: updateStatus })
            }
            if (findOrder.status == 'completed') {
                return res.status(400).send({ status: false, message: `Unable to update or change the status, because it's already in completed status.` })
            }
            if (findOrder.status == 'cancelled') {
                return res.status(400).send({ status: false, message: `Unable to update or change the status, because it's already in cancelled status.` })
            }
        }
        if (findOrder.cancellable == false) {
            if (data.status == 'cancelled') {
                return res.status(400).send({ status: false, message: "You cannot cancel this order, because its not cancellable." })
            }
            if (findOrder.status == 'pending') {
                const updateStatus = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true })
                return res.status(200).send({ status: true, message: 'Successfully updated the order details', data: updateStatus })
            }
            if (findOrder.status == 'completed') {
                return res.status(400).send({ status: false, message: "Unable to update or change the status, because it's already in completed status." })
            }

            if (findOrder.status == 'cancelled') {
                return res.status(400).send({ status: false, message: "Unable to update or change the status, because it's already in cancelled status." })
            }
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


// Get Order by Id------------------------------------------------------------------------------------------------------------------------------------------------------------
const getOrder = async (req, res) => {
    try {
        let order = await orderModel.find({isDeleted : false});
        return res.status(200).send({ status: true, totalOrder : order.length, message: "Order Details", data: order });
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


module.exports = {
    createOrder,
    updateOrder,
    getOrder
}










