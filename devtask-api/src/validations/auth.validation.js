
const Joi = require('joi');
const joi = require('joi');

const registerSchema = joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        'string.min': 'Name must be atleast 2 characters',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required',
    }),
    email : Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email',
        'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).max(100).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required',
    }),
})

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
})

module.exports = {registerSchema, loginSchema}