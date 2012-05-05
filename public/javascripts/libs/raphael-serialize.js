var serializeShape = function(node) {
  var object = null;
  if (node && node.type) {
    switch(node.type) {
      case "image":
        object = {
          type: node.type,
          width: node.attrs['width'],
          height: node.attrs['height'],
          x: node.attrs['x'],
          y: node.attrs['y'],
          src: node.attrs['src'],
          transform: node.transformations ? node.transformations.join(' ') : ''
        };
        break;
      case "circle":
        object = {
          type: node.type,
          r: node.attrs['r'],
          cx: node.attrs['cx'],
          cy: node.attrs['cy'],
          stroke: node.attrs['stroke'] === 0 ? 'none': node.attrs['stroke'],
          'stroke-width': node.attrs['stroke-width'],
          fill: node.attrs['fill']
        };
        break;
      case "ellipse":
        object = {
          type: node.type,
          rx: node.attrs['rx'],
          ry: node.attrs['ry'],
          cx: node.attrs['cx'],
          cy: node.attrs['cy'],
          stroke: node.attrs['stroke'] === 0 ? 'none': node.attrs['stroke'],
          'stroke-width': node.attrs['stroke-width'],
          fill: node.attrs['fill']
        };
        break;
      case "rect":
        object = {
          type: node.type,
          x: node.attrs['x'],
          y: node.attrs['y'],
          width: node.attrs['width'],
          height: node.attrs['height'],
          stroke: node.attrs['stroke'] === 0 ? 'none': node.attrs['stroke'],
          'stroke-width': node.attrs['stroke-width'],
          fill: node.attrs['fill']
        };
        break;
      case "text":
        object = {
          type: node.type,
          font: node.attrs['font'],
          'font-family': node.attrs['font-family'],
          'font-size': node.attrs['font-size'],
          stroke: node.attrs['stroke'] === 0 ? 'none': node.attrs['stroke'],
          fill: node.attrs['fill'] === 0 ? 'none' : node.attrs['fill'],
          'stroke-width': node.attrs['stroke-width'],
          x: node.attrs['x'],
          y: node.attrs['y'],
          text: node.attrs['text'],
          'text-anchor': node.attrs['text-anchor']
        };
        break;

      case "path":
        var path = "";

        if(node.attrs['path'].constructor != Array){
          path += node.attrs['path'];
        }
        else{
          $.each(node.attrs['path'], function(i, group) {
            $.each(group,
              function(index, value) {
                if (index < 1) {
                  path += value;
                } else {
                  if (index == (group.length - 1)) {
                    path += value;
                  } else {
                    path += value + ',';
                  }
                }
              });
          });
        }

        object = {
          type: node.type,
          fill: node.attrs['fill'],
          opacity: node.attrs['opacity'],
          translation: node.attrs['translation'],
          scale: node.attrs['scale'],
          path: path,
          stroke: node.attrs['stroke'] === 0 ? 'none': node.attrs['stroke'],
          'stroke-width': node.attrs['stroke-width'],
          transform: node.transformations ? node.transformations.join(' ') : ''
        }
    }
  }
  object.transform = node.transform();
  return object;
};