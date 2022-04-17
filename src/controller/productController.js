const validator = require('../validator/validator')
const aws = require('../aws/aws')
const productModel = require('../model/productModel')
const currencySymbol = require("currency-symbol-map")

// Create Product Api ----------------------------------------------------------------------------------------------------------------------------------------------------------
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
        data.currencyFormat = currencySymbol(currencyId)

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
        let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
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
        if(installments) {if (installments % 1 != 0) { return res.status(400).send({ status: false, msg: "installments cannot be a decimal value" }) }}

        let userCreated = await productModel.create(data);
        res.status(201).send({ status: true, message: "Product created successfully", data: userCreated })
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


// Get Product Api -------------------------------------------------------------------------------------------------------------------------------------------------------------
const getProducts = async function (req, res) {
    try {
        data = req.query
        let filter = {}
        filter.isDeleted = false

        const { name, size, priceGreaterThan, priceLessThan, priceSort } = data

        if (name != null) {
            if (!validator.isValid(name)) { return res.status(400).send({ status: false, msg: "Please provide a Name" }) }
            filter.title = { $regex: name }
        }

        if (size != null) {
            let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            if (!arr.includes(size)) { return res.status(400).send({ status: false, msg: `Please select a size in between [${arr}]` }) }
            filter.availableSizes = size
        }

        if (priceGreaterThan != null) {
            if (Number(priceGreaterThan) == NaN) { return res.status(400).send({ status: false, msg: "Price should be a number" }) }
            if (Number(priceGreaterThan) <= 0) { return res.status(400).send({ status: false, msg: "please provide a valid price" }) }
            filter.price = { $gte: Number(priceGreaterThan) }
        }

        if (priceLessThan != null) {
            if (Number(priceLessThan) == NaN) { return res.status(400).send({ status: false, msg: "Price should be a number" }) }
            if (Number(priceGreaterThan) <= 0) { return res.status(400).send({ status: false, msg: "Please provide a valid price" }) }
            filter.price = { $lte: Number(priceLessThan) }
        }

        if (priceGreaterThan != null && priceLessThan != null) {
            if ((Number(priceGreaterThan) == NaN) || (Number(priceLessThan) == NaN)) { return res.status(400).send({ status: false, msg: "Price should be a number" }) }
            if ((Number(priceGreaterThan) <= 0) || (Number(priceLessThan) <= 0)) { return res.status(400).send({ status: false, msg: "Please provide a valid price" }) }
            filter.price = { $gte: Number(priceGreaterThan), $lte: Number(priceLessThan) }
        }

        if (priceSort != null) {
            if (!((priceSort == 1) || (priceSort == -1) || (priceSort == null))) {
                return res.status(400).send({ status: false, message: 'priceSort should be 1 or -1' })
            }
        }

        console.log(filter)
        let product = await productModel.find(filter).sort({ price: priceSort });
        if (product.length == 0) return res.status(404).send({ status: false, message: "No product found according to your search" })
        return res.status(200).send({ status: true, message: 'Products found', count: product.length, data: product })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


// Get Product by Id------------------------------------------------------------------------------------------------------------------------------------------------------------
const getProductById = async (req, res) => {
    try {
        let productId = req.params.productId;
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(productId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid product id in Params" }) }

        let product = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!product) return res.status(404).send({ status: false, message: "No product found according to your search" })
        return res.status(200).send({ status: true, message: "product Details", data: product });
    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}


// Update Product Api-----------------------------------------------------------------------------------------------------------------------------------------------------------
const updateProduct = async (req, res) => {
    try {
        let productId = req.params.productId
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(productId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid product id in Params" }) }

        let product = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!product) { return res.status(400).send({ status: false, msg: `Provided ProductId ${productId} Does not exists.` }) }

        let data = req.body
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, style, availableSizes, installments } = data

        // Product Image validation :
        let files = req.files
        if (Object.keys(files).length != 0) {
            const fileRes = await aws.uploadFile(files[0]);
            data.productImage = fileRes.Location;
        }

        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, msg: "Pls, provide some data to update." }) }

        if (title == 0) { return res.status(400).send({ status: false, msg: "Title cannot be empty" }) }
        let duplicateTitle = await productModel.findOne({ title: title })
        if (duplicateTitle) return res.status(400).send({ status: false, msg: 'Title is already exist' })

        if (description == 0) { return res.status(400).send({ status: false, msg: "Description cannot be empty" }) }
        if (currencyId == 0) { return res.status(400).send({ status: false, msg: "currencyId cannot be empty" }) }
        if (currencyId) { if (!(currencyId == "INR")) { return res.status(400).send({ status: false, message: 'currencyId should be a INR' }) } }
        if (style == 0) { return res.status(400).send({ status: false, msg: "style cannot be empty" }) }
        if (installments == 0) { return res.status(400).send({ status: false, msg: "installments cannot be empty" }) }
        if(installments) {if (installments % 1 != 0) { return res.status(400).send({ status: false, msg: "installments cannot be a decimal value" }) }}
        if (price == 0) { return res.status(400).send({ status: false, msg: "price cannot be empty" }) }
        if (Number(price) <= 0) { return res.status(400).send({ status: false, message: `Price should be a valid number` }) }

        // FreeShipping validation :
        if (isFreeShipping == 0) { return res.status(400).send({ status: false, msg: "isFreeShipping cannot be empty" }) }
        if (isFreeShipping) {
            if (!((isFreeShipping === "true") || (isFreeShipping === "false"))) {
                return res.status(400).send({ status: false, message: 'isFreeShipping should be a boolean value' })
            }
        }

        // AvailableSize validation :
        let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
        if (availableSizes == 0) { return res.status(400).send({ status: false, msg: "availableSizes cannot be empty" }) }
        if (availableSizes) {
            let sizeArr = availableSizes.split(",").map(x => x.trim())
            for (let i = 0; i < sizeArr.length; i++) {
                if (!(arr.includes(sizeArr[i]))) {
                    return res.status(400).send({ status: false, message: `availableSizes should be among [${arr}]` })
                }
            }
            data.availableSizes = sizeArr
        }

        

        let updatedProduct = await productModel.findOneAndUpdate({ _id: productId },
            {
                $set:
                {
                    title: title,
                    description: description,
                    price: price,
                    currencyId: currencyId,
                    isFreeShipping: isFreeShipping,
                    style: style,
                    availableSizes: availableSizes,
                    productImage: data.productImage,
                    installments:installments
                }
            }, { new: true })
        return res.status(201).send({ status: true, product: updatedProduct })
    }
    catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}


// Delete Product Api ----------------------------------------------------------------------------------------------------------------------------------------------------------
const deleteProduct = async function (req, res) {
    try {
        const productId = req.params.productId
        if (!(/^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/.test(productId.trim()))) { return res.status(400).send({ status: false, message: "Please put a valid product id in Params" }) }

        let product = await productModel.findById(productId);
        if (!product) { return res.status(400).send({ status: false, msg: `Provided ProductId ${productId} does not exists.` }) }
        if (product.isDeleted == true) { return res.status(400).send({ status: true, message: 'Product has been already deleted' }) }

        await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { $set: { isDeleted: true, deletedAt: new Date() } })
        return res.status(200).send({ status: true, message: 'Product deleted successfully.' })
    }
    catch (error) {
        return res.status(500).send({ status: false, error: error.message })
    }
}




module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
}