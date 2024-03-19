const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

// Topic: Nested Routes with Express
// (1) tourRoutes.js
// allow to access other route /:tourId/reviews
const router = express.Router({ mergeParams: true });

// Topic: Adding Missing Authentication and Authorization
router.use(authController.protect);

router.route('/').get(reviewController.getAllReviews).post(
  authController.restrictTo('user'),
  // Topic: Factory Functions: Update and Create
  reviewController.setTourUserIds,
  reviewController.createReview,
);

// Topic: Building Handler Factory Functions: Delete
// Topic: Factory Functions: Update and Create
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  );

module.exports = router;
