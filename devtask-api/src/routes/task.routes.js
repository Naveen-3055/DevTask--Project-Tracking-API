const express = require('express');

// mergeParams lets us access :orgId and :projectId
const router = express.Router({mergeParams: true}); 

const authenticate = require('../middlewares/authenticate');
const taskController = require('../controllers/task.controller');

router.use(authenticate);

// task routes
router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:taskId', taskController.getTask);
router.patch('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

// comment routes
router.post('/:taskId/comments', taskController.addComment);
router.get('/:taskId/comments', taskController.getComments);
router.delete('/:taskId/comments/:commentId', taskController.deleteComment);

// activity logs
router.get('/:taskId/activity', taskController.getActivityLogs);


module.exports = router;