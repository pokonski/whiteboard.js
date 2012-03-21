var app, config, config_file, controller_files,
    controllers_path, exports, express, routes, fs;

fs = require('fs')
express = require('express');

config_file = require('yaml-config');

//exports = module.exports = config = config_file.readConfig('config/config.yml');

// Connect with database
require('./db');

app = express.createServer();

app.configure(function() {
  app.set('views', __dirname + '/app/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: 'kljg985lgkmsrig8%^&5w5egm304gmrigq30jgq03qg@#$@#%#$%'
  }));

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
var models_path = __dirname + '/app/models'
var model_files = fs.readdirSync(models_path)
model_files.forEach(function(file){
  require(models_path+'/'+file)
})

// Controllers
controllers_path = __dirname + '/app/controllers';
controller_files = fs.readdirSync(controllers_path);

controller_files.forEach(function(file) {
return require(controllers_path + '/' + file)(app);
});

app.listen(3000);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);