const pool = require('../config/db')

//Helper - verify user is org member
const checkOrgMemberShip = async (organizationId, userId) => {
    const result = await pool.query(
        `SELECT role FROM organization_members
        WHERE organization_id = $1 AND user_id = $2`,
        [organizationId,userId]
    );

    if(result.rows.length === 0){
        throw Object.assign(new Error("you are not a member of this organization"),{statusCode: 403});
    }
    return result.rows[0].role;
}

// Helper - log activity (table: activity logs)
const logActivity = async (client, {taskId, userId, action, field,  oldValue=null, newValue = null}) => {
    await client.query(
        `INSERT INTO activity_logs (task_id, user_id, action, field, old_value, new_value)
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [taskId,userId,action,field||null, 
            oldValue !== null
                ? JSON.stringify(oldValue)
                : null,
            newValue !== null
                ? JSON.stringify(newValue)
                : null
        ]
    );
}

//create a task
const createTask = async ({title, description, projectId, organizationId,assignedTo, priority, dueDate, userId}) => {
    
    // 1. check memberShip
    await checkOrgMemberShip(organizationId,userId);

    //2. verify project belongs to this org.
    const project = await pool.query(
        `SELECT id FROM projects 
        WHERE id=$1 AND organization_id = $2`,
        [projectId, organizationId]
    )

    if(project.rows.length === 0){
        throw Object.assign(new Error('Project not found in this organization.'),{statusCode: 404});
    }

    // 3. if assignedTO provided, verify they are an org member
    if(assignedTo){
        const assignee = await pool.query(
            `SELECT user_id FROM organization_members
            WHERE organization_id=$1 AND user_id = $2 `,
            [organizationId,assignedTo]
        )
        if(assignee.rows.length === 0){
            throw Object.assign(new Error('Assignee is not a member of this organization.'), {statusCode: 400});
        }
    }  
   
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 4. Insert task.
        const result = await client.query(
            `INSERT INTO tasks
                (title, description, project_id, organization_id, created_by,assigned_to, priority, due_date)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                RETURNING *`,
                [title, description||null, projectId, organizationId, userId, assignedTo||null, priority||'medium', dueDate||null]
        );

        const task = result.rows[0];

        // 5. log activity
        await logActivity(client,{
            taskId: task.id,
            userId,
            action: "created_task",
            // field: null,
            // oldValue: null,
            // newValue: null,
        });
        
        await client.query('COMMIT');
        return task;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }finally{
       client.release();
    }
}

// Get tasks with filters and pagination
const getTasks = async ({projectId, organizationId, userId, status, priority, assignedTo, page=1, limit=10}) => {
    // 1. check memberShip
    await checkOrgMemberShip(organizationId, userId);

    //2. build dynamic query with filters
    const conditions = ['t.project_id = $1', 't.organization_id = $2'];
    const values = [projectId,organizationId];
    let paramIndex = 3;

    if(status){
        conditions.push(`t.status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
    }

    if(priority){
        conditions.push(`t.priority = $${paramIndex}`);
        values.push(priority);
        paramIndex++;
    }

    if(assignedTo){
        conditions.push(`t.assigned_to = $${paramIndex}`);
        values.push(assignedTo);
        paramIndex++;
    }

    const offset = (page-1)*limit;

    // 3. Get total count for pagination meta
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM tasks t WHERE ${conditions.join(' AND ')}`,
    values
  );
  const total = parseInt(countResult.rows[0].count);

    // 4. Get tasks with creator and assignee names
    const result = await pool.query(
        `SELECT 
            t.id,t.title,t.description, t.status, t.priority,
            t.due_date, t.created_at, t.updated_at,
            creator.name As created_by_name,
            assignee.name AS assigned_to_name,
            assignee.id AS assigned_to_id
        FROM tasks t
        JOIN users creator ON creator.id = t.created_by
        LEFT JOIN users assignee ON assignee.id = t.assigned_to
        WHERE ${conditions.join(' AND ')}
        ORDER BY
           CASE t.priority
                WHEN 'urgent' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
            END,
            t.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex+1}`, 
        [...values,limit,offset]
    );

    return {
        tasks: result.rows,
        pagination : {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPage: Math.ceil(total/limit)
        }
    };
}

//get single task by Id
const getTaskById = async ({taskId, userId}) => {
    const result = await pool.query(
        `SELECT 
            t.*,
            creator.name AS created_by_name,
            assignee.name AS assigned_to_name
        FROM tasks t
        JOIN users creator ON creator.id = t.created_by
        LEFT JOIN users assignee ON assignee.id = t.assigned_to
        WHERE t.id = $1`,
        [taskId]
    );

    if(result.rows.length === 0){
        throw Object.assign(new Error('task not found'),{statusCode: 404});
    }

    const task = result.rows[0];

    // verify user is a memeber of the org this task belongs to
    await checkOrgMemberShip(task.organization_id, userId);
    return task;
}

// update a task
const updateTask = async ({taskId,userId,title,description,status,priority,assignedTo,dueDate}) => {
    // 1. Get existing task
    const existing = await getTaskById({taskId,userId});

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 2. track what changed for activity log
        const changes=[];
        if(status && status !== existing.status){
            changes.push({field: 'status', oldValue: existing.status,
            newValue: status, action: 'changed_status'});
        };

        if (priority && priority !== existing.priority) {
          changes.push({ field: 'priority', oldValue: existing.priority,       newValue: priority, action: 'changed_priority' });
       }
      if (assignedTo && assignedTo !== existing.assigned_to) {
         changes.push({ field: 'assigned_to', oldValue: existing.assigned_to, newValue: assignedTo, action: 'changed_assignee' });
      }
     if (title && title !== existing.title) {
       changes.push({ field: 'title', oldValue: existing.title, 
        newValue: title, action: 'changed_title' });
     }

     // 3. update task
     const result = await client.query(
        `UPDATE tasks SET
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            status = COALESCE($3, status),
            priority = COALESCE($4, priority),
            assigned_to = COALESCE($5, assigned_to),
            due_date = COALESCE($6, due_date),
            updated_at = NOW()
        WHERE id = $7
        RETURNING *`,
        [title,description,status,priority,assignedTo,dueDate,taskId]
     )

     for(const change of changes){
        await logActivity(client, {
            taskId, userId, action: change.action, field: change.field, oldValue: change.oldValue, newValue: change.newValue,
        });
     }

     await client.query('COMMIT');
     return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }finally{
      client.release();
    }

};


// DELETE a task

const deleteTask = async ({taskId, userId}) => {
    const task = await getTaskById({taskId,userId});

    // only creator or org owner/admin can delete
    const member = await pool.query(
        `SELECT role FROM organization_members
        WHERE organization_id=$1 AND user_id = $2`,
        [task.organization_id, userId]
    )
    const role = member.rows[0].role;
    const isCreator = task.created_by === userId;

    if(!isCreator && !['owner','admin'].includes(role)){
        throw Object.assign(new Error('you do not have permission to delete task'))
    }

    await pool.query('DELETE FROM tasks WHERE id=$1',[taskId]);
}

module.exports = {createTask,getTasks,getTaskById,updateTask,deleteTask};