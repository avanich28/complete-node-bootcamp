// Topic: Setting up Express and Basic Routing
const express = require('express');
const morgan = require('morgan'); // npm i morgan
const rateLimit = require('express-rate-limit'); // npm i express-rate-limit
const helmet = require('helmet'); // npm i helmet
const mongoSanitize = require('express-mongo-sanitize'); // npm i express-mongo-sanitize
const xss = require('xss-clean'); // npm i xss-clean
const hpp = require('hpp'); // npm i hpp

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARE
// Topic: Setting Security HTTP Headers
// NOTE Must put at the beginning
// Set security HTTP headers
app.use(helmet());

// Topic: Environment Variables
// Development logging
if (process.env.NODE_ENV === 'development') {
  // Topic: Using 3rd-Party Middleware
  app.use(morgan('dev'));
}

// Topic: Implementing Rate Limiting
// NOTE Prevent attacker try to guess the password (Brute force)
// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 100 request per hour
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
// Without `express.json()`, `req.body` is undefined.
app.use(express.json({ limit: '10kb' })); // for want to use middleware (middle the request and response), return func

// Topic: Data Sanitization
// NOTE Data sanitization means to clean all the data that comes into the application from malicious code. So, code that is trying to attack to our application.

// Data sanitization against NoSQL query injection
app.use(mongoSanitize()); // login {"email": {"$gt": ""}}

// Data sanitization against XSS (prevent putting html syntax)
app.use(xss()); // sign up {"name": "<div id='bad-code'>Name</div>",}

// Topic: Preventing Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ], // allow duplicate string
  }),
);

// Topic: Serving Static Files
// Serving static files ex. overview.html
app.use(express.static(`${__dirname}/public`));

// Topic: Creating Our Own Middleware
// next = next function
// apply to every single request
// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👋');
//   next(); // IMPT
// });

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.requestTime);
  // console.log(x); // NOTE For testing 'uncaughtException' error

  // Topic: Protecting Tour Routes - Part 1
  // console.log(req.headers);
  next();
});

// http method for the req
// app.get('/', (req, res) => {
//   // res.status(200).send('Hello from the server side!');
//   res
//     .status(200)
//     .json({ message: 'Hello from the server side!', app: 'Natours' });
// });

// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint');
// });

// 2) ROUTE HANDLERS
// Move to Controller folder

// Topic: Starting Our API: Handling GET Requests
// Topic: Handling POST Requests
// Topic: Handling PATCH Requests
// Topic: Handling DELETE Requests
// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// 3) ROUTES
// Topic: Creating and Mounting Multiple Routers
// Move to routes file!

// IMPT Not be called bcs the middleware cycle is already end (already execute res.).
// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👋');
//   next();
// });
// NOTE middleware will be called if we put after app.use

// 🔥 real middleware, url root or parent route
// create sub application
// mounting router needs to put after declare variable
app.use('/api/v1/tours', tourRouter); // middleware func
app.use('/api/v1/users', userRouter);

// Topic: Handling Unhandled Routes
// NOTE If the url (/api/v1/tours|users) is incorrect, this middleware will be executed.
// .all handles all http and * for all url
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  // 🎈
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // next(err);
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // If next receives the argument, express will automatically know that it was an error.
});

// Topic: Implementing a Global Error Handling Middleware 🎈
app.use(globalErrorHandler);

// 4) START SERVER
// Move to server.js
module.exports = app;
