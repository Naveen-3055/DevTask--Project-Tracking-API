const pool = require('../config/db');
const { getTaskById } = require('./task.service');


const getActivityLogs = async ({taskId, userId}) => {
    // 1. verify task access
    await getTaskById({taskId, userId});

    const result = await pool.query(
        `SELECT al.id, al.action, al.field,
        al.old_value, al.new_value, al.created_at,
        u.name AS user_name , u.id AS user_id
        FROM activity_logs al
        JOIN users u ON u.id = al.user_id
        WHERE al.task_id = $1
        ORDER BY al.created_at DESC`,
        [taskId]
    );

    return result.rows;
}

module.exports = {
    getActivityLogs
}