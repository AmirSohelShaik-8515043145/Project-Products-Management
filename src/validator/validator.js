const isValid = function (value) {
    if (typeof value == "undefined" || value == null) return false
    // if (value.trim().length == 0) return false
    return true
}

const isValid1 = function (value) {
    if (typeof value == undefined || value == null || value == 0) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
}

module.exports={
    isValid,
    isValid1
}
