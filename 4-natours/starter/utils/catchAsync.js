// Topic: Catching Errors in Async Functions
module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next); // (err) => next(err)
};
