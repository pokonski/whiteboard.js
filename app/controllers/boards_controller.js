var Board = conn.model('Board');

module.exports = function(app) {
  app.get('/', function(req, res) {
    //var board = new Board();
    //board.name = "testowa"+Date();
    //board.save();
    Board
      .find({})
      .run(function(err, boards) {
        if (err) throw err
        res.render('boards/index', {
          title: 'List of boards',
          boards: boards
        });
      });
  });

  app.param('id', function(req, res, next, id){
    Board
      .findById(id,function(err,board) {
      if (err) return next(err)
      if (!board) return next(new Error('Failed to load board ' + id))
      req.board = board
      next();
    });
  });

  // Show
  app.get('/board/:id', function(req, res) {
    res.render('boards/show',{
      title: req.board.name,
      board: req.board
    });
  });

  // New form
  app.get('/boards/new', function(req, res){
    res.render('boards/new', {
      title: 'New board',
      board: new Board({})
    })
  });

  // Create board
  app.post('/boards', function(req, res){
      var board = new Board(req.body.board)

      board.save(function(err){
          if (err) {
              utils.mongooseErrorHandler(err, req)
              res.render('boards/new', {board: board});
          }
          else {
              req.flash('notice', 'Created successfully')
              res.redirect('/')
          }
      })
  });
};

