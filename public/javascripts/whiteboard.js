/* global io: false, serializeShape: false, Raphael: false */
/* jslint nomen: true, devel: true, browser: true */
var loadShapes;
(function ($) {
  "use strict";

  var paper, move, startMove, stopMove, channelName, createShape, createCircle, createRect, shapes,
    removeShape, boundingRect, selectShape, selectedShape, deselectShape, findShape,
    socket, attachFreeTransform, emitUpdate;

  boundingRect = null;
  selectedShape = null;

  shapes = [];

  // WebSockets
  channelName = $('#whiteboard').data('id');

  socket = io.connect(':3000');

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

  emitUpdate = function (shape) {
    socket.emit('update', {
      type: 'change',
      board: channelName,
      _id: shape.data("_id"),
      data: serializeShape(shape, shapes[shape.data("_id")].ft.attrs),
      shape_id: shape.id
    });
  };

  selectShape = function (shape) {
    if (shape.data("locked") === true || selectedShape === shape) {
      return;
    }

    if (selectedShape) {
      if (shapes[selectedShape.data("_id")]) {
        shapes[selectedShape.data("_id")].ft.hideHandles();
      }
      socket.emit("lock", {type: "unset", _id: selectedShape.data("_id")});
    }

    selectedShape = shape;
    $('#shape-settings').css('opacity', 1);
    $('#fill-color').data('color', shape.attr('fill')).colorpicker('update');
    $('#stroke-color').data('color', shape.attr('stroke')).colorpicker('update');
    $('#stroke-width').val(shape.attr('stroke-width'));
    socket.emit("lock", {type: "set", _id: shape.data("_id")});
  };

  deselectShape = function (target) {
    if (selectedShape) {
      if (target && selectedShape.data("_id") !== target) {
        return;
      }
      socket.emit("lock", {type: "unset", _id: selectedShape.data("_id")});
      if (shapes[selectedShape.data("_id")]) {
        shapes[selectedShape.data("_id")].ft.hideHandles();
      }
    }
    selectedShape = null;
    $('#shape-settings').css('opacity', 0);

  };
  removeShape = function () {
    if (selectedShape === null) {
      return;
    }
    socket.emit('update', {type: 'remove', board: channelName, _id: selectedShape.data("_id")});
  };
  attachFreeTransform = function (shape) {
    if (shapes[shape.data("_id")]) {
      shapes[shape.data("_id")].ft.unplug();
    }
    var ft = paper.freeTransform(shape, {showAxisHandles: true, showBBox: true, attrs: { cursor: "pointer", fill: "#FFF", stroke: "#000" }}, function (ft, events) {

      if (events.join(" ").match(/start/)) {
        selectShape(ft.subject);
      }
      if (events.indexOf("rotate end") !== -1 || events.indexOf("scale end") !== -1 || events.indexOf("drag end") !== -1) {

        socket.emit('update', {
          type: 'change',
          board: channelName,
          _id: ft.subject.data("_id"),
          data: serializeShape(ft.subject, ft.attrs),
          shape_id: ft.subject.id
        });
      }
    });
    ft.hideHandles();
    return ft;
  };
  createShape = function (paper, record) {
    var shape, ft;
    if (record.data.type === "circle") {
      shape = createCircle(paper, record.data);
    } else if (record.data.type === "rect") {
      shape = createRect(paper, record.data);
    } else if (record.data.type === "text") {
      shape = paper.text(record.data.x, record.data.y, record.data.text);
    } else if (record.data.type === "path") {
      shape = paper.path(record.data.path);
    }
    shape.data("_id", record._id);
    shape.data("locked", false);
    shape.attr("fill", record.data.fill);
    shape.attr("stroke", record.data.stroke);
    shape.attr("stroke-width", record.data["stroke-width"]);
    //shape.attr("vector-effect", "non-scaling-stroke");
    shape.transform(record.data.transform);
    //shape.drag(move, startMove, stopMove).attr({cursor: "move"});
    shape.click(function () {
      if (this.data("locked") !== true) {
        shapes[this.data("_id")].ft.showHandles();
        selectShape(this);
      }
    });
    ft = attachFreeTransform(shape);
    if (record.data.attrs) {
      ft.attrs = record.data.attrs;
      ft.apply();
    }
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

  // Update lock status when new user connects
  socket.on('status', function (data) {
    if (data.type === "locks" && selectedShape) {
      socket.emit("lock", {type: "set", _id: selectedShape.data("_id")});
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
        if (data.data.ft) {
          var ft = shapes[data._id].ft;
          ft.attrs = data.data.ft;
          ft.apply();
        }
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
      deselectShape(data._id);
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
  $('#add-text').click(function () {
    var text = prompt("Enter text");
    if (text.length > 0) {
      socket.emit("update", {type: 'create', board: channelName, data: {type: 'text', x: 50, y: 50, text: text, fill: "#f00"}});
    }
  });

  $('.add-svg').click(function () {
    $.ajax({
      type: "GET",
      url: "/shapes/" + $(this).data("shape"),
      dataType: "xml",
      success: function (svgXML) {
        var el = paper.importSVG(svgXML)[0];
        socket.emit("update", {type: 'create', board: channelName, data: {type: 'path', path: el.attr("path"), fill: "#000000"}});
        el.remove();
      }
    });
  });
  $('#remove-shape').click(function () {
    removeShape();
  });
  $('#whiteboard > svg').click(function (e) {
    if (e.target.nodeName === "svg") {
      deselectShape();
    }
  });

  $('#stroke-color, #fill-color').colorpicker().on('changeColor', function (e) {
    if (selectedShape !== null) {
      selectedShape.attr(($(this).attr('id') === "stroke-color" ? "stroke" : "fill"), e.color.toHex());
      emitUpdate(selectedShape);
    }
  });

  $('#stroke-width').on('change', function () {
    if (selectedShape !== null) {
      selectedShape.attr('stroke-width', $(this).val());
      emitUpdate(selectedShape);
    }
  });
  $(document).keydown(function (e) {
    if (e.which === 46) {
      removeShape();
    }
  });
  // Unlock selected shape before quitting the page
  $(window).bind("beforeunload", function () {
    deselectShape();
  });
}(window.jQuery));