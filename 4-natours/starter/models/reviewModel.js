const mongoose = require('mongoose');
const Tour = require('./tourModel');

// Topic: Modelling Reviews: Parent Referencing
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// Topic: Preventing Duplicate Reviews
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Topic: Populating Reviews
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// Topic: Calculating Average Rating on Tours - Part 1
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  console.log(tourId);
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);

  // Topic: Calculating Average Rating on Tours - Part 2
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // this points to current review
  // Review.calcAverageRatings(this.tour);
  // NOTE constructor = model that creates this doc
  this.constructor.calcAverageRatings(this.tour);
});

// Topic: Calculating Average Rating on Tours - Part 2
// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.clone().findOne();
  console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // IMPT await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

// POST /tour/234fadc/reviews
// GET /tour/234ad4/reviews
// GET /tour/234ad4/reviews/94884da
