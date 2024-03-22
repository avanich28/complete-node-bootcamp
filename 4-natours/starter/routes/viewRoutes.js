const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

// Topic: Setting up the Project Structure
const router = express.Router();

// Topic: Finishing Payments with Stripe Webhooks
router.use(viewsController.alerts);

// Topic: Logging in Users with Our API - Part 2
// router.use(authController.isLoggedIn);

// Topic: Setting up Pug in Express
// Topic: Logging in Users with Our API - Part 1 (from authController.js)
router.get('/', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

// Topic: Building the Login Screen
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

// Topic: Building the User Account Page
router.get('/me', authController.protect, viewsController.getAccount);

// Topic: Rendering a User's Booked Tours
router.get(
  '/my-tours',
  // Topic: Creating New Bookings on Checkout Success
  // bookingController.createBookingCheckout,
  authController.protect,
  viewsController.getMyTours,
);

// Topic: Updating User Data
router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData,
);

// Topic: Extending Our Base Template with Blocks
// router.get('/', (req, res) => {
//   res.status(200).render('base', {
//     title: 'The Forest Hiker',
//     user: 'Jonas',
//   });
// });

module.exports = router;
