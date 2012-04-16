var paper, move, startMove,stopMove, channelName, createCircle, shapes;

shapes = [];
// WebSockets
channelName = "whiteboard_" + $('#whiteboard').data('id');

var socket = io.connect('http://localhost:3000');

socket.on('update', function (data) {
  if (data.board !== channelName)
    return;
  if (data.type === "change"){
    var att = this.type == "rect" ? {x: data.x, y: data.y} : {cx: data.x, cy: data.y};
    var shape = paper.getById(data.id);
    if (shape)
      shape.attr(att);
  } else if (data.type === "create") {
    createCircle(paper, data.x,data.y,data.radius, true);
  }
});


paper = Raphael("whiteboard", 938, 600);

var hover = function(){
  this.animate({fill: "#22ff33"},200);
};
move = function (dx, dy) {
  var att = this.type == "rect" ? {x: this.ox + dx, y: this.oy + dy} : {cx: this.ox + dx, cy: this.oy + dy};
  this.attr(att);
  socket.emit('update', {type: 'change', board: channelName, x: att.cx, y: att.cy, id: this.id});
};

startMove = function () {
  this.ox = this.type == "rect" ? this.attr("x") : this.attr("cx");
  this.oy = this.type == "rect" ? this.attr("y") : this.attr("cy");
};

stopMove = function () {

};

/* INIT */

createCircle = function(paper, x,y,r, skipEmit){
  var circle = paper.circle(x,y,r);
  circle.attr("fill", "#f00");

// Sets the stroke attribute of the circle to white
  circle.attr("stroke", "#000000");
  circle.drag(move,startMove,stopMove).attr({cursor: "move"});

  shapes.push(circle);
  if (typeof skipEmit === "undefined" || skipEmit === false)
    socket.emit("update",{type: 'create', board: channelName, x: x, y: y, radius: r});
};

$('#add-circle').click(function (){
  console.log("asd");
  createCircle(paper, 50,50,15);
});

createCircle(paper, 370, 300,20, true);
