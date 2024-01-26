const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

// Topic: Creating New Users
router.post('/signup', authController.signup);
// Topic: Logging in Users
router.post('/login', authController.login);

// Topic: Password Reset Functionality: Reset Token
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Topic: Updating the Current User: Password
router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword,
);

// Topic: Updating the Current User: Data
router.patch('/updateMe', authController.protect, userController.updateMe);

// Topic: Deleting the Current User
router.delete('/deleteMe', authController.protect, userController.deleteMe);

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
