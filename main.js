import { RBTree, Node } from './js/red_black_tree.js';
import { grid } from './js/labyrinth.js';
import { graph } from './js/graphs.js';

function background(color) {
  var canvas = document.getElementById('myCanvas');
  var width = canvas.width;
  var height = canvas.height;

  new paper.Path.Rectangle({
    point: [0, 0],
    size: [width, height],
    fillColor: color
  });
}

function set_canvas_size(size) {
  var canvas = document.getElementById('myCanvas');
  canvas.width  = size.width;
  canvas.height = size.height;
}

var tree = { 
  1:["104","red", "", 1], 
  2:["83","black", "", 90], 
  3:["5", "black", "active", 84],
  4:["23", "red"],
  5:["92", "red", "active"],
  6:["16", "red"],
  7:["4", "red"],
  8:["NIL", "black", "", -153],
  9:["NIL", "black"],
  12:["NIL", "black"],
  13:["NIL", "black"],
  15:["NIL", "black"]
};

var tree2 = { 
  1:["104","red"], 
  2:["83","black"], 
  3:["5", "black"],
  4:["23", "red"],
  6:["16", "red"],
  7:["4", "red"]
};

var map = [
  ['' , 't:S' , '' , '' , '' , '' , '' ],
  ['x' , 'd' , 'x' , 'x' , 'x' , 'x' , 'x' ],
  ['x' , 'tr:#f00', 'ra:#0f0' , 'r:#00f' , 'bl', ' ' , ' ' ],
  ['x' , ' ' , 'x' , 'x' , 'da' , 'x' , ' ' ],
  ['x' , ' ' , 'x' , 'x' , 'ua' , 'x' , ' ' ],
  ['x' , ' ' , 'br', 'la' , 'tl', ' ' , ' ' ],
  ['x' , 'x' , 'd' , 'x' , 'x' , 'x' , 'x' ],
  ['x' , 'x' , 'u' , 'x' , 'x' , 'x' , 'x' ],
  ['' , '' , 't:M' , '' , '' , '' , '' ]
];

var map2 = [
  ['' , ' ', 'v', ' '],
  ['', 'x', 'v', ' '],
  [' ', 'br', 'tl', ' '],
  [' ', 'v', 'x', ''],
];

var nodes = {
  1:[0, 0, '1'],
  2:[4, 0, '2'],
  3:[4, 2, '3'],
  4:[2, 2, '4'],
  5:[2, 1, '5'],
  6:[0, 2, '6'],
}

var connections = {
  1:[1, 2, '#00f'],
  2:[2, 3, '#0f0'],
  3:[3, 4, '#f00'],
  4:[4, 5, '#000'],
  5:[5, 6, '#f0f']
}

window.onload = function() {
  var canvas = document.getElementById("myCanvas");
  paper.setup(canvas);

  // set canvas size for background (put bigger values if background doesn't cover entire drawing)
  var size = new paper.Size(1600, 1600);
  set_canvas_size(size);

  //background
  background('rgb(200, 200, 200)');

  // RB Tree
  Node.activeColor = '#2bc5f0';
  var rb_tree = new RBTree(tree, 20, 0.5, 1);
  rb_tree.init();
  size = rb_tree.get_size();

  // Labirynth
  //size = grid(map, 40, 50);

  // Graph
  //size = graph(nodes, connections, false, 50, 0.8);

  // crop canvas size to rendered content
  set_canvas_size(size);

  // define function for animation
  paper.view.onFrame = function(event) {
    // rb_tree.get_node_with_index(2).arrow.rotate(1, rb_tree.get_node_with_index(2).circle.position);
  } 

  paper.view.draw();

  // Download picture
  document.getElementById("clickMe").onclick = function () {
    paper.view.element.toBlob(function(blob) { saveAs(blob, "image.png");});
  };
}
