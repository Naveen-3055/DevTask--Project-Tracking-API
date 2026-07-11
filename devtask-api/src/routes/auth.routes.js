
const express = require('express');
const router = express.Router();


const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const {authRateLimit} = require('../middlewares/rateLimiter');
const {registerSchema, loginSchema} = require('../validations/auth.validation');


router.post('/register',authRateLimit, validate(registerSchema) ,authController.register);
router.post('/login', authRateLimit, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;