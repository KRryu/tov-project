const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth');

// Controllers
const journeyController = require('../../controllers/bridge/journeyController');
const buddyController = require('../../controllers/bridge/buddyController');
const eventController = require('../../controllers/bridge/eventController');

// Journey Routes
router.get('/journey', protect, journeyController.getUserJourney);
router.post('/journey/program/start', protect, journeyController.startProgram);
router.post('/journey/program/complete', protect, journeyController.completeProgram);
router.put('/journey/program/progress', protect, journeyController.updateProgramProgress);
router.get('/journey/leaderboard', journeyController.getLeaderboard);

// Buddy Routes
router.get('/buddy/recommendations', protect, buddyController.getMatchRecommendations);
router.post('/buddy/request', protect, buddyController.requestMatch);
router.post('/buddy/respond', protect, buddyController.respondToMatch);
router.post('/buddy/activity', protect, buddyController.addActivity);
router.get('/buddy/matches', protect, buddyController.getMyMatches);

// Event Routes
router.get('/events', eventController.getEvents);
router.get('/events/my', protect, eventController.getMyEvents);
router.get('/events/recommended', protect, eventController.getRecommendedEvents);
router.get('/events/:id', eventController.getEvent);
router.post('/events', protect, eventController.createEvent);
router.post('/events/:id/register', protect, eventController.registerForEvent);
router.post('/events/:id/cancel', protect, eventController.cancelRegistration);
router.put('/events/:id', protect, eventController.updateEvent);
router.delete('/events/:id', protect, eventController.cancelEvent);

module.exports = router;