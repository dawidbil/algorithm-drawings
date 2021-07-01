function get_position_from_direction(element, direction) {
  switch(direction) {
    case 'topCenter':
      return element.topCenter;
    case 'bottomCenter':
      return element.bottomCenter;
    case 'leftCenter':
      return element.leftCenter;
    case 'rightCenter':
      return element.rightCenter;
  }
}

function check_if_opposite_direction(a, b) {
  if (a == "bottomCenter" && b == "topCenter") return true;
  if (a == "topCenter" && b == "bottomCenter") return true;
  if (a == "leftCenter" && b == "rightCenter") return true;
  if (a == "rightCenter" && b == "leftCenter") return true;

  return false;
}

function draw_arrow(path, offset, width, closed, color) {
  let offset_point = path.getPointAt(path.length - offset);
  let normal = path.getNormalAt(path.length - offset);
  console.log("offset point " + offset_point);
  let point_left = normal.multiply(width);
  console.log("point left " + point_left);
  let point_right = normal.multiply(-width);
  console.log("point right " + point_right);

  let arrow = new paper.Path({
    segments: [path.segments[path.segments.length - 1], point_left.add(offset_point), point_right.add(offset_point)],
    closed: closed,
    fillColor: color,
    strokeColor: color
  });

  path.segments[path.segments.length - 1].point = offset_point;

  return arrow;
}

class Connection {
  constructor(id_from, id_from_direction, from_index, id_to, id_to_direction, to_index, arrow, color, margin, segments) {
    this.id_from = id_from;
    this.id_from_direction = id_from_direction ? id_from_direction : "bottomCenter";
    this.from_index = from_index ? from_index : null;
    this.id_to = id_to;
    this.id_to_direction = id_to_direction ? id_to_direction : "topCenter";
    this.to_index = to_index ? to_index : null;
    this.arrow = arrow ? arrow : false;
    this.color = color ? color : "#000";
    this.margin = margin ? margin : 10;
    this.segments = segments ? segments : [];
  }

  init(elements) {
    let element_from = elements[this.id_from];
    if (this.from_index) element_from = element_from.cells[this.from_index];

    let element_to = elements[this.id_to];
    if (this.to_index) element_to = element_to.cells[this.to_index];

    let from_position = get_position_from_direction(element_from.cell.bounds, this.id_from_direction);
    let to_position = get_position_from_direction(element_to.cell.bounds, this.id_to_direction);

    this.path = new paper.Path({
      segments: [from_position, to_position],
      strokeColor: this.color,
      strokeWidth: 3
    });

    // insert segments that path should go through
    this.segments.forEach(segment => this.path.insert(this.path.segments.length - 1, segment));

    this.path.smooth({ type: 'geometric', factor: 0.3});

    let offset_point = this.path.getPointAt(this.margin);
    this.path.segments[0].point = offset_point;

    offset_point = this.path.getPointAt(this.path.length  - this.margin);
    this.path.segments[this.path.segments.length - 1].point = offset_point;

    if (this.arrow) {
      this.path_arrow = draw_arrow(this.path, 20, 5, false, this.color);
    }
    console.log(this.path_arrow);
  }
}

class Text {
  constructor(x, y, value, color, size, after) {
    this.x = x ? x : null;
    this.y = y ? y : null;
    this.value = value ? value : "";
    this.color = color ? color : "#000";
    this.size = size;
    this.after = after ? after : null;
  }

  init(elements) {
    let position;

    // find position
    if (this.after) {
      elements.forEach(function(element, key) {
        if (key == this.after) {
          let tmp_path = new paper.PointText({
            content: element.value,
            point: [element.x, element.y],
            fontFamily: 'Courier New',
            fontSize: element.size
          });

          this.x = tmp_path.bounds.bottomRight.x;
          this.y = element.y;

          if (!this.size) this.size = element.size;
          tmp_path.remove();
        }
      }, this);
    }
    position = new paper.Point(this.x, this.y);

    this.cell = new paper.PointText({
      point: position,
      content: this.value,
      fillColor: this.color,
      fontFamily: 'Courier New',
      fontSize: this.size ? this.size : 10,
    });
  }
}

class Cell {
  constructor(x, y, value, color, background_color) {
    this.x = x;
    this.y = y;
    this.value = value ? value : "";
    this.color = color ? color : "#000";
    this.background_color = background_color ? background_color : null;
  }

  init(width, height) {
    this.cell = new paper.Path.Rectangle({
      point: [this.x, this.y],
      size: [width, height],
      strokeColor: 'black',
      fillColor: this.background_color
    });

    this.text = new paper.PointText({
      point: [0, 0],
      content: this.value,
      fillColor: this.color,
      fontFamily: 'Courier New',
      fontSize: height * 0.8,
    });

    // center text at the middle of cell
    this.text.position = [this.x + width / 2, this.y + height / 2];
  }
}

class CellArray {
  constructor(x, y, width, height, cells_json) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    this.cells = [];
    for (let i = 0; i < cells_json.length; i++) {
      let cell_json = cells_json[i];
      this.cells.push(new Cell(this.x + (i * this.width), this.y,
        cell_json["value"], cell_json["color"], cell_json["background_color"]));
    }
  }

  init(elements) {
    this.cells.forEach(function(cell) {
      cell.init(this.width, this.height);
    }, this);
  }
}

export class Container {
  constructor(elements, params) {
    this.size_x = params["size_x"];
    this.size_y = params["size_y"];
    this.elements = [];
    let element;

    for (let key = 0; key < elements.length; key++) {
      element = elements[key];

      if (element["type"] == "Container") {
        this.elements[key] = new CellArray(element["x"], element["y"], element["width"], element["height"], element["cells"]);
      } else if (element["type"] == "Text") {
        this.elements[key] = new Text(element["x"], element["y"], element["value"], element["color"], element["size"], element["after"]);
      } else if (element["type"] == "Connection") {
        this.elements[key] = new Connection(element["from"], element["from_direction"], element["from_index"], element["to"],
          element["to_direction"], element["to_index"], element["arrow"], element["color"], element["margin"], element["segments"]);
      }
    }
  }

  init() {
    this.elements.forEach(function(elem) {
      elem.init(this.elements);
    }, this);
  }

  get_size() {
    return new paper.Size(this.size_x, this.size_y);
  }
}
