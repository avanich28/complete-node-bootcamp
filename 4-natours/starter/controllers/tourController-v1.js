// const fs = require('fs');
const Tour = require('../models/tourModel');

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

exports.getAllTours = async (req, res) => {
  // console.log(req.requestTime);
  try {
    // Topic: Making the API Better: Filtering 🌻
    console.log(req.query); // NOTE no $

    // BUILD QUERY
    // 1A) Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Topic: Making the API Better: Advanced Filtering
    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    console.log(JSON.parse(queryStr));

    // { difficulty: 'easy', duration: { $gte: 5} }
    // { difficulty: 'easy', duration: { gte: 5} } // NOTE no $

    // Topic: Reading Document
    let query = Tour.find(JSON.parse(queryStr)); // 🌻 NOTE use mongo method

    // Topic: Making the API Better: Sorting
    // 2) Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
      // sort('price ratingAverage')
    } else {
      // BUG '-_createdAt'
      query = query.sort('-_id'); // - means desc
    }

    // Topic: Making the API Better: Limiting Fields
    // 3) Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields); // projecting
    } else {
      query = query.select('-__v'); // - means excluding
    }

    // Topic: Making the API Better: Pagination
    // 4) Pagination
    const page = req.query.page * 1 || 1; // convert to number
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // page=2&limit=10, 1-10, page 1, 11-20, page 2, 21-30 page 3
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      if (skip >= numTours) throw new Error('This page does not exist');
    }

    // EXECUTE QUERY
    const tours = await query;
    // query.sort().select().skip().limit()

    // const tours = await Tour.find({
    //   duration: 5,
    //   difficulty: 'easy',
    // });

    // const tours = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  // console.log(req.params); // {id: 5}
  // const id = req.params.id * 1; // convert to number
  // const tour = tours.find((el) => el.id === id);
  try {
    const tour = await Tour.findById(req.params.id);
    // or Tour.findOne({_id: req.params.id})

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.createTour = async (req, res) => {
  // Topic: Another Way of Creating Documents
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }

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
};

exports.updateTour = async (req, res) => {
  // Topic: Updating Documents
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // In the Schema
    }); // NOTE return new document

    // 200 means updated
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  // Topic: Deleting Documents
  try {
    await Tour.findByIdAndDelete(req.params.id);

    // 204 means no content
    res.status(204).json({
      status: 'success',
      data: null, // show that the resource that was deleted is no longer exist
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
