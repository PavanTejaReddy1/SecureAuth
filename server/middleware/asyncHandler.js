// Wraps an async route handler so any thrown error is passed to Express's
// error handler instead of crashing the Node process.
// Usage: router.post('/route', asyncHandler(myController))
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
