const pool = require('../config/db.js');
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');


// Register a new user
const registerUser = async({name,email,password}) =>{
    // 1. check if user already exists
    const existingUser = await pool.query(
        'SELECT id from users where email = $1',
        [email]
    );
    if(existingUser.rows.length > 0){
        throw new Error('User already exists');
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword  = await bcrypt.hash(password, salt);

    // 3. Insert User
    const result = await pool.query(
        'INSERT INTO users (name,email,password) VALUES ($1,$2,$3) RETURNING id,name,email, created_at',
        [name,email,hashedPassword]
    );

    const user = result.rows[0];

    // 4. Generate Tokens
    const accessToken = generateAccessToken({userId: user.id});
    const refreshToken = generateRefreshToken({userId: user.id});

    // 5. save refresh token in database
    const expiresAt = new Date(Date.now()+7*24*60*60*1000); // 7 days
    await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)',
        [user.id, refreshToken, expiresAt]
    );

    return {user, accessToken, refreshToken};   

}

// Login a user

const loginUser = async ({email, password}) => {
    // 1. check if user exists
    const result = await pool.query(
        'SELECT * from users where email = $1',
        [email]
    );

    const user = result.rows[0];
    if(!user){
        throw new Error('Invalid email or password');
    }

    // 2. compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        throw new Error('Invalid email or password');
    }

    // 3. Generate Tokens
    const accessToken = generateAccessToken({userId: user.id});
    const refreshToken = generateRefreshToken({userId: user.id});

    // 4. save refresh token in database
    const expiresAt = new Date(Date.now()+7*24*60*60*1000); // 7 days
    await pool.query(
        'INSERT INTO refresh_tokens (user_id,token,expires_at) VALUES ($1,$2,$3)',[user.id, refreshToken, expiresAt]
    );

    const {password: _, ...safeUser} = user;

    return {user: safeUser, accessToken, refreshToken};

}

// Refresh Token
const refreshToken = async (token) => {
    if(!token){
        throw new Error('Refresh token is required');
    }

    // 1. verify token signature
    const decoded = verifyRefreshToken(token);

    // 2 check token exists in database and not expired.
    const result = await pool.query(
        'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
        [token]
    );

    if(result.rows.length === 0){
        throw new Error('Invaalid or expires refresh token');
    }

    // Issue new Access token
    const accessToken = generateAccessToken({userId: decoded.userId});

    return {accessToken};

}

// logout user 

const logoutUser = async (token)=> {
    if(!token){
        throw new Error('Refresh token is requires');
    }

    await pool.query(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [token]
    );
}

module.exports = {registerUser, loginUser, refreshToken, logoutUser};