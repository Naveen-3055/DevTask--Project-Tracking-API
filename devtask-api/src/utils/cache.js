

const {client} = require('../config/redis');

const DEFAULT_TTL = 60*5; 
// cached data will expire automatically after 5 minutes

// set a value in cache
const setCache = async (Key, data , ttl=DEFAULT_TTL) => {
    try{
        await client.setEx(Key,ttl, JSON.stringify(data));
    }catch(err){
        console.error('Cache ser error: ', err);
    }
};

// get a value from cache
const getCache = async (key) => {
    try{
        const data = await client.get(key);
        return data ? JSON.parse(data): null;
    }
    catch(err){
        console.error('Cache get error: ', err);
        return null;
    }
};

// delete a value from cache
const deleteCache = async (key) => {
    try{
        await client.del(key);
    }catch(err){
        console.error('Cache delete error:', err);
    }
};

// delete multiple keys by pattern
const deleteCacheByPattern = async (pattern) => {
    try{
        // SCAN is preferred instead of keys because it is non-blocking and more scalable."
        const keys = await client.keys(pattern);

        if(keys.length>0){
            await client.del(keys); 
        }
    }catch(err){
        console.error('Cache pattern delete error: ', err);
    }
};

module.exports={ setCache, getCache, deleteCache, deleteCacheByPattern}
