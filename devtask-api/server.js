require('dotenv').config();

const app = require('./src/app');
const pool = require('./src/config/db');
const {connectRedis} = require('./src/config/redis');

require('./src/workers/email.worker'); // start worker;

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await pool.query('SELECT 1');
        console.log('connected to postgress');
        
        await connectRedis();

        app.listen(PORT, ()=> {
            console.log(`Server running on port ${PORT}`);
        });

    }catch(err){
        console.error('failed to start server', err.message);
        process.exit(1);
    }
}

startServer();
