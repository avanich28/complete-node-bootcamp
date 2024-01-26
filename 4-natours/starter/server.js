const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Topic: Catching Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
// console.log(x);

// Topic: Environment Variables
dotenv.config({ path: './config.env' });
const app = require('./app');

// Topic: Connecting Our Database with the Express App
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB).then(() => {
  // console.log(con.connections);
  console.log('DB connection successful!');
});

// console.log(app.get('env')); // development
// console.log(process.env); // ENV VAR

// NOTE starting file
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Topic: Errors Outside Express: Unhandled Rejections
// NOTE ex reject unhandled promise (async)
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION: 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    // NOTE Close server > Shut down application
    process.exit(1); // ending program
  });
});
