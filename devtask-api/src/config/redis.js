const {createClient} = require('redis')

const client = createClient({
    url: process.env.REDIS_URL,
});


client.on('error', (err)=> console.error('Redis error:',err));
client.on('connect', ()=> console.log('connected to redis'));

const connectRedis = async () => {
    await client.connect();
}

module.exports = {client,connectRedis};