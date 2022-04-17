const cartModel = require("../model/cartModel")
const productModel = require("../model/productModel")
const userModel = require("../model/userModel")
// const validate = require('../validator/validator');

//Cart Creation
const createCart = async (req, res) => {
    try {
        const userId = req.params.userId
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(userId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid user id in Params" }) }

        const user = await userModel.findById(userId)
        if (!user) { return res.status(400).send({ status: false, msg: `Provided UserId ${userId} Does not exists.` }) }

        const findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) {
            let data = req.body
            if (Object.keys(data) == 0) { return res.status(400).send({ status: false, msg: "Bad request, No data provided." }) };

            const productId = req.body.items[0].productId
            if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(productId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid product id in body" }) }

            const product = await productModel.findOne({ _id: productId }, { isDeleted: false })
            if (!product) return res.status(404).send({ status: false, message: "No product found according to your search" })

            const totalItems = data.items.length
            const totalPrice = product.price * data.items[0].quantity

            const cartData = {
                userId: userId,
                items: data.items,
                totalPrice: totalPrice,
                totalItems: totalItems
            }
            console.log(cartData)
            const cart = await cartModel.create(cartData)
            return res.status(201).send({ status: true, message: `cart created successfully`, data: cart })
        }
        if (findCart) {
            console.log(findCart)
            let data = req.body
            if (Object.keys(data) == 0) { return res.status(400).send({ status: false, msg: "Bad request, No data provided." }) };

            const productId = req.body.items[0].productId
            if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(productId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid product id in body" }) }

            const product = await productModel.findOne({ _id: productId }, { isDeleted: false })
            if (!product) return res.status(404).send({ status: false, message: "No product found according to your search" })

            if (productId == findCart.items[0].productId) {
                const totalPrice = findCart.totalPrice + (product.price * data.items[0].quantity)
                for (let i = 0; i < findCart.items.length; i++) {
                    findCart.items[i].quantity = findCart.items[i].quantity + data.items[0].quantity
                    const newCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: findCart.items, totalPrice: totalPrice }, { new: true })
                    return res.status(201).send({ status: true, message: `product added In Your Cart Successfully`, data: newCart })
                }
            }
            else {
                const totalItem = data.items.length + findCart.totalItem
                const newCart = await cartModel.findOneAndUpdate({ userId: userId },
                    {
                        $addToSet: { 'data.items': { $each: data.items } },
                        totalPrice: totalPrice,
                        totalItems: totalItem
                    }, { new: true })
                return res.status(201).send({ status: true, message: `product added in Your Cart Successfully`, data: newCart })
            }
        }
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message });
    }
}

module.exports = {
    createCart
}