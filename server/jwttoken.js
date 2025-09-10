const jwt = require("jsonwebtoken")
function generateAccessToken (email) {
   return jwt.sign(email, process.env.ACCESS_SECRET, {expiresIn: '15m'})
}

function generateRefreshToken(email) {
    return jwt.sign(email, process.env.REFRESH_SECRET, {expiresIn: "20m"})
}

module.exports = { generateAccessToken, generateRefreshToken };