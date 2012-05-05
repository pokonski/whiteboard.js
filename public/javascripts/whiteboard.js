/* global io: false, serializeShape: false, Raphael: false */
/* jslint nomen: true, devel: true, browser: true */
var loadShapes;
(function ($) {
  "use strict";

  var paper, move, startMove, stopMove, channelName, createShape, createCircle, createRect, shapes,
    removeShape, boundingRect, selectShape, selectedShape, deselectShape, findShape,
    socket;

  boundingRect = null;
  selectedShape = null;

  shapes = [];

  // WebSockets
  channelName = $('#whiteboard').data('id');

  socket = io.connect('http://okonski.dyndns.org:3000');

  findShape = function (paper, _id) {
    var node;
    for (node = paper.bottom; node !== null; node = node.next) {
      if (node && node.type && node.data("_id") === _id) {
        return node;
      }
    }
    return null;
  };

  loadShapes = function (shapes) {
    var shape;
    for (shape in shapes) {
      if (shapes.hasOwnProperty(shape)) {
        shape = shapes[shape];
        createShape(paper, shape);
      }
    }
  };

  selectShape = function (shape) {
    if (shape.data("locked") === true || selectedShape === shape) {
      return;
    }
    //var bb = shape.getBBox(false);
    if (selectedShape !== null) {
      //boundingRect.remove();
      shapes[selectedShape.data("_id")].ft.hideHandles();
      socket.emit("lock", {type: "unset", _id: selectedShape.data("_id")});
    }
    //boundingRect = paper.rect(bb.x, bb.y, bb.width, bb.height);
    //boundingRect.attr({stroke: "#f00", "stroke-width": 2, "stroke-dasharray": "-"});
    //boundingRect.toFront();
    selectedShape = shape;

    $('#remove-shape').removeAttr('disabled');
    $('#color').val(shape.attr('fill'));
    socket.emit("lock", {type: "set", _id: shape.data("_id")});
  };

  deselectShape = function () {
    socket.emit("lock", {type: "unset", _id: selectedShape.data("_id")});

    /* if (boundingRect !== null) {
      boundingRect.remove();
    }
    boundingRect = null; */
    if (selectedShape) {
      shapes[selectedShape.data("_id")].ft.hideHandles();
    }
    selectedShape = null;
    $('#remove-shape').attr('disabled', true);

  };
  removeShape = function () {
    if (selectedShape === null) {
      return;
    }
    socket.emit('update', {type: 'remove', board: channelName, _id: selectedShape.data("_id")});
    $('#remove-shape').attr('disabled', true);
  };

  createShape = function (paper, record) {
    var shape, ft;
    if (record.data.type === "circle") {
      shape = createCircle(paper, record.data);
    } else if (record.data.type === "rect") {
      shape = createRect(paper, record.data);
    }
    shape.data("_id", record._id);
    shape.data("locked", false);
    shape.attr("fill", record.data.fill);
    shape.attr("stroke", record.data.stroke);
    shape.transform(record.data.transform);
    //shape.drag(move, startMove, stopMove).attr({cursor: "move"});
    shape.click(function () {
      if (this.data("locked") !== true) {
        shapes[this.data("_id")].ft.showHandles();
      }
    });
    shape.click(function () {
      selectShape(this);
    });
    ft = paper.freeTransform(shape, {showBBox: true, attrs: { cursor: "pointer", fill: "#FFF", stroke: "#000" }}, function (ft, events) {

      if (events.join(" ").match(/start/)) {
        selectShape(ft.subject);
      }
      if (events.indexOf("rotate end") !== -1 || events.indexOf("scale end") !== -1 || events.indexOf("drag end") !== -1) {

        socket.emit('update', {
          type: 'change',
          board: channelName,
          _id: ft.subject.data("_id"),
          data: serializeShape(ft.subject),
          shape_id: ft.subject.id
        });
      }
    });
    ft.hideHandles();
    shapes[record._id] = {shape: shape, ft: ft};
  };

  createCircle = function (paper, data) {
    return paper.circle(data.cx, data.cy, data.r);
  };

  createRect = function (paper, data) {
    return paper.rect(data.x, data.y, data.width, data.height);
  };



  socket.on('move', function (data) {
    var shape = findShape(paper, data._id);

    if (shape) {
      shape.attr(data.data);
    }
  });

  socket.on('lock', function (data) {
    var shape = findShape(paper, data._id);

    if (shape) {
      if (data.type === "set") {
        shape.data("locked", true).attr({cursor: "default"}).attr("opacity", 0.6);
      } else if (data.type === "unset") {
        shape.data("locked", false).attr({cursor: "move"}).attr("opacity", 1);
      }
    }

  });

  socket.on('update', function (data) {
    if (data.board !== channelName) {
      return;
    }
    var shape;
    if (data.type === "change") {
      shape = shapes[data._id].shape;
      if (!shape) {
        return;
      }
      shape.animate(data.data, 100, "ease-out", function () {
        //shapes[data._id].ft;
        console.log("anim finished");
      });
    } else if (data.type === "create") {
      createShape(paper, data);
    } else if (data.type === "remove") {
      shape = shapes[data._id].shape;
      if (shape) {
        shape.remove();
        shapes[data._id].ft.unplug();
        delete shapes[data._id];
      }
      deselectShape();
    }
  });


  paper = Raphael("whiteboard", 938, 600);



  /* EVENTS */

  $('#add-circle').click(function () {
    socket.emit("update", {type: 'create', board: channelName, data: {type: 'circle', cx: 50, cy: 50, r: 15, fill: "#f00"}});
  });
  $('#add-rect').click(function () {
    socket.emit("update", {type: 'create', board: channelName, data: {type: 'rect', x: 50, y: 50, width: 200, height: 70, fill: "#f00"}});
  });
  $('#remove-shape').click(function () {
    removeShape();
  });
  $('#whiteboard > svg').click(function (e) {
    if (e.target.nodeName === "svg") {
      deselectShape();
    }
  });

  $('#color').colorpicker().on('changeColor', function (e) {
    if (selectedShape !== null) {
      selectedShape.attr('fill', e.color.toHex());
      socket.emit('update', {
        type: 'change',
        board: channelName,
        _id: selectedShape.data("_id"),
        data: serializeShape(selectedShape),
        shape_id: selectedShape.id
      });
    }
  });

  // Unlock selected shape before quitting the page
  $(window).bind("beforeunload", function () {
    deselectShape();
  });
}(window.jQuery));