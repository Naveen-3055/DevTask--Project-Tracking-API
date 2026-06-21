const express = require('express');

const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const orgController = require('../controllers/organization.controller');
const projectController = require('../controllers/project.controller')
const taskRoutes = require('./task.routes');


// All routes require auth
router.use(authenticate);

// organization routes
router.post('/',orgController.createOrganization);
router.get('/', orgController.getMyorganizations);
router.get('/:slug', orgController.getOrganization);


// member routes (under org)
router.post('/:orgId/members', orgController.inviteMember)
router.patch('/:orgId/memebers/:userId', orgController.updateMemberRole);
router.delete('/:orgId/members/:userId', orgController.removeMember);

// Project routes (nested under org)
router.post('/:orgId/projects', projectController.createProject);
router.get('/:orgId/projects', projectController.getProjects);
router.get('/:orgId/projects/:projectId',projectController.getProject);
router.patch('/:orgId/projects/:projectId', projectController.updateProject);

// Task routes (nested under project)
router.use('/:orgId/projects/:projectId/tasks', taskRoutes);

module.exports = router; 
