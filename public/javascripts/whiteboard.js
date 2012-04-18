var paper, move, startMove,stopMove, channelName, createShape, createCircle, createRect, shapes, loadShapes, removeShape;

loadShapes = function(shapes){
  for (var shape in shapes){
    shape = shapes[shape];
    createShape(paper,shape);
  }
};

removeShape = function(){
  socket.emit('update', {type: 'remove', board: channelName, _id: this.data("_id"), shape_id: this.id});
};

createShape = function (paper, record){
  var shape;
  console.log(record);
  if (record.data.type == "circle"){
    shape = createCircle(paper, record.data);
  } else if (record.data.type == "rect"){
    shape = createRect(paper, record.data);
  }
  shape.data("_id", record._id);
  shape.attr("fill", "#5289DD");
  shape.attr("stroke", "#332F29");
  shape.transform(record.data.transform);
  shape.drag(move,startMove,stopMove).attr({cursor: "move"});
  shape.dblclick(removeShape);
  shapes.push(shape);
};

createCircle = function(paper, data){
  return paper.circle(data.cx,data.cy,data.r);
};

createRect = function(paper, data){
  return paper.rect(data.x,data.y,data.width, data.height);
};

shapes = [];
// WebSockets
channelName = $('#whiteboard').data('id');

var socket = io.connect('http://okonski.dyndns.org:3000');

socket.on('move', function (data) {
  var shape = paper.getById(data.shape_id);
  var att = data.type == "rect" ? {x: data.x, y: data.y} : {cx: data.cx, cy: data.cy};

  if (shape)
    shape.attr(att);
});

socket.on('update', function (data) {
  if (data.board !== channelName)
    return;
  if (data.type === "change"){
    var shape = paper.getById(data.shape_id);
    if (shape)
      shape.animate(data.data,100);
  } else if (data.type === "create") {
    createShape(paper, data);
  } else if (data.type === "remove") {
    paper.getById(data.shape_id).remove();
  }
});


paper = Raphael("whiteboard", 938, 600);

var hover = function(){
  this.animate({fill: "#22ff33"},200);
};
var ox = 0;
var oy = 0;

move = function (dx, dy) {
  var att;
  this.attr({
    transform: "...T" + (dx - ox) + "," + (dy - oy)
  });
  //socket.emit('move', $.extend({board: channelName, type: this.type, shape_id: this.id},att));

  ox = dx;
  oy = dy;
};

startMove = function () {
  this.ox = this.type == "rect" ? this.attr("x") : this.attr("cx");
  this.oy = this.type == "rect" ? this.attr("y") : this.attr("cy");
};

stopMove = function () {

  //this.transform("...R45");
  socket.emit('update',
  //console.log(
    {
      type: 'change',
      board: channelName,
      _id: this.data("_id"),
      data: serializeShape(this),
      shape_id: this.id
    }
  );


  ox = 0;
  oy = 0;
};

/* INIT */

$('#add-circle').click(function (){
  socket.emit("update",{type: 'create', board: channelName, data: {type: 'circle', cx: 50, cy: 50, r: 15}});
});
$('#add-rect').click(function (){
  socket.emit("update",{type: 'create', board: channelName, data: {type: 'rect', x: 50, y: 50, width: 200, height: 70}});
});

//createCircle(paper, 370, 300,20);
