const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator'); // npm i validator

// Topic: Creating a Simple Tour Model
// Topic: Data Validation: Built-In Validators 🦊
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // 🦊
      required: [true, 'A tour must have the name'],
      unique: true,
      trim: true,
      // 🦊
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
      // 🐷 not useful in this case, use custom callback function instead
      // validate: [validator.isAlpha, 'Tour name must only contain characters'], // cannot have space
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    // Topic: Modelling the Tours
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      // 🦊
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      }, // user can pass only these words
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      // 🦊
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be above 5.0'],
      // Topic: Preventing Duplicate Reviews
      set: (val) => Math.round(val * 10) / 10, // 4.66666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    // Topic: Data Validation: Custom Validators 🐷
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only point to current doc on NEW document creation
          return val < this.price; // 100 < 200
        },
        message: 'Discount price ({VALUE}) should be below regular price', // val === {VALUE}
      },
    },
    summary: {
      type: String,
      trim: true, // only work for string (remove white space)
      require: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // hide
    },
    startDates: [Date], // Mongo parses timestamp into the date
    secretTour: {
      type: Boolean,
      default: false,
    },
    // Topic: Modelling Locations (Geospatial Data)
    startLocation: {
      // GeoJSON
      // NOTE embedded obj, not schema
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // Topic: Modelling Tour Guilds: Embedding 🍿
    // guides: Array,
    // Topic: Modelling Tour Guilds: Child Referencing
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// Topic: Improving Read Performance with Indexes
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 }); // asc dsc
tourSchema.index({ slug: 1 });

// Topic: Geospatial Queries: Finding Tours Within Radius
tourSchema.index({ startLocation: '2dsphere' });

// Topic: Virtual Properties
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Topic: Virtual Populate: Tours and Reviews
// (2) in tourController.js
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Topic: Document Middleware
// mongoose middleware can run before or after a certain event like saving document to the database.

// DOCUMENT MIDDLEWARE: run before .save() and .create()
tourSchema.pre('save', function (next) {
  // console.log(this); // access the document that being save
  this.slug = slugify(this.name, { lower: true });
  next(); // If it don't have next, loading will stuck
});
// NOTE

// tourSchema.pre('save', (next) => {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

// 🍿 embedding
// tourSchema.pre('save', async function (next) {
//   const guidesPromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

// Topic: Query Middleware
// tourSchema.pre('find', function (next) {
// IMPT execute all event that have find
tourSchema.pre(/^find/, function (next) {
  // Want secret tour (1 🍀)
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// Topic: Populating Tour Guides (from tourController.js)
tourSchema.pre(/^find/, function (next) {
  // this = current query
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  // console.log(docs);
  next();
});

// Topic: Aggregation Middleware
// BUG geoNear must be the first stage in the pipeline in Topic: Geospatial Aggregation: Calculating Distances
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

// Topic: Refactoring for MVC
module.exports = Tour;

// Topic: Creating Documents and Testing the Model
// Like class name ES6
// const testTour = new Tour({
//   name: 'The Park Camper',
//   price: 997,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR 💥:', err);
//   }); // NOTE return promise
