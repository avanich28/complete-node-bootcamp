// Topic: A Better File Structure
const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

// Topic: Creating and Mounting Multiple Routers
const router = express.Router(); // middleware func

// Topic: Param middleware
// router.param('id', tourController.checkID);

// Topic: Making the API Better: Aliasing
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

// Topic: Aggregation Pipeline: Matching and Grouping
router.route('/tour-stats').get(tourController.getTourStats);

// Topic: Aggregation Pipeline: Unwinding and Projecting
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

// Topic: Chaining Multiple Middleware Functions
// Create a check body middleware
// Check if body contains the name and price property
// If not, send back 400 (bad request)
// Add it to the post handler stack

router
  .route('/')
  // Topic: Protecting Tour Routes - Part 1
  // NOTE Check user login
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);
// .post(tourController.checkBody, tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    // Topic: Authorization: User Roles and Permissions
    authController.protect,
    authController.restrictTo('admin', 'lead-guild'),
    tourController.deleteTour,
  );

module.exports = router;
