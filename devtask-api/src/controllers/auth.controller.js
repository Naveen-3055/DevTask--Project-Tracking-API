const { registerUser, loginUser, logoutUser, refreshToken } = require("../services/auth.services");


const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}


// register controller
const register = async (req,res,next) => {
    
    try{
        const {name,email,password} = req.body;

        if(!name || !email || !password){
            return res.status(400).json({message: 'All fields are required'});
        }

        if(password.length < 0){
            return res.status(400).json({message: 'Password must be at least 6 characters'});
        }

        const {user, accessToken, refreshToken} = await registerUser({name,email,password});

        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

        res.status(201).json({message: "user registered successfully", user, accessToken});
    }catch(err){
        next(err);

    }
}

// login controller

const login = async (req,res,next) => {
    try{
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({message: "ALl fields are required"});
        }

        const {user, accessToken, refreshToken} = await loginUser({email,password});

        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

        res.status(200).json({message: "Login successful", user, accessToken});
    }catch(err){
        next(err);
    }
}

// refresh token controller
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    const { accessToken } = await refreshToken(token);
    res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
};

// logout controller

const logout = async  (req,res,next) => {
    try{
        const token = req.cookies.refreshToken;
        await logoutUser(token);
        res.clearCookie('refreshToken', COOKIE_OPTIONS);
        res.status(200).json({message: "Logout successful"});
    }catch(err){
        next(err);
    }
}

module.exports = {register,login,refresh,logout};