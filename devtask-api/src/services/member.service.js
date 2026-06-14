const pool = require('../config/db');

// 1. invite user to an organization..
const inviteMember = async ({organizationId, invitedEmail,role, requestingUserId}) => {
    // 1. check requesting user has permission 
    const requester = await pool.query(
        `SELECT role FROM organization_members 
        WHERE organization_id = $1 AND user_id = $2`,
        [organizationId,requestingUserId]
    );

    if(requester.rows.length === 0){
        throw Object.assign(new Error('you are not a member of this oraganization'), {statusCode:403});
    }
    const requestRole = requester.rows[0].role;
    if(!['owner','admin'].includes(requestRole)){
        throw Object.assign(new Error('Only owners and admin can inivte memebers'), {statusCode: 403});
    }

    // 2. find the user being invited by email
    const userResult = await pool.query(
        'SELECT id, name, email FROM users where email = $1',[invitedEmail]
    );

    if(userResult.rows.length === 0){
        throw Object.assign(new Error("no user found with that email"), {statusCode: 404});
    }

    const invitedUser = userResult.rows[0];

    // check if already a member
    const alreadyMember = await pool.query(
        `SELECT id FROM organization_members WHERE organization_id = $1 AND user_id=$2`,[organizationId, invitedUser.id]
    );

    if(alreadyMember.rows.length>0){
        throw Object.assign(new Error('user is already a memeber'), {statusCode: 409});
    }

    // Add member
    await pool.query(
        `INSERT INTO organization_members (organization_id, user_id, role)
        VALUES ($1,$2,$3)`,
        [organizationId,invitedUser.id, role || 'member']
    );

    return {user: invitedUser, role: role||'member'};
}

// update a member 

const updateMemberRole = async ({organizationId, targetUserId, newRole, requestingUserId}) => {

    // 1. Only owner can change roles
    const requester = await pool.query(
        `SELECT role FROM organization_members
        WHERE organization_id=$1 AND user_id = $2`,
        [organizationId, requestingUserId]
    )

    if(requester.rows.length ===0 || requester.rows[0].role !== 'owner'){
        throw Object.assign('only owner can change the member roles', {statusCode: 403});
    }

    // 2. cannnot change owner's own role
    if(targetUserId === requestingUserId){
        throw Object.assign(new Error("you cannot change your own role"),{statusCode: 400});
    }

    // 3. update role
    const result = await pool.query(
        `UPDATE organization_members SET role = $1
        WHERE organizationId=$2 AND user_id = $3
        RETURNING *`,
        [newRole, organizationId, targetUserId]
    );

    if(result.rows.length===0){
        throw Object.assign(new Error('memeber not found'), {statusCode: 404});
    }

    return result.rows[0];
}

// remove a member
const removeMember = async (organizationId, targetUserId,requestingUserId) => {
    // check permission
    const requester = await pool.query(
        `SELECT role FROM organization_members WHERE organization_id=$1 AND user_id = $2`, [organizationId, requestingUserId]
    );

    if(requester.rows.length === 0 || !['owner','admin'].includes(requester.rows[0].role)){
        throw Object.assign('only owner and admin can remove members', {statusCode: 403});
    }

    // 2. cannot remove the owner
    const target = await pool.query(
        `SELECT role FROM organization_members 
        WHERE organization_id=$1 AND user_id = $2`,
        [organizationId,targetUserId]
    );

    if(target.rows.length === 0){
         throw Object.assign(new Error('Member not found'), { statusCode: 404 });
    }
     if (target.rows[0].role === 'owner') {
    throw Object.assign(new Error('Cannot remove the organization owner'), { statusCode: 400 });
    }

  // 3. Delete
  await pool.query(
    `DELETE FROM organization_members
     WHERE organization_id = $1 AND user_id = $2`,
    [organizationId, targetUserId]
  );
}

module.exports = {
    inviteMember,
    updateMemberRole,
    removeMember
}