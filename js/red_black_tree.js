class Node {
  constructor(value, isRed, active, rotate) {
    this.value = value ? value : "";
    this.isRed = isRed ? isRed : false;
    this.isActive = active ? active : false;
    this.rotate = rotate ? rotate : null;
  }

  init(x, y, radius) {
    // draw circle
    this.circle = new paper.Path.Circle({
      center: [x, y],
      radius: radius,
      strokeWidth: 2,
      strokeColor: '#000',
      fillColor: '#000'
    });

    if (this.isRed) this.circle.fillColor = '#f00';
    if (this.isActive) this.circle.strokeColor = Node.activeColor;
  
    // render text
    this.text = new paper.PointText({
      point: [x, y + (radius * 0.25)],
      content: this.value,
      fillColor: '#fff',
      fontFamily: 'Courier New',
      fontWeight: 'bold',
      fontSize: radius * 0.8,
      justification: 'center'
    });

    // curved arrow around node
    this.arrow = new paper.Path({
      segments: [
        new paper.Segment(
          new paper.Point(x + (radius * 2), y + (radius * 0.7)),
          null,
          new paper.Point(radius * 0.3, radius * -0.3)),
        new paper.Segment(
          new paper.Point(x + (radius * 2), y + (radius * -0.7)),
          new paper.Point(radius * 0.3, radius * 0.3),
          null)
      ],
      strokeWidth: 2,
      strokeColor: '#000'
    });

    this.arrow_head = new paper.Path({
      segments: [
        new paper.Segment(new paper.Point(x + (radius * 1.9), y + (radius * 0.35 * (this.rotate > 0 ? 1 : -1)))),
        new paper.Segment(new paper.Point(x + (radius * 2), y + (radius * 0.7 * (this.rotate > 0 ? 1 : -1)))),
        new paper.Segment(new paper.Point(x + (radius * 2.4), y + (radius * 0.55 * (this.rotate > 0 ? 1 : -1))))
      ],
      strokeWidth: 2,
      strokeColor: '#000'
    });

    // rotate the arrow around the node
    if (!this.rotate) {
      this.arrow.strokeWidth = 0;
      this.arrow_head.strokeWidth = 0;
    }

    this.arrow.rotate(this.rotate, new paper.Point(x, y));
    this.arrow_head.rotate(this.rotate, new paper.Point(x, y));
  }
}

class Connection {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }

  init(nodes) {
    // get parent and child nodes
    let node_parent = nodes[this.from];
    let node_child = nodes[this.to];

    // get centers from both nodes
    let point_start = new paper.Point(node_parent.circle.position);
    let point_end = new paper.Point(node_child.circle.position);

    // path connecting points
    this.path = new paper.Path({
      segments: [point_start, point_end],
      strokeColor: "#000",
      strokeWidth: 2
    });

    // shorten ends to node borders (not centers)
    this.path.segments[0].point = this.path.getIntersections(node_parent.circle)[0].point;
    this.path.segments[1].point = this.path.getIntersections(node_child.circle)[0].point;
  }
}

export class RBTree {
  constructor(tree, params) {
    const node_radius = params["node_radius"];
    const x_scale = params["x_scale"];
    const y_scale = params["y_scale"];
    Node.activeColor = params["active_color"];

    this.node_radius = node_radius; // this.node_radius = params["node_radius"] doesn't work (attribute is not defined)
    this.x_scale = x_scale;
    this.y_scale = y_scale;

    // we want to save keys in index order
    var keys = Object.keys(tree);
    keys.sort();

    // calculate max level by taking the biggest index
    this.max_level = this.level_from_index(keys[keys.length - 1]);

    // calculate root node position
    this.root_x = this.node_radius * 3;
    this.root_y = this.node_radius * 3;

    var sum = 0;
    for (var i = 0; i < this.max_level; i++) {
      sum += Math.pow(2, 2 + i);
    }
    this.root_x += sum * node_radius * x_scale; // magic formula that calculates middle of the tree

    // add all nodes to array
    this.nodes = {};
    for (let key of keys) {
      this.nodes[key] = new Node(tree[key]["value"], tree[key]["isRed"], tree[key]["isActive"], tree[key]["angle"]);
    };

    this.connections = [];
    // draw connections between nodes
    for (const [key, node] of Object.entries(this.nodes)) {
      var left_child = this.nodes[key * 2];
      if (left_child != null) {
        this.connections.push(new Connection(key, key * 2));
      }

      var right_child = this.nodes[key * 2 + 1];
      if (right_child != null) {
        this.connections.push(new Connection(key, key * 2 + 1));
      }
    }
  }

  init() {
    // first draw nodes
    for (const [key, node] of Object.entries(this.nodes)) {
      var offset = this.find_position_offset_from_index(key);
      node.init(this.root_x + offset[0], this.root_y + offset[1], this.node_radius);
    }

    // first draw connections
    for (let connection of this.connections) {
      connection.init(this.nodes);
    }
  }

  get_size() {
    var width = this.root_x * 2 + (this.node_radius * 2);
    var height = this.node_radius * this.y_scale * (4 * this.max_level + 2) + this.node_radius * 4;

    return new paper.Size(width, height);
  }

  level_from_index(index) {
    if (index == 1) return 0;
    else return Math.floor(Math.log2(index));
  }

  find_position_offset_from_index(index) {
    var level = this.level_from_index(index);
    var relative_level = this.max_level - level;
  
    var x_offset = 0;
    var y_offset = 0;
    
    if (level != 0) {
      // find level's origin point since it's not root
      for (var i = 1; i <= level; i++) {
        var curr_relative_level = this.max_level - i;
        x_offset -= Math.pow(2, 2 + curr_relative_level) * this.node_radius * this.x_scale;
      }
      y_offset += 4 * level * this.node_radius * this.y_scale;
    }
  
    // find x offset
    var index_offset = Math.abs(Math.pow(2, level) - index);
    x_offset += index_offset * Math.pow(2, 3 + relative_level) * this.node_radius * this.x_scale;
  
    return [x_offset, y_offset];
  }
}
