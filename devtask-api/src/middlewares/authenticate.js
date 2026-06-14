const { verifyAccessToken } = require("../utils/jwt");


const authenticate = async (req,res,next) => {
    try{

        // 1. get token from authorization header
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({message: 'Access token missing'});
        }

        // 2. extract token
        const token = authHeader.split(' ')[1];

        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    }catch(err){
        if(err.name === 'TokenExpiredError'){
            return res.status(401).json({message: 'Access token expired'});
        }
        return res.status(401).json({message: 'Invalid access token'});
    }
}

module.exports = authenticate;