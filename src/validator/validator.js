const isValid = function (value) {
    if (typeof value == "undefined" || value == null) return false
    if (value.trim().length == 0) return false
    return true
}

module.exports.isValid = isValid;
