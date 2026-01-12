const express = require('express');
const AppController = require('../controllers/AppController');
const UserController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

/* AppController */
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

/* UsersController */
router.post('/users', UserController.postNew);
router.get('/users/me', UserController.getMe);

/* AuthController */
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);

module.exports = router;
