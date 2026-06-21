
const pool = require('../config/db');
const { getTaskById } = require('./task.service');


// add comment
const addComment = async ({taskId,userId, content}) => {

    // verify task exists and user has access
    await getTaskById({taskId,userId});

    const result = await pool.query(
        `INSERT INTO comments (task_id, user_id, content)
        VALUES ($1,$2,$3)
        RETURNING id, task_id, content, created_at`,
        [taskId,userId, content]
    );

    // 1. return comments with userName
    const comment = await pool.query(
        `SELECT c.id, c.content, c.created_at, u.name AS user_name, u.id AS user_id FROM comments c 
        JOIN users u ON u.id = c.user_id
        WHERE c.id = $1`,
        [result.rows[0].id]
    )

    return comment.rows[0];

}

// get all comments on a task
const getComments = async ({taskId, userId}) => {
    
    // 1. verify task access
    await getTaskById({taskId, userId});

    const result = await pool.query(
        `SELECT
            c.id, c.content, c.created_at, c.updated_at,
            u.id AS user_id, u.name AS user_name
        FROM comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.task_id = $1
        ORDER BY c.created_at ASC`,
        [taskId]
    );

    return result.rows;
}

// Delete a comment
const deleteComment = async ({commentId, userId}) => {
    const result = await pool.query(
        `SELECT * FROM comments WHERE id = $1`,
        [commentId]
    );

    if(result.rows.length === 0){
        throw Object.assign(new Error('comment not found'), {statusCode: 404});
    }
    const comment = result.rows[0];

    if(Comment.user_id !== userId){
        throw Object.assign(new Error("you can only delete your own comments", {statusCode: 403}));
    }

    await pool.query('DELETE FROM comments WHERE id =$1',[commentId]);
}

module.exports = {
    addComment, getComments, deleteComment
};