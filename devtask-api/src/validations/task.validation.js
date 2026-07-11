const Joi = require('joi');

const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).required().messages({
    'any.required': 'Title is required',
    'string.max': 'Title cannot exceed 255 characters',
  }),
  description: Joi.string().max(5000).optional().allow(''),
  assignedTo: Joi.string().uuid().optional().allow(null),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  dueDate: Joi.date().iso().optional().allow(null),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(5000).optional().allow(''),
  status: Joi.string().valid('todo', 'in_progress', 'in_review', 'done').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  assignedTo: Joi.string().uuid().optional().allow(null),
  dueDate: Joi.date().iso().optional().allow(null),
});

const addCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required().messages({
    'any.required': 'Comment content is required',
    'string.min': 'Comment cannot be empty',
  }),
});

module.exports = { createTaskSchema, updateTaskSchema, addCommentSchema };