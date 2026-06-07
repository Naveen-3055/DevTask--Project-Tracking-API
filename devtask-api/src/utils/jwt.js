const jwt = require('jsonwebtoken');

// generate access token
const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};


// generate refresh token
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    });
};

// verify access token
const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

// verify refresh token
const verifyRefreshToken = (token) =>{
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
}


module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};