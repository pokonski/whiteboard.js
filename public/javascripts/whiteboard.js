var paper, move, startMove,stopMove, channelName;

// WebSockets
channelName = '/updates/'+$('#whiteboard').data('id');

var client = new Faye.Client('http://okonski.dyndns.org:3000/faye');

var updates = client.subscribe(channelName, function(update) {
  console.log(update);
  var att = this.type == "rect" ? {x: update.x, y: update.y} : {cx: update.x, cy: update.y};
  paper.getById(update.id).attr(att);
});


paper = Raphael("whiteboard", "100%", 600);

move = function (dx, dy) {
  var att = this.type == "rect" ? {x: this.ox + dx, y: this.oy + dy} : {cx: this.ox + dx, cy: this.oy + dy};
  this.attr(att);
  client.publish(channelName, {x: att.cx, y: att.cy, id: this.id});

};

startMove = function () {
  this.ox = this.type == "rect" ? this.attr("x") : this.attr("cx");
  this.oy = this.type == "rect" ? this.attr("y") : this.attr("cy");
};

stopMove = function () {
  console.log("stop");
};

// Creates circle at x = 50, y = 40, with radius 10
var circle = paper.circle(50, 40, 10);
// Sets the fill attribute of the circle to red (#f00)
circle.attr("fill", "#f00");

// Sets the stroke attribute of the circle to white
circle.attr("stroke", "#000000");
circle.drag(move,startMove,stopMove).attr({cursor: "move"});