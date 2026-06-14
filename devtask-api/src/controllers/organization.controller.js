
const orgService = require('../services/organization.service');
const memberService = require('../services/member.service');


const createOrganization = async (req, res, next) => {
    try {
        const {name} = req.body;
        if(!name) return res.status(400).json({Message: 'Organization is required.'});

        const org = await orgService.createOrganization({name, userId: req.user.userId});
        res.status(201).json({message: 'Organization created', organization: org});
    } catch (error) {
        next(error);
    }
}

const getMyorganizations = async (req,res,next) => {
    try {
        const orgs = await orgService.getUserOrganizations(req.user.userId);
        res.status(200).json({ organizations: orgs });
    } catch (error) {
        next(error);
    }
}

const getOrganization = async (req,res,next) => {
    try {
        const org = await orgService.getOrganizationBySlug({
            slug: req.params.slug,
            userId: req.user.userId,
        })
        res.status(200).json({organization: org});
    } catch (error) {
        next(error);
    }
}

//----------------------------------------------------------------------------

const inviteMember = async (req,res,next) => {
    try {
        const {email,role} = req.body;
        if(!email){
            return res.status(400).json({message: "Email is required...."})
        }

        const result = await memberService.inviteMember({
            organizationId: req.params.orgId,
            invitedEmail : email,
            role,
            requestingUserId: req.user.userId,
        });
        res.status(200).json({message: 'Member invited succesfully..'})
    } catch (error) {
        next(error);
    }
}

const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: 'Role is required' });

    const result = await memberService.updateMemberRole({
      organizationId: req.params.orgId,
      targetUserId: req.params.userId,
      newRole: role,
      requestingUserId: req.user.userId,
    });
    res.status(200).json({ message: 'Role updated', member: result });
  } catch (err) { next(err); }
};

const removeMember = async (req, res, next) => {
  try {
    await memberService.removeMember({
      organizationId: req.params.orgId,
      targetUserId: req.params.userId,
      requestingUserId: req.user.userId,
    });
    res.status(200).json({ message: 'Member removed successfully' });
  } catch (err) { next(err); }
};

module.exports={
    createOrganization,
    getMyorganizations,
    getOrganization,
    inviteMember,
    updateMemberRole,
    removeMember
};