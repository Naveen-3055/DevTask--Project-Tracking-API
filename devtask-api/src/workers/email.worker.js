const { Worker } = require('bullmq');
const { connection } = require('../config/queue');
const { sendTaskAssignmentEmail } = require('../utils/email');

const emailWorker = new Worker(
  'email-notifications',
  async (job) => {
    console.log(`Processing job: ${job.name}`);

    if (job.name === 'task-assigned') {
      await sendTaskAssignmentEmail(job.data);
      console.log(`Email sent to ${job.data.toEmail}`);
    }
  },
  {
    connection,
    concurrency: 5, // process up to 5 jobs at once
  }
);

emailWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

module.exports = emailWorker;