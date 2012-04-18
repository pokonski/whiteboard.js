var paper, move, startMove,stopMove, channelName, createShape, createCircle, shapes, loadShapes, removeShape;

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
  }
  shape.data("_id", record._id);
  shape.attr("fill", "#5289DD");
  shape.attr("stroke", "#332F29");
  shape.drag(move,startMove,stopMove).attr({cursor: "move"});
  shape.dblclick(removeShape);
  shapes.push(shape);
};

createCircle = function(paper, data){
  return paper.circle(data.cx,data.cy,data.r);
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
move = function (dx, dy) {
  var att = this.type == "rect" ? {x: this.ox + dx, y: this.oy + dy} : {cx: this.ox + dx, cy: this.oy + dy};
  this.attr(att);
  socket.emit('move', {board: channelName, type: this.type, cx: this.attr('cx'), cy: this.attr('cy'), shape_id: this.id});
};

startMove = function () {
  this.ox = this.type == "rect" ? this.attr("x") : this.attr("cx");
  this.oy = this.type == "rect" ? this.attr("y") : this.attr("cy");
};

stopMove = function () {
  socket.emit('update', {type: 'change', board: channelName, _id: this.data("_id"), data: {type: this.type, r: this.attr("r"), cx: this.attr('cx'), cy: this.attr('cy')}, shape_id: this.id});
};

/* INIT */

$('#add-circle').click(function (){
  socket.emit("update",{type: 'create', board: channelName, data: {type: 'circle', cx: 50, cy: 50, r: 15}});
});

//createCircle(paper, 370, 300,20);
