const pool = require('../config/db');


const getMe = async (req,res,next) => {
    try{
        const result = await pool.query(
            'SELECT id,name,email,created_at FROM users WHERE id = $1',
            [req.user.userId]
        );
        const user = result.rows[0];
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        res.status(200).json({user});
    }catch(err){
        next(err);
    }
}

module.exports = {getMe};