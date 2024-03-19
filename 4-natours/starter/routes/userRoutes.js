const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

// Topic: Creating New Users
router.post('/signup', authController.signup);
// Topic: Logging in Users
router.post('/login', authController.login);
// Topic: Logging out Users
router.get('/logout', authController.logout);

// Topic: Password Reset Functionality: Reset Token
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Topic: Adding Missing Authentication and Authorization
// NOTE Protect all routes after this middleware
router.use(authController.protect);

// Topic: Updating the Current User: Password
router.patch('/updateMyPassword', authController.updatePassword);

// Topic: Adding a/me Endpoint
router.get('/me', userController.getMe, userController.getUser);

// Topic: Updating the Current User: Data
router.patch(
  '/updateMe',
  // Topic: Image Uploads Using Multer: Users
  userController.uploadUserPhoto,
  // Topic: Resizing Images
  userController.resizeUserPhoto,
  userController.updateMe,
);

// Topic: Deleting the Current User
router.delete('/deleteMe', userController.deleteMe);

// Topic: Adding Missing Authentication and Authorization
router.use(authController.restrictTo('admin'));

// Topic: Implementing the "Users" Routes
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
