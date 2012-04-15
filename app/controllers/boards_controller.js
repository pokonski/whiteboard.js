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

  // New
  app.get('/boards/new', function(req, res){
    res.render('boards/new', {
      title: 'New board',
      board: new Board({})
    })
  });

  // Create
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
    });
  });

  // Delete
  app.del('/board/:id', function(req, res){
    var board = req.board
    board.remove(function(err){
      req.flash('notice', 'Deleted successfully');
      res.redirect('/');
    });
  });

  // Edit board
  app.get('/board/:id/edit', function(req, res){
    res.render('boards/edit', {
      title: 'Edit '+req.board.name,
      board: req.board
    });
  });

  // Update board
  app.put('/board/:id', function(req, res){
    var board = req.board

    board.name = req.body.board.name

    board.save(function(err, doc) {
      if (err) {
        utils.mongooseErrorHandler(err, req)
        res.render('boards/edit', {
          title: 'Edit board'
          , board: board
        })
      }
      else {
        req.flash('notice', 'Updated successfully')
        res.redirect('/board/'+board._id)
      }
    })
  })
};

