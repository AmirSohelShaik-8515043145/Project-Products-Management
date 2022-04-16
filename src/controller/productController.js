const validator = require('../validator/validator')
const aws = require('../aws/aws')
const productModel = require('../model/productModel')
const currencySymbol = require("currency-symbol-map")

// Create Product Api --------------------------------------------------
const createProduct = async (req, res) => {
    try {
        let data = req.body;
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, msg: "Bad request, No data provided." }) };

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments } = data

        if (!validator.isValid(title)) { return res.status(400).send({ status: false, msg: "Title is required" }) }
        let duplicateTitle = await productModel.findOne({ title: title })
        if (duplicateTitle) return res.status(400).send({ status: false, msg: `${title} is alraedy in use. Please use another title` })

        if (!validator.isValid(description)) { return res.status(400).send({ status: false, msg: "Description is required" }) }
        if (!validator.isValid(price)) { return res.status(400).send({ status: false, msg: "Price is required" }) }
        if (!validator.isValid(currencyId)) { return res.status(400).send({ status: false, msg: "CurrencyId is required" }) }
        if (currencyId != 'INR') { return res.status(400).send({ status: false, msg: "CurrencyId should be INR" }) }
        data.currencyFormat = currencySymbol('INR')

        if (isFreeShipping) {
            if ((isFreeShipping != true)) { return res.status(400).send({ status: false, message: 'isFreeShipping must be a boolean value' }) }
        }

        let files = req.files;
        if (Object.keys(files).length == 0) { return res.status(400).send({ status: false, msg: "ProductImage is required" }) }
        const fileRes = await aws.uploadFile(files[0]);
        data.productImage = fileRes.Location;

        if (style == 0) { return res.status(400).send({ status: false, msg: "Style cannot be empty" }) }
        if (!(availableSizes)) { return res.status(400).send({ status: false, msg: "Available Size is required" }) }

        // Validation for availableSizes enum :
        var arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
        if (availableSizes) {
            let sizeArr = availableSizes.split(",").map(x => x.trim())
            for (let i = 0; i < sizeArr.length; i++) {
                if (!(arr.includes(sizeArr[i]))) {
                    return res.status(400).send({ status: false, message: `availableSizes should be among [${arr}]` })
                }
            }
            data.availableSizes = sizeArr
        }

        if (installments == 0) { return res.status(400).send({ status: false, msg: "Installment cannot be empty" }) }

        let userCreated = await productModel.create(data);
        res.status(201).send({ status: true, message: "User created successfully", data: userCreated })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


// Get Product Api -----------------------------------------------------
const getProducts = async function (req, res) {
    try {
        data = req.query
        let filter = {}
        filter.isDeleted = false

        const { name, size, priceGreaterThan, priceLessThan,priceSort } = data

        if (name != null) {
            if (!validator.isValid(name)) { return res.status(400).send({ status: false, msg: "Please provide a Name" }) }
            filter.title = name
        }

        if (size != null) {
            let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            if (!arr.includes(size)) { return res.status(400).send({ status: false, msg: "Please select a size in between " + arr }) }
            filter.availableSizes = size
        }

        if (priceGreaterThan != null) {
            if (Number(priceGreaterThan) == NaN) { return res.status(400).send({ status: false, msg: "Price should be a number" }) }
            if (Number(priceGreaterThan) <= 0) { return res.status(400).send({ status: false, msg: "Price provide a valid price" }) }
            filter.price = { $gte: Number(priceGreaterThan) }
        }

        if (priceLessThan != null) {
            if (Number(priceLessThan) == NaN) { return res.status(400).send({ status: false, msg: "Price should be a number" }) }
            if (Number(priceGreaterThan) <= 0) { return res.status(400).send({ status: false, msg: "Price provide a valid price" }) }
            filter.price = { $lte: Number(priceLessThan) }
        }

        if (priceGreaterThan != null && priceLessThan != null) {
            if ((Number(priceGreaterThan) == NaN) || (Number(priceLessThan) == NaN)) { return res.status(400).send({ status: false, msg: ".....Price should be a number" }) }
            if ((Number(priceGreaterThan) <= 0) || (Number(priceLessThan) <= 0)) { return res.status(400).send({ status: false, msg: ".....Price provide a valid price" }) }
            filter.price = { $gte: Number(priceGreaterThan), $lte: Number(priceLessThan) }
        }

        if(priceSort!=null){
            if (!((priceSort == 1) || (priceSort == -1))) {
                return res.status(400).send({ status: false, message: `priceSort should be 1 or -1 ` })
            }
        }

        let product = await productModel.find(filter).sort({price:priceSort});
        if (product.length == 0) return res.status(404).send({ status: false, message: "No product found according to your search" })
        return res.status(200).send({ status: true, message: 'Products found', data: product })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



module.exports = {
    createProduct,
    getProducts
}