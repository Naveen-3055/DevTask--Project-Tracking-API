const pool = require('../config/db');

// Helper -> check if user is a member of this org
const checkOrgMemberShip = async (organizationId, userId) => {
     console.log(organizationId,userId)
    const result = await pool.query(
        `SELECT role FROM organization_members
        WHERE organization_id = $1 AND user_id = $2`,
        [organizationId, userId]
    )
    if(result.rows.length === 0){
        throw Object.assign(new Error('You are not a member of this organization'), {statusCode: 403});
    }

    return result.rows[0].role;
}

// create a project
const createProject = async ({name,description, organizationId, userId})=>{
    // 1. check membership and role
    const role = await checkOrgMemberShip(organizationId,userId);

    // 2. Insert Porject
    const result = await pool.query(
        `INSERT INTO projects (name, description, organization_id, created_by)
        VALUES ($1,$2,$3,$4)
        RETURNING id, name, description, organization_Id, created_by, status, created_at`,
        [name, description||null , organizationId, userId]
    );

    return result.rows[0];
}

// get all projects in organization
const getProjects = async ({organizationId, userId}) => {

    // 1. verify membership
    await checkOrgMemberShip(organizationId,userId);

    // 2. fetch projects with creator name
    const result = await pool.query(
        `SELECT
           p.id,p.name,p.description, p.status,p.created_at,
           u.name AS created_by_name,
        COUNT(DISTINCT t.id) AS task_count
        FROM projects p
        JOIN users u ON u.id = p.created_by
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE p.organization_id = $1
        GROUP BY p.id, u.name `,
        [organizationId]
    )
    return result.rows;
}

// get single project by id
const getProjectById = async ({projectId, userId}) => {
    const result = await pool.query(
        `SELECT
            p.id,p.name,p.description,p.status,
            p.organization_id,p.created_at,
            u.name AS created_by_name
        FROM projects p
        JOIN users u ON u.id = p.created_by
        WHERE p.id = $1`,
        [projectId]
    );

    if(result.rows.length === 0){
        throw Object.assign(new Error('Project not found'), {statusCode: 404});
    }
    const project = result.rows[0];

    // check user is a member of the org this project belongs to
    await checkOrgMemberShip(project.organization_id, userId);
    
    return project;
}

// update project

const updateProject = async ({projectId, userId, name, description, status}) => {
    const project = await getProjectById(projectId, userId);

    const role = await checkOrgMemberShip(project.organization_id, userId)
    if(!['owner','admin','member'].includes(role)){
        throw Object.assign(new Error('Permission denied'), {statusCode: 403});
    
    }

    const result = await pool.query(
        `UPDATE projects
        SET
            name = COALESCE($1,name),
            description = COALESCE($2,description),
            status = COALESCE($3,status),
            updated_at = NOW()
        WHERE id=$4
        RETURNING *`,
        [name,description,status,projectId]
    )

    return result.rows[0];
}

module.exports = {createProject, getProjects, getProjectById, updateProject};