const express = require('express');
const AppController = require('../controllers/AppController');
const UserController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const FilesControlle = require('../controllers/FilesController');

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

/* FilesControlle */
router.post('/files', FilesControlle.postUpload);
router.get('/files/:id', FilesControlle.getShow);
router.get('/files', FilesControlle.getIndex);
router.put('/files/:id/publish', FilesControlle.putPublish);
router.put('/files/:id/unpublish', FilesControlle.putUnpublish);
router.get('/files/:id/data', FilesControlle.getFile);

module.exports = router;
