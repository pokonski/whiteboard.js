var paper, move, startMove,stopMove, channelName, createShape, createCircle, createRect, shapes,
  loadShapes, removeShape, boundingRect, selectShape, selectedShape, deselectShape;
boundingRect = null;
selectedShape = null;

loadShapes = function(shapes){
  for (var shape in shapes){
    shape = shapes[shape];
    createShape(paper,shape);
  }
};

selectShape = function(shape){
  var bb = shape.getBBox(false);
  console.log(boundingRect);
  if (boundingRect != null)
    boundingRect.remove();
  boundingRect = paper.rect(bb.x,bb.y,bb.width,bb.height);
  boundingRect.attr({stroke: "#f00", "stroke-width": 2, "stroke-dasharray": "-"});
  boundingRect.toFront();
  selectedShape = shape;
  $('#remove-shape').removeAttr('disabled');
  $('#color').val(shape.attr('fill'));
};

deselectShape = function (){
  if (boundingRect != null)
    boundingRect.remove();
  boundingRect = null;
  selectedShape = null;
  $('#remove-shape').attr('disabled',true);
};
removeShape = function(){
  if (selectedShape == null)
    return;
  socket.emit('update', {type: 'remove', board: channelName, _id: selectedShape.data("_id"), shape_id: selectedShape.id});
  $('#remove-shape').attr('disabled',true);
};

createShape = function (paper, record){
  var shape;
  if (record.data.type == "circle"){
    shape = createCircle(paper, record.data);
  } else if (record.data.type == "rect"){
    shape = createRect(paper, record.data);
  }
  shape.data("_id", record._id);
  shape.attr("fill", record.data.fill);
  shape.attr("stroke", record.data.stroke);
  shape.transform(record.data.transform);
  shape.drag(move,startMove,stopMove).attr({cursor: "move"});
  shape.click(function(){ selectShape(this) });
  //shape.dblclick(removeShape);
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

  if (shape)
    shape.attr(data.data);
});

socket.on('update', function (data) {
  if (data.board !== channelName)
    return;
  if (data.type === "change"){
    var shape = paper.getById(data.shape_id);
    if (!shape)
      return;
    shape.animate(data.data,100);
  } else if (data.type === "create") {
    createShape(paper, data);
  } else if (data.type === "remove") {
    paper.getById(data.shape_id).remove();
    deselectShape();
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
  socket.emit('move', $.extend({board: channelName, type: this.type, data: {transform: serializeShape(this).transform}, shape_id: this.id},att));
  if (boundingRect != null){
    boundingRect.attr({
      transform: "...T" + (dx - ox) + "," + (dy - oy)
    });
  }
  ox = dx;
  oy = dy;
};

startMove = function () {
  selectShape(this);
  this.ox = this.type == "rect" ? this.attr("x") : this.attr("cx");
  this.oy = this.type == "rect" ? this.attr("y") : this.attr("cy");
};

stopMove = function () {
  socket.emit('update',
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
  socket.emit("update",{type: 'create', board: channelName, data: {type: 'circle', cx: 50, cy: 50, r: 15, fill: "#f00"}});
});
$('#add-rect').click(function (){
  socket.emit("update",{type: 'create', board: channelName, data: {type: 'rect', x: 50, y: 50, width: 200, height: 70, fill: "#f00"}});
});
$('#remove-shape').click(function (){
  removeShape();
});
$('#whiteboard > svg').click(function (e){
  if (e.target.nodeName == "svg")
    deselectShape();
});

$('#color').colorpicker().on('changeColor', function(e){
  if (selectedShape != null){
    selectedShape.attr('fill', e.color.toHex());
    socket.emit('update',
      {
        type: 'change',
        board: channelName,
        _id: selectedShape.data("_id"),
        data: serializeShape(selectedShape),
        shape_id: selectedShape.id
      }
    );
  }
});

//createCircle(paper, 370, 300,20);
