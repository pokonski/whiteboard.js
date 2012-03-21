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

  app.get('/boards/:id', function(req, res) {
    res.render('boards/show',{
      title: req.board.name,
      board: req.board
    });
  });
};

