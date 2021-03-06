var Board = conn.model('Board');
var Shape = conn.model('Shape');

module.exports = function (app) {
  "use strict";
  app.get('/', function (req, res) {
    Board
      .find({})
      .sort("updated_at", -1)
      .run(function (err, boards) {
        if (err) {
          throw err;
        }
        res.render('boards/index', {
          title: 'List of boards',
          boards: boards
        });
      });
  });

  app.param('id', function (req, res, next, id) {
    Board.findById(id, function (err, board) {
      if (err) { return next(err); }
      if (!board) { return next(new Error('Failed to load board ' + id)); }
      req.board = board;
      next();
    });
  });

  // Show
  app.get('/board/:id', function (req, res) {
    fs.readdir('./public/shapes/', function (err, files) {
      if(err) throw err;
      res.render('boards/show', {
        title: req.board.name,
        board: req.board,
        svgs: files
      });
    });
  });

  // New
  app.get('/boards/new', function (req, res) {
    res.render('boards/new', {
      board: new Board({})
    });
  });

  // Create
  app.post('/boards', function (req, res) {
    var board = new Board(req.body.board);
    board.updated_at = new Date();
    board.save(function (err) {
      if (err) {
        mongooseErrorHandler(err, req);
        res.render('boards/new', {board: board});
      } else {
        req.flash('notice', 'Created successfully');
        res.redirect('/');
      }
    });
  });

  // Delete
  app.del('/board/:id', function(req, res){
    var board = req.board;
    board.remove(function (err) {
      req.flash('notice', 'Deleted successfully');
      res.redirect('/');
    });
  });

  // Edit board
  app.get('/board/:id/edit', function (req, res) {
    res.render('boards/edit', {
      title: 'Edit ' + req.board.name,
      board: req.board
    });
  });

  // Update board
  app.put('/board/:id', function(req, res) {
    var board = req.board;

    board.name = req.body.board.name;
    board.updated_at = new Date();

    board.save(function(err, doc) {
      if (err) {
        mongooseErrorHandler(err, req);
        res.render('boards/edit', {
          title: 'Edit board',
          board: board
        });
      } else {
        req.flash('notice', 'Updated successfully');
        res.redirect('/board/' + board._id);
      }
    });
  });
};

io.sockets.on('connection', function (socket) {
  "use strict";
  socket.broadcast.emit("status", {type: "locks"});
  socket.on('update', function (data) {
    console.log("From client: " + JSON.stringify(data));
    Board.findById(data.board, function (err, board) {
      if (err) {
        console.log(err);
        return;
      }
      var shape;
      if (data.type === "create") {
        console.log("create");
        shape = new Shape();
        shape.data = data.data;
        board.shapes.push(shape);
        data._id = shape._id;
        board.save();

        socket.emit("update", data);
        socket.broadcast.emit("update", data);
      } else if (data.type === "change") {
        shape = board.shapes.id(data._id);
        if (!shape) {
          return;
        }
        shape.data = data.data;
        board.save();
        //socket.emit("update",data);
        socket.broadcast.emit("update", data);
      } else if (data.type === "remove") {
        board.shapes.id(data._id).remove();
        board.save(function (err) {
          socket.emit("update", data);
          socket.broadcast.emit("update", data);
        });
      }
    });
  });

  // Real-time movement
  socket.on('move', function (data) {
    socket.broadcast.emit("move", data);
  });

  // Lock objects from being moved by more than 1 client
  socket.on('lock', function (data) {
    console.log("lock from client: " + JSON.stringify(data));
    socket.broadcast.emit("lock", data);
  });
});



