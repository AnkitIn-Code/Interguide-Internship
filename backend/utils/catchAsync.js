/**
 * catchAsync - Wraps an async Express route handler and forwards errors to next()
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
