const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// Topic: Configuring Multer
// https://github.com/expressjs/multer
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // NOTE error, actual destination
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-76767cdsc7676afsd-876875875.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// Topic: Resizing Images
const multerStorage = multer.memoryStorage();

// Test that upload file is an img
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

// const upload = multer({ dest: 'public/img/users' });
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

// Topic: Resizing Images
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Topic: Factory Functions: Reading
exports.getAllUsers = factory.getAll(User);

// Topic: Logging in Users
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });

// Topic: Adding a/me Endpoint
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// Topic: Updating the Current User: Data
exports.updateMe = catchAsync(async (req, res, next) => {
  // Topic: Image Uploads Using Multer: Users
  // console.log(req.file);
  // console.log(req.body);
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  // Huge mistake! -> body.role: 'admin'
  const filteredBody = filterObj(req.body, 'name', 'email');

  // Topic: Saving Image Name to Database
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // iseNew ?
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// Topic: Deleting the Current User
exports.deleteMe = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({});
});

// Topic: Factory Functions: Reading
exports.getUser = factory.getOne(User);
// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined.',
//   });
// };

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead',
  });
};

// Topic: Factory Functions: Update and Create
// NOTE Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined.',
//   });
// };

// Topic: Building Handler Factory Functions: Delete
exports.deleteUser = factory.deleteOne(User);
// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined.',
//   });
// };
