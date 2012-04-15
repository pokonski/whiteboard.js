mongooseErrorHandler = function (err, req) {
  var errors = err.errors;
  for (var error in errors) {
    req.flash('error', errors[error].path + " " + errors[error].type);
  }
};