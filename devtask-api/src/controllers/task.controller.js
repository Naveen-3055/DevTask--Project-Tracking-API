const taskService = require('../services/task.service');
const commentService = require('../services/comment.service');
const activityService = require('../services/activity.service');

// TASKS
const createTask = async (req,res,next) => {
    try {
        const {title , description, assignedTo, priority, dueDate} = req.body;
        if(!title) return res.status(400).json({message: 'Titlte is required'});

        const task = await taskService.createTask({
            title, 
            description,
            projectId: req.params.projectId,
            organizationId: req.params.orgId,
            assignedTo,
            priority,
            dueDate,
            userId: req.user.userId,
        });
        return  res.status(201).json({ message: 'Task created', task });
    } catch (error) {
        next(error);
    }
}

const getTasks = async (req,res,next) => {
    try {
        const {status, priority, assignedTo, page, limit} = req.query;

        const result = await taskService.getTasks({
            projectId: req.params.projectId,
            organizationId: req.params.orgId,
            userId: req.user.userId,
            status,
            priority,
            assignedTo,
            page,
            limit,
        });

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const getTask = async (req,res,next) => {
    try {
        const task = await taskService.getTaskById({
            taskId: req.params.taskId,
            userId: req.user.userId,
        });
        res.status 
    } catch (error) {
        
    }
}

const updateTask = async (req,res,next) => {
    try {
        const {title, description, status, priority, assignedTo, dueDate} = req.body;

        const task = await taskService.updateTask({
            taskId: req.params.taskId,
            userId: req.user.userId,
            title,
            description,
            status,
            priority,
            assignedTo,
            dueDate,
        });

        res.status(200).json({message: 'Task updated', task});
    } catch (error) {
        next(error);
    }
}

const deleteTask = async (req,res,next) => {
    try {
        await taskService.deleteTask({
            taskId: req.params.taskId,
            userId: req.user.userId,
        });
        res.status(200).json({message: 'task deleted'});
    } catch (error) {
        next(error);
    }
}

//-------------------------------------------------------------------------------

// comments
const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const comment = await commentService.addComment({
      taskId: req.params.taskId,
      userId: req.user.userId,
      content,
    });
    res.status(201).json({ message: 'Comment added', comment });
  } catch (err) { next(err); }
};

const getComments = async (req, res, next) => {
  try {
    const comments = await commentService.getComments({
      taskId: req.params.taskId,
      userId: req.user.userId,
    });
    res.status(200).json({ comments });
  } catch (err) { next(err); }
};

const deleteComment = async (req, res, next) => {
  try {
    await commentService.deleteComment({
      commentId: req.params.commentId,
      userId: req.user.userId,
    });
    res.status(200).json({ message: 'Comment deleted' });
  } catch (err) { next(err); }
};


// Activity logs

const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await activityService.getActivityLogs({
      taskId: req.params.taskId,
      userId: req.user.userId,
    });
    res.status(200).json({ logs });
  } catch (err) { next(err); }
};


module.exports = {
    createTask, getTasks, getTask, updateTask, deleteTask,
    addComment, getComments, deleteComment,
    getActivityLogs
}