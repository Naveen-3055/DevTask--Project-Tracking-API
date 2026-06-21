const pool = require('../config/db');
const slugify = require('../utils/slugify');


// create organization
const createOrganization = async ({name,userId}) => {
    // 1. generate slug from name
    let slug = slugify(name);

    // 2. check if slug already exists in DB.
    const existingOrg = await pool.query('SELECT id FROM organizations WHERE slug = $1', [slug]);

    // if slug exists, append random string to make it unique.
    if(existingOrg.rows.length > 0){
        slug = `${slug}-${Math.random().toString(36).substring(2,6)};`
    }

    // 3. start a transaction - both inserts must succeed or fail together
    const client = await pool.connect(); 

    try{
        await client.query('BEGIN'); // start transaction

        // 4. insert organization
        const orgResult = await client.query(
            `INSERT INTO organizations (name,slug,owner_id) VALUES ($1,$2,$3)
            RETURNING id,name,slug,owner_id,created_at`,
            [name,slug,userId]
        );

        const org = orgResult.rows[0];

        // 5. add creator as a owner in organization_members.

        await client.query(
            `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1,$2,'owner')`,
            [org.id,userId]
        );

        await client.query('COMMIT');
    }catch(error){
        await client.query('ROLLBACK');
        throw error;
    }finally{
       client.release(); // release the client back to the pool
    }

}


// get all organizations for a user

const getUserOrganizations = async (userId) => {
    const result = await pool.query(
        `SELECT o.id, o.name, o.slug, o.owner_id, o.created_at, om.role,       COUNT(om2.user_id) AS member_count
        FROM organizations o
        JOIN organization_members om
        ON om.organization_id = o.id AND om.user_id = $1
        JOIN organization_members om2 
        ON om2.organization_id = o.id
        GROUP BY o.id,o.name,o.slug,o.owner_id,o.created_at,om.role
        ORDER BY o.created_at DESC`,
        [userId]
    );

    return result.rows;
}

// get single organization by slug.

const getOrganizationBySlug = async ({slug,userId}) => {
    // 1. get org details
    const orgResult = await pool.query(
        `SELECT
            o.id, o.name, o.slug, o.owner_id, o.created_at,
            om.role AS your_role
        FROM organizations o
        JOIN organization_members om
            ON om.organization_id = o.id AND om.user_id = $2
        WHERE o.slug = $1`,
        [slug,userId]
    )

    if(orgResult.rows.length ===0){
        throw Object.assign(new Error('Organization not found'), {statusCode: 404});
    }

    const org = orgResult.rows[0];

    // get all members of this org
    const memberResult = await pool.query(
        `SELECT 
            u.id,u.name,u.email,
            om.role,om.joined_at
        FROM organization_members om
        JOIN users u ON u.id = om.user_id
        WHERE om.organization_id = $1
        ORDER BY om.joined_at ASC`,
        [org.id]

    );

    return {...org, members_of_this_org: memberResult.rows};
}

module.exports = {
    createOrganization,
    getUserOrganizations,
    getOrganizationBySlug
}