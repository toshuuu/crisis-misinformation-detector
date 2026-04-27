const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const userController = require('../controllers/userController');
const verificationController = require('../controllers/verificationController');

// User routes
router.post('/users/login', userController.login);
router.get('/users/profile/:deviceId', userController.getProfile);
router.get('/users/leaderboard', userController.getLeaderboard);

// Report routes
router.post('/reports', reportController.createReport);
router.get('/reports', reportController.getReports);
router.get('/reports/:id', reportController.getReportById);
router.delete('/reports/:id', reportController.deleteReport);

// Verification routes
router.post('/verifications', verificationController.verifyReport);

module.exports = router;
