mongooseErrorHandler = function (err, req) {
  "use strict";
  var error, errors;
  errors = err.errors;
  for (error in errors) {
    if (errors.hasOwnProperty(error)) {
      req.flash('error', errors[error].path + " " + errors[error].type);
    }
  }
};
