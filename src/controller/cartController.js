const cartModel = require("../model/cartModel")
const productModel = require("../model/productModel")
const userModel = require("../model/userModel")
const validate = require('../validator/validator');

//Create cart api--------------------------------------------------------------------------------------------------------------------------------------------------------------
const createCart = async (req, res) => {
    try {
        const userId = req.params.userId
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(userId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid user id in Params" }) }

        const user = await userModel.findById(userId)
        if (!user) { return res.status(400).send({ status: false, msg: `Provided UserId ${userId} Does not exists.` }) }

        let data = req.body
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, msg: "Provide a product details in body to add in cart." }) };

        const findCart = await cartModel.findOne({ userId: userId })

        if (!findCart) {
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
            const productId = req.body.items[0].productId
            if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(productId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid product id in body" }) }

            const product = await productModel.findOne({ _id: productId }, { isDeleted: false })
            if (!product) return res.status(404).send({ status: false, message: "No product found according to your search" })

            for (let i = 0; i < findCart.items.length; i++) {
                if (productId == findCart.items[i].productId) {
                    const totalPrice = findCart.totalPrice + (product.price * data.items[0].quantity)
                    findCart.items[i].quantity = findCart.items[i].quantity + data.items[0].quantity
                    const newCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: findCart.items, totalPrice: totalPrice }, { new: true })
                    return res.status(201).send({ status: true, message: `product added In Your Cart Successfully`, data: newCart })

                }
            }
            const totalItem = data.items.length + findCart.totalItems
            const totalPrice = findCart.totalPrice + (product.price * data.items[0].quantity)
            const newCart = await cartModel.findOneAndUpdate({ userId: userId },
                {
                    $addToSet: { items: { $each: data.items } },
                    totalPrice: totalPrice,
                    totalItems: totalItem
                }, { new: true })
            return res.status(201).send({ status: true, message: `product added in Your Cart Successfully`, data: newCart })
        }
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message });
    }
}


// Update cart api--------------------------------------------------------------------------------------------------------------------------------------------------------------
const updateCart = async (req, res) => {
    try {
        let userId = req.params.userId
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(userId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid user id in Params" }) }
        
        const user = await userModel.findById(userId)
        if (!user) { return res.status(404).send({ status: false, msg: "user not exist with this userId" }) }

        let data = req.body
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, msg: "Provide a product details in body to update the cart." }) };
        const { cartId, productId, removeProduct } = data

        if (!validate.isValid(cartId)) { return res.status(400).send({ status: false, msg: "cartId is required" }) }
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(userId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid cart id in body" }) }

        if (!validate.isValid(productId)) { return res.status(400).send({ status: false, msg: "productId is required" }) }
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(productId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid product id in body" }) }
        const product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) { return res.status(404).send({ status: false, msg: "product not exist or deleted" }) }

        if (!(removeProduct == 0 || removeProduct == 1)) { return res.status(400).send({ status: false, msg: "removeProduct value should be either 0 or 1" }) }

        const findCart = await cartModel.findOne({ userId: userId, _id: cartId })
        if (!findCart) { return res.status(400).send({ status: false, msg: "No cart found,please create cart a first" }) }

        if (removeProduct == 1) {
            for (let i = 0; i < findCart.items.length; i++) {
                if (productId == findCart.items[i].productId) {
                    let totalPrice = findCart.totalPrice - product.price
                    if (findCart.items[i].quantity > 1) {
                        findCart.items[i].quantity -= 1
                        let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: totalPrice }, { new: true })
                        return res.status(200).send({ status: true, msg: "cart updated successfully", data: updateCart })
                    }
                    else {
                        totalItem = findCart.totalItems - 1
                        findCart.items.splice(i, 1)

                        let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalPrice: totalPrice, totalItems: totalItem }, { new: true })
                        return res.status(200).send({ status: true, msg: "cart removed successfully", data: updateCart })
                    }
                }
            }
        }
        if (removeProduct == 0) {
            for (let i = 0; i < findCart.items.length; i++) {
                if (productId == findCart.items[i].productId) {
                    let totalPrice = findCart.totalPrice - (product.price * findCart.items[i].quantity)
                    let totalItem = findCart.totalItems - 1
                    findCart.items.splice(i, 1)
                    let updateCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: findCart.items, totalItems: totalItem, totalPrice: totalPrice }, { new: true })
                    return res.status(200).send({ status: true, msg: "item removed successfully", data: updateCart })
                }
            }
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



module.exports = {
    createCart,
    updateCart
}