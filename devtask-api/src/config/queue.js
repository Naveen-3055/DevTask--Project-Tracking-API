const {queue, worker} = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL,{
    maxRetriesPerRequest: null,
})

// email notification queue
const emailQueue = new Queue('email-notifications', {connection});

module.exports={emailQueue, connection};