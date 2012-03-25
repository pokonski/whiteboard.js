flash_messages = function(req, res, next) {
  res.local("req", req);
  return next();
};