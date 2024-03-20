const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

// Topic: Logging in Users
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true, // IMPT
    // Topic: Testing for Secure HTTPS Connections
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  // Topic: Sending JWT via Cookie
  // NOTE A cookie is basically a small piece of text that a server can send to clients. When the client receive a cookie, it will automatically send it back along with all future requests to the same server.

  // if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // Remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// Topic: Creating New Users
exports.signup = catchAsync(async (req, res, next) => {
  // Topic: Signing up Users
  // IMPT security flaw
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  }); // or User.save

  // Topic: Email Templates with Pugs: Welcome Emails
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, req, res);
});

// Topic: Logging in Users
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password'); // NOTE + include, - exclude (from select: false in model)
  const correct = await user.correctPassword(password, user.password);

  if (!user || !correct) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, req, res);
});

// Topic: Logging out Users
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

// Topic: Protecting Tour Routes - Part 1
exports.protect = catchAsync(async (req, res, next) => {
  console.log(req);
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    // Topic: Logging in Users with Our API - Part 1
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401),
    );
  }

  // Topic: Protecting Tour Routes - Part 2
  // 2) Verification token
  // NOTE jwt.verify is an async fn and needs callback fn, so we need to wait it to verify by using promisify()
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // fn(return in promise) callFn
  // console.log(decoded); // { id: '65a931fdcb449d18a130c8fb', iat: 1705665592, exp: 1713441592 }

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }

  // 4) Check if user changed password after the JWT was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401),
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE 🐔
  req.user = currentUser; // pass data btw middleware
  res.locals.user = currentUser;
  next();
});

// Topic: Logging in Users with Our API - Part 2
// Topic: Logging out Users
// NOTE get rid of catchAsync ()
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Getting token and check if it's there
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the JWT was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// Topic: Authorization: User Roles and Permissions
// NOTE Authorization is verifying if a certain user has the rights to interact with a certain resource even if he is logged in.
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles ['admin', 'lead-guild']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };

// Topic: Password Reset Functionality: Reset Token
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Topic: Sending Emails with Nodemailer
  // 3) Send it to user's email

  // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });

    // Topic: Sending Password Reset Emails
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

// Topic: Password Reset Functionality: Setting New Password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // In userModel.js 💥

  // 4) Log the user in, send JWT
  createSendToken(user, 201, req, res);
});

// Topic: Updating the Current User: Password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection 🐔
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // IMPT User.findByIdAndUpdate will NOT work as intended! (validator, pre)

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});

/*
1. The user hitting forgot password from the client and provided an email address (In the backend: We take the email address and find them in our database to know who forgot their password.)


2. We create a reset token and send as a link to the user via email. This is because we assume that email is secure and unique to the user. We include the reset token because each reset token is unique, so that we are able to find out who actually forgot their password, and we can change the person's password to the new one.


3. When the user clicks the link and enter new password, validation occured and finally set a new password for the user. In the meantime, added a field to indicate at what time the user ever changed his password. This is used later when user try to access a protected route using the old token, we can block their access.
*/
