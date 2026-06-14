const projectService = require('../services/project.service')

const createProject = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const {orgId} = req.params;
        const userId = req.user.userId;
         if (!name) return res.status(400).json({ message: 'Project name is required' });
console.log(orgId, userId)
        const project = await projectService.createProject({
         name,
         description,
         organizationId: orgId,
         userId: userId,
       });
      res.status(201).json({ message: 'Project created', project });
   } catch (err) { next(err); }
}

const getProjects = async (req,res,next) => {
    try {
        const projects = await projectService.getProjects({
            organizationId: req.params.orgId,
            userId: req.user.userId
        });
        res.status(200).json({projects});
    } catch (error) {
        next(error);
    }
}

const getProject = async (req,res,next) => {
    try{
        const project = await projectService.getProjectById({
            projectId: req.params.projectId,
            userId: req.user.userId,
        });
        res.status(200).json({project});
    }catch(err){
        next(err);
    }
};

const updateProject = async (req,res,next) => {
    try {
        const {name, description, status} = req.body;
        const project = await projectService.updateProject({
            projectId: req.params.projectId,
            userId: req.user.userId,
            name,
            description,
            status,
        });
        res.status(200).json({message: "project updated ", project});
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createProject, getProject, updateProject, getProjects
}