const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const authenticate = require(`../middlewares/authenticate`);

router.get('/me',authenticate,userController.getMe);

module.exports = router;