var app, config, config_file, controller_files,
  controllers_path, exports, express, routes, flash_messages;

fs = require('fs');
express = require('express');
require('./lib/utils');

config_file = require('yaml-config');


// Connect with database
mongoose = require('mongoose');
conn = mongoose.createConnection("mongodb://localhost/whiteboard_development");
Schema = mongoose.Schema;

// Flash messages middleware
flash_messages = function (req, res, next) {
  "use strict";
  res.local("req", req);
  return next();
};

app = express.createServer();

// WebSockets
io = require('socket.io').listen(app);



app.configure(function() {
  "use strict";
  app.set('views', __dirname + '/app/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: 'kljg985lgkmsrig8%^&5w5egm304gmrigq30jgq03qg@#$@#%#$%'
  }));
  app.use(flash_messages);
  app.use(require('stylus').middleware({
    src: __dirname + '/public'
  }));
  app.use(app.router);

  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  return app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

app.configure('production', function() {
  return app.use(express.errorHandler());
});

// Models
var models_path = __dirname + '/app/models';
var model_files = fs.readdirSync(models_path);

model_files.forEach(function (file) {
  "use strict";
  require(models_path + '/' + file);
});

// Controllers
controllers_path = __dirname + '/app/controllers';
controller_files = fs.readdirSync(controllers_path);

controller_files.forEach(function (file) {
  "use strict";
  return require(controllers_path + '/' + file)(app);
});

app.listen(3000);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);