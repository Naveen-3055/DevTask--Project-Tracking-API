const express = require('express');

// mergeParams lets us access :orgId and :projectId
const router = express.Router({mergeParams: true}); 

const authenticate = require('../middlewares/authenticate');
const taskController = require('../controllers/task.controller');
const validate = require('../middlewares/validate');
const {apiRateLimit} = require('../middlewares/rateLimiter');
const {createTaskSchema, updateTaskSchema, addCommentSchema} = require('../validations/task.validation');

router.use(authenticate);

// task routes
router.post('/', validate(createTaskSchema), taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:taskId', taskController.getTask);
router.patch('/:taskId', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

// comment routes
router.post('/:taskId/comments', validate(addCommentSchema), taskController.addComment);
router.get('/:taskId/comments', taskController.getComments);
router.delete('/:taskId/comments/:commentId', taskController.deleteComment);

// activity logs
router.get('/:taskId/activity', taskController.getActivityLogs);


module.exports = router;