var paper, move, startMove,stopMove, channelName, createShape, createCircle, createRect, shapes,
  loadShapes, removeShape, boundingRect, selectShape, selectedShape, deselectShape, findShape;
boundingRect = null;
selectedShape = null;

shapes = [];
// WebSockets
channelName = $('#whiteboard').data('id');

var socket = io.connect('http://okonski.dyndns.org:3000');

findShape = function (paper,_id){
  for(var node = paper.bottom; node != null; node = node.next) {
    if (node && node.type && node.data("_id") === _id) {
      return node;
    }
  }
  return null;
};

loadShapes = function(shapes){
  for (var shape in shapes){
    shape = shapes[shape];
    createShape(paper,shape);
  }
};

selectShape = function(shape){
  if (shape.data("locked") === true)
    return;
  var bb = shape.getBBox(false);
  if (boundingRect != null){
    boundingRect.remove();
    socket.emit("lock", {type: "unset", _id: selectedShape.data("_id")});
  }
  boundingRect = paper.rect(bb.x,bb.y,bb.width,bb.height);
  boundingRect.attr({stroke: "#f00", "stroke-width": 2, "stroke-dasharray": "-"});
  boundingRect.toFront();
  selectedShape = shape;

  $('#remove-shape').removeAttr('disabled');
  $('#color').val(shape.attr('fill'));
  socket.emit("lock", {type: "set", _id: shape.data("_id")});
};

deselectShape = function (){
  socket.emit("lock", {type: "unset", _id: selectedShape.data("_id")});

  if (boundingRect != null)
    boundingRect.remove();
  boundingRect = null;
  selectedShape = null;
  $('#remove-shape').attr('disabled',true);

};
removeShape = function(){
  if (selectedShape == null)
    return;
  socket.emit('update', {type: 'remove', board: channelName, _id: selectedShape.data("_id")});
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
  shape.data("locked", false);
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



socket.on('move', function (data) {
  var shape = findShape(paper,data._id);

  if (shape)
    shape.attr(data.data);
});

socket.on('lock', function (data) {
  var shape = findShape(paper,data._id);

  if (shape){
    if (data.type === "set")
      shape.data("locked", true).attr({cursor: "default"}).attr("opacity",0.6);
    else if (data.type === "unset")
      shape.data("locked", false).attr({cursor: "move"}).attr("opacity",1);
  }

});

socket.on('update', function (data) {
  if (data.board !== channelName)
    return;
  if (data.type === "change"){
    var shape = findShape(paper,data._id);
    if (!shape)
      return;
    shape.animate(data.data,100);
  } else if (data.type === "create") {
    createShape(paper, data);
  } else if (data.type === "remove") {
    var shape = findShape(paper,data._id);
    if (shape)
      shape.remove();
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
  if (this.data("locked") === true)
    return;
  var att;
  this.attr({
    transform: "...T" + (dx - ox) + "," + (dy - oy)
  });
  //socket.emit('move', $.extend({board: channelName, type: this.type, _id: this.data("_id"), data: {transform: serializeShape(this).transform}},att));
  if (boundingRect != null){
    boundingRect.attr({
      transform: "...T" + (dx - ox) + "," + (dy - oy)
    });
  }
  ox = dx;
  oy = dy;
};

startMove = function () {
  if (this.data("locked") === true)
    return;
  selectShape(this);
  this.ox = this.type == "rect" ? this.attr("x") : this.attr("cx");
  this.oy = this.type == "rect" ? this.attr("y") : this.attr("cy");
};

stopMove = function () {
  if (this.data("locked") === true)
    return;
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
