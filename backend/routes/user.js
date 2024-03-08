const express = require('express');
const router = express.Router();
const userControllers = require('../controllers/user');

// Create 
router.post('/signup', userControllers.createUser);
// Read 
router.post('/login', userControllers.readUser);

module.exports = router;