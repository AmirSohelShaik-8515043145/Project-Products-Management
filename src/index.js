// mongodb+srv://amir-thorium:NSE7ZdUlu4no9WRF@cluster0.gchuo.mongodb.net/Group19-Data-base?authSource=admin&replicaSet=atlas-cw2o95-shard-0&w=majority&readPreference=primary&retryWrites=true&ssl=true

const express = require('express')
const bodyparser = require('body-parser')
const mongoose = require('mongoose')
const multer = require('multer')
const route = require('/.route/route')
const app = express()


app.use(bodyparser.json)
app.use(bodyparser.urlencoded({ extended: true }))
app.use(multer().any())

mongoose.connect("mongodb+srv://amir-thorium:NSE7ZdUlu4no9WRF@cluster0.gchuo.mongodb.net/Group19-Data-base?authSource=admin&replicaSet=atlas-cw2o95-shard-0&w=majority&readPreference=primary&retryWrites=true&ssl=true",
    ({ useNewUrlParser: true }))
    .then(() => console.log("MongoDB is connected"))
    .catch((err) => console.log(err))

app.use('/', route)

app.listen(process.env.PORT || 3000, function () { console.log("Express is running on 3000 Port") })