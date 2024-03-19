const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

// Topic: Factory Functions: Update and Create
exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// Topic: Factory Functions: Reading
exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
// Topic: Factory Functions: Update and Create
exports.updateReview = factory.updateOne(Review);
// Topic: Building Handler Factory Functions: Delete
exports.deleteReview = factory.deleteOne(Review);

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   // Topic: Adding a Nested GET Endpoint
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });

// exports.createReview = catchAsync(async (req, res, next) => {
//   // Topic: Implementing Simple Nested Routes
//   // Allow nested routes
//   if (!req.body.tour) req.body.tour = req.params.tourId;
//   if (!req.body.user) req.body.user = req.user.id;

//   const newReview = await Review.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: newReview,
//     },
//   });
// });

// exports.updateReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!review) return next(new AppError('No Review found with that ID', 404));

//   res.status(200).json({
//     status: 'success',
//     data: {
//       review,
//     },
//   });
// });

// exports.deleteReview = catchAsync(async (req, res, next) => {
//   const review = await Review.findByIdAndDelete(req.params.id);

//   if (!review) return next(new AppError('No Review found with that ID', 404));

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });
