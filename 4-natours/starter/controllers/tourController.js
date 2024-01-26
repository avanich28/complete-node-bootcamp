// const fs = require('fs');
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Topic: Refactoring Our Routes
// If api is changed, you can define v2, so it will not break when using v1.
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
// );

// Topic: Param middleware
// NOTE check in mongo instead
// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);

//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };

// Topic: Making the API Better: Aliasing
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // console.log(req.requestTime);

  // EXECUTE QUERY
  // 🐔 Each method work bcs we return 'this'
  // (2 🍀)
  const features = new APIFeatures(Tour.find(), req.query) // Tour ?
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;
  // query.sort().select().skip().limit()

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // console.log(req.params); // {id: 5}
  // const id = req.params.id * 1; // convert to number
  // const tour = tours.find((el) => el.id === id);

  const tour = await Tour.findById(req.params.id);
  // or Tour.findOne({_id: req.params.id})

  // Topic: Adding 404 Not Found Errors
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  // Topic: Another Way of Creating Documents
  // try {
  // const newTour = new Tour({});
  // newTour.save();

  // req.body = {}
  const newTour = await Tour.create(req.body); // IMPT return promise

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }

  // Include middleware
  // console.log(req.body);
  // const newId = tours[tours.length - 1].id + 1;
  // const newTour = { id: newId, ...req.body };
  // tours.push(newTour);
  // NOTE Cannot use sync bcs it is run in event loop
  // fs.writeFile(
  //   `${__dirname}/../dev-data/data/tours-simple.json`,
  //   JSON.stringify(tours),
  //   (err) => {
  //     // 201 means created
  //     res.status(201).json({
  //       status: 'success',
  //       data: {
  //         tour: newTour,
  //       },
  //     });
  //   },
  // );
  // res.send('Done');
});

exports.updateTour = catchAsync(async (req, res, next) => {
  // Topic: Updating Documents

  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true, // IMPT repeat in the Schema
  }); // NOTE return new doc

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  // 200 means updated
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  // Topic: Deleting Documents
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  // 204 means no content
  res.status(204).json({
    status: 'success',
    data: null, // show that the resource that was deleted is no longer exist
  });
});

// Topic: Aggregation Pipeline: Matching and Grouping
exports.getTourStats = catchAsync(async (req, res, next) => {
  // .find return query
  // .aggregate return obj
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        // 1 big group
        // _id: '$difficulty',
        // _id: '$ratingsAverage',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   // ne = not equal
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// Topic: Aggregation Pipeline: Unwinding and Projecting
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } }, // not show up
    { $sort: { numTourStarts: -1 } },
    { $limit: 6 },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
