/** @type {HTMLCanvasElement} */

class Selector {
  constructor({
    container,
    canvas,
    colors,
    lineWidth,
    resizersSize,
    x,
    y,
    width,
    height,
    aspectRatio,
  }) {
    // container
    this.container = container;
    this.styles(this.container, { touchAction: "none", position: "relative" });
    this.containerInfo = container.getBoundingClientRect();

    // Canvas
    this.canvas = canvas || document.createElement("canvas");
    this.styles(this.canvas, {
      position: "absolute",
      top: 0,
      right: 0,
      height: "100%",
      zIndex: 100,
      display: "block",
    });
    if (!canvas) this.container.appendChild(this.canvas);
    this.c = this.canvas.getContext("2d");

    // Selector rectangle
    this.width = width || this.containerInfo.width / 2;
    this.height = height || this.containerInfo.height / 2;
    this.x = x || this.containerInfo.width / 2 - this.width / 2;
    this.y = y || this.containerInfo.height / 2 - this.height / 2;

    // Draw resizer
    this.drawing = false;

    // Selector resize points
    this.pointSize = resizersSize || 5;
    this.resizers = {};
    this.selectedResizer = null;
    this.sides = ["tl", "ct", "tr", "cl", "cr", "bl", "cb", "br"];

    // Event Handleres
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.resize = this.resize.bind(this);
    this.hoverCursor = this.hoverCursor.bind(this);

    // For moving the selector
    this.offset = {
      x: 0,
      y: 0,
    };
    this.position = {
      x: this.x,
      y: this.y,
    };

    // Aspect Ratio
    this.ratio = aspectRatio || null;

    // CallBack
    this.callback = null;

    // initiate canvas sizes
    this.canvas.width = this.containerInfo.width;
    this.canvas.height = this.containerInfo.height;

    // Cursors
    this.cursors = {
      tl: "se-resize",
      tr: "sw-resize",
      bl: "ne-resize",
      br: "nw-resize",
      cl: "e-resize",
      ct: "s-resize",
      cr: "w-resize",
      cb: "n-resize",
    };

    // Styles
    this.colors = colors;
    this.c.lineWidth = lineWidth;

    // Speeds
    this.speedX = 0;
    this.speedY = 0;
    this.prevPos = 0;
    this.stoppedSpeed = false;

    // Test
    this.dx = 0;
    this.dy = 0;
    this.dWidth = 0;
    this.dHeight = 0;
    this.stopResizing = [];

    // Event listeners
    window.addEventListener("resize", this.resize);
  }

  // To apply styles as an object to a node
  styles(node, styles) {
    Object.keys(styles).forEach((key) => (node.style[key] = styles[key]));
  }

  cursor(cursor) {
    this.container.style.cursor = cursor;
  }

  addMainRect() {
    this.c.beginPath();
    this.c.rect(
      this.x,
      this.y,
      this.width,
      !this.ratio ? this.height : this.height
    );
    this.c.strokeStyle = this.colors?.rect || "#f4f4f4";
    this.c.stroke();

    this.c.beginPath();
  }

  addResizer(side) {
    let x = 0;
    let y = 0;
    let shapeX = 0;
    let shapeY = 0;
    let width = this.pointSize;
    let height = this.pointSize;

    // Set positions
    switch (side) {
      case "tl":
        x = shapeX = this.x - this.pointSize / 2;
        y = shapeY = this.y - this.pointSize / 2;
        width = this.pointSize;
        height = this.pointSize;
        break;
      case "tr":
        x = shapeX = this.x + this.width - this.pointSize / 2;
        y = shapeY = this.y - this.pointSize / 2;
        width = this.pointSize;
        height = this.pointSize;

        break;
      case "bl":
        x = shapeX = this.x - this.pointSize / 2;
        y = shapeY = this.y + this.height - this.pointSize / 2;
        width = this.pointSize;
        height = this.pointSize;

        break;
      case "br":
        x = shapeX = this.x + this.width - this.pointSize / 2;
        y = shapeY = this.y + this.height - this.pointSize / 2;
        width = this.pointSize;
        height = this.pointSize;

        break;
      case "cl":
        x = shapeX = this.x - this.pointSize / 2;
        y = this.y + this.pointSize / 2;
        shapeY = this.y + this.height / 2 - this.pointSize / 2;
        height = this.height - this.pointSize;
        break;
      case "ct":
        x = this.x + this.pointSize / 2;
        shapeX = this.x + this.width / 2 - this.pointSize / 2;
        y = shapeY = this.y - this.pointSize / 2;
        width = this.width - this.pointSize;
        break;
      case "cr":
        x = shapeX = this.x + this.width - this.pointSize / 2;
        y = this.y + this.pointSize / 2;
        shapeY = this.y + this.height / 2 - this.pointSize / 2;
        height = this.height - this.pointSize;

        break;
      case "cb":
        x = this.x + this.pointSize / 2;
        y = shapeY = this.y + this.height - this.pointSize / 2;
        width = this.width - this.pointSize;
        shapeX = this.x + this.width / 2 - this.pointSize / 2;

        break;
      default:
        break;
    }

    this.resizers[side] = {
      x,
      y,
      width,
      height,
    };

    this.c.rect(shapeX, shapeY, this.pointSize, this.pointSize);
  }

  getHeight(length, ratio) {
    const height = length / Math.sqrt(Math.pow(ratio, 2));
    return height;
  }

  getWidth(length, ratio) {
    const width = length / Math.sqrt(1 / Math.pow(ratio, 2));
    return width;
  }

  // set mouse movement speed in x and y axis
  setSpeeds() {
    const sx = this.position.x - this.x;
    const sw = this.position.x - (this.x + this.width);
    const sy = this.position.y - this.y;
    const sh = this.position.y - (this.y + this.height);

    if (!this.selectedResizer) {
      this.speedX = sw;
      this.speedY = sh;
      return;
    }

    if (this.prevPos === this.x) this.stoppedSpeed = true;
    else this.stoppedSpeed = false;

    const is = (side) => this.selectedResizer?.includes(side);
    if (this.ratio) {
      if (is("l") || is("tl") || is("bl")) this.speedX = this.speedY = sx;
      if (is("r") || is("tr") || is("br")) this.speedX = this.speedY = sw;
      else if (is("t")) this.speedY = sy;
      else if (is("b")) this.speedY = sh;
    } else {
      if (is("l")) this.speedX = sx;
      if (is("r")) this.speedX = sw;
      if (is("t")) this.speedY = sy;
      if (is("b")) this.speedY = sh;
    }
    if (!is("l") && !is("r")) this.speedX = 0;
    if (!is("t") && !is("b")) this.speedY = 0;

    this.prevPos = this.x;
  }

  selector() {
    // The selecor rectangle
    this.addMainRect();

    // The selector resize points:
    this.sides.forEach((side) => {
      this.addResizer(side);
    });

    // If no colors provided
    if (!this.colors?.resizersFill && !this.colors?.resizersStroke) {
      this.c.fillStyle = "#ccc";
      this.c.fill();
      return;
    }
    // If fill color provided
    if (this.colors?.resizersFill) {
      this.c.fillStyle = this.colors?.resizersFill;
      this.c.fill();
    }
    // If stroke color provided
    if (this.colors?.resizersStroke) {
      this.c.strokeStyle = this.colors?.resizersStroke;
      this.c.stroke();
    }
  }

  detectSelectedPointSide() {
    let resizersArr = [];
    for (let item in this.resizers) {
      resizersArr.push({ ...this.resizers[item], side: item });
    }

    const sortedX = resizersArr.sort((a, b) => a.x - b.x);
    const finalSort = sortedX.sort((a, b) => a.y - b.y);

    const renamed = finalSort.map((item, index) => {
      item.side = this.sides[index];
      return item;
    });

    this.resizers = {};
    renamed.forEach((item) => {
      this.resizers[item.side] = item;
    });
  }

  // Rect moving overflow perventer
  preventMoveOverflow() {
    const x = this.position.x - this.offset.x;

    if (x < 0) {
      this.position.x = this.offset.x;
    } else if (x + this.width > this.canvas.width) {
      this.position.x = this.canvas.width - (this.width - this.offset.x);
    }

    const y = this.position.y - this.offset.y;
    if (y < 0) {
      this.position.y = this.offset.y;
    } else if (y + this.height > this.canvas.height) {
      this.position.y = this.canvas.height - (this.height - this.offset.y);
    }
  }

  // Drawing & Resizing overflow perventer
  preventOverflow() {
    this.setSpeeds();
    // When moving the resizer rectangle
    if (!this.selectedResizer && !this.drawing && !this.isUpdatingRatio) {
      this.preventMoveOverflow();
      return;
    }

    // Normal overflow check using mouse position
    const x = this.position.x;
    if (x < 0) {
      this.position.x = 0;
    } else if (x > this.canvas.width) {
      this.position.x = this.canvas.width;
    }

    if (this.position.y < 0) {
      this.position.y = 0;
    } else if (this.position.y > this.canvas.height) {
      this.position.y = this.canvas.height;
    }

    // To check overflow when mouse is not valid
    let dx = 0;
    let dy = 0;
    let dWidth = 0;
    let dHeight = 0;
    this.resizeHandler();

    // Left
    if (this.x < 0) {
      this.x = 0;
      !this.stopResizing.includes("l") && this.stopResizing.push("l");
    } else if (this.stopResizing.includes("l")) {
      const index = this.stopResizing.indexOf("l");
      if (index > -1) this.stopResizing.splice(index, 1);
    }

    // Right
    if (this.x + this.width > this.canvas.width) {
      this.x = this.canvas.width - this.width - 1;
      this.width++;
      dHeight = this.getHeight(1, this.ratio);
      if (this.selectedResizer === "ct") dy = -dHeight;
      this.stopResizing = "r";
    }

    // Top
    if (this.y < 0) {
      this.y = 0;
      !this.stopResizing.includes("t") && this.stopResizing.push("t");
    } else if (this.stopResizing.includes("t")) {
      const index = this.stopResizing.indexOf("t");
      if (index > -1) this.stopResizing.splice(index, 1);
    }

    // Bottom
    if (this.y + this.height > this.canvas.height) {
      this.y = this.canvas.height - this.height - 1;
      this.height++;
      dWidth = this.getWidth(1, this.ratio);
      if (this.selectedResizer === "cl") dx = -dWidth;
      this.stopResizing = "b";
    }

    // Top & Bottom
    if (this.height > this.canvas.height) {
      this.stopResizing = "t";
      this.y = 0;
      this.height = this.canvas.height;
      this.width = this.getWidth(this.height, this.ratio);
      dHeight =
        dWidth =
        dx =
        dy =
        this.dx =
        this.dy =
        this.dWidth =
        this.dHeight =
          0;
      // if (this.selectedResizer === "cl") {
      //   dx -= this.speedX;
      // }
    }

    // Left & Right
    if (this.width > this.canvas.width) {
      this.x = 0;
      this.width = this.canvas.width;
      this.height = this.getHeight(this.width, this.ratio);
      dWidth = dWidth = dx = dy = 0;
      if (this.selectedResizer === "ct") {
        dy -= this.speedY;
      }
    }

    this.x += dx;
    this.y += dy;
    this.width += dWidth;
    this.height += dHeight;
  }

  preventOverflow2() {
    // this.setSpeeds();
    // When moving the resizer rectangle
    // if (!this.selectedResizer && !this.drawing && !this.isUpdatingRatio) {
    //   this.preventMoveOverflow();
    //   return;
    // }

    // // Normal overflow check using mouse position
    // const x = this.position.x;
    // if (x < 0) {
    //   this.position.x = 0;
    // } else if (x > this.canvas.width) {
    //   this.position.x = this.canvas.width;
    // }

    // if (this.position.y < 0) {
    //   this.position.y = 0;
    // } else if (this.position.y > this.canvas.height) {
    //   this.position.y = this.canvas.height;
    // }

    if (this.x + this.dx < 0) {
      this.dx = this.x = 0;
      this.dHeight = this.dWidth = this.dy = this.dx = 0;
    }

    console.log(this.stoppedSpeed);
    if (this.y + this.height + this.dHeight > this.canvas.height) {
      this.height = this.canvas.height - this.y;
      this.dHeight = this.dWidth = this.dy = this.dx = 0;
    } else if (this.y + this.dy < 0) {
      this.dy = this.y = 0;
      this.dHeight = this.dWidth = this.dy = this.dx = 0;
      this.position.x = this.x;
    } else if (this.y + this.dy > this.canvas.height) {
      this.y = this.canvas.height;
      this.dHeight = this.dWidth = this.dy = this.dx = 0;
    }

    this.x += this.dx;
    this.y += this.dy;
    this.width += this.dWidth;
    this.height += this.dHeight;
  }

  // Draw the resizer
  drawHandler() {
    this.x = this.offset.pureX;
    this.y = this.offset.pureY;
    this.setSpeeds();

    if (this.ratio) {
      this.height += this.speedY;

      if (this.position.x > this.x && this.position.y > this.y) {
        this.width = this.getWidth(this.height, this.ratio);
      } else {
        this.width =
          this.position.x > this.x || this.position.y > this.y
            ? -this.getWidth(this.height, this.ratio)
            : this.getWidth(this.height, this.ratio);
      }
    } else {
      this.width += this.speedX;
      this.height += this.speedY;
    }
  }

  // Resize handlers
  left() {
    this.dx = this.speedX;
    this.dWidth = -this.dx;
  }

  right() {
    this.dWidth = this.speedX;
  }

  top() {
    this.dy = this.speedY;
    this.dHeight = -this.dy;
  }

  topRatio() {
    this.dy = this.getHeight(-this.dWidth, this.ratio);
    this.dHeight = -this.dy;
  }

  bottom() {
    this.dHeight = this.speedY;
  }

  bottomRatio() {
    this.dHeight = this.getHeight(this.dWidth, this.ratio);
  }

  heightRatio() {
    this.dHeight = this.getHeight(this.dWidth, this.ratio);
    this.dy = -this.dHeight / 2;
  }

  widthRatio() {
    this.dWidth = this.getWidth(this.dHeight, this.ratio);
    this.dx = -this.dWidth / 2;
  }

  // Resize
  resizeHandler() {
    this.setSpeeds();
    switch (this.selectedResizer) {
      // Corners
      case "tl":
        this.left();
        if (this.ratio) this.topRatio();
        else this.top();
        break;

      case "tr":
        this.right();
        if (this.ratio) this.topRatio();
        else this.top();
        break;

      case "bl":
        this.left();
        if (this.ratio) this.bottomRatio();
        else this.bottom();
        break;

      case "br":
        this.right();
        if (this.ratio) this.bottomRatio();
        else this.bottom();
        break;

      // Centers
      case "cl":
        this.left();
        if (this.ratio) this.heightRatio();
        break;

      case "ct":
        this.top();
        if (this.ratio) this.widthRatio();
        break;

      case "cr":
        this.right();
        if (this.ratio) this.heightRatio();
        break;

      case "cb":
        this.bottom();
        if (this.ratio) this.widthRatio();
        break;

      default:
        this.dWidth = 0;
        this.dHeight = 0;
        break;
    }

    this.preventOverflow2();
    // this.x += this.dx;
    // this.y += this.dy;
    // this.width += this.dWidth;
    // this.height += this.dHeight;
  }

  update(isUpdatingRatio) {
    this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // this.preventOverflow2();
    // Resize the selector
    // if (this.selectedResizer && !this.ratio) {
    if (this.selectedResizer) {
      this.resizeHandler();
    } else if (this.drawing) {
      this.drawHandler();
    } else if (!isUpdatingRatio && !this.selectedResizer && !this.drawing) {
      // Move the selector
      this.y = this.position.y - this.offset.y;
      this.x = this.position.x - this.offset.x;
    }

    // this.preventOverflow();
    this.selector();
    this.detectSelectedPointSide();
  }

  recHit(e, target) {
    if (target.width < 0) {
      if (target.height < 0) {
        if (
          e.offsetX >= target.x &&
          e.offsetX <= target.x + Math.abs(target.width) &&
          e.offsetY >= target.y - Math.abs(target.height) &&
          e.offsetY <= target.y + Math.abs(target.height)
        ) {
          return true;
        }
      } else {
        if (
          e.offsetX >= target.x - Math.abs(target.width) &&
          e.offsetX <= target.x &&
          e.offsetY >= target.y &&
          e.offsetY <= target.y + Math.abs(target.height)
        ) {
          return true;
        }
      }
    } else {
      if (target.height < 0) {
        if (
          e.offsetX >= target.x &&
          e.offsetX <= target.x + Math.abs(target.width) &&
          e.offsetY >= target.y - Math.abs(target.height) &&
          e.offsetY <= target.y + Math.abs(target.height)
        ) {
          return true;
        }
      } else {
        if (
          e.offsetX >= target.x &&
          e.offsetX <= target.x + Math.abs(target.width) &&
          e.offsetY >= target.y &&
          e.offsetY <= target.y + Math.abs(target.height)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  addRemoveEvents() {
    window.removeEventListener("pointerup", this.mouseUp);
    window.removeEventListener("pointermove", this.mouseMove);
    window.addEventListener("pointerup", this.mouseUp);
    window.addEventListener("pointermove", this.mouseMove);
  }

  mouseDown(e) {
    this.offset = {
      x: e.offsetX - this.x,
      y: e.offsetY - this.y,
      pureX: e.offsetX,
      pureY: e.offsetY,
    };

    let cursor = "crosshair";

    for (const item in this.resizers) {
      if (this.recHit(e, this.resizers[item])) {
        // Change cursor
        switch (item) {
          // Corners
          case "tl":
            cursor = this.cursors["tl"];
            break;
          case "tr":
            cursor = this.cursors["tr"];
            break;
          case "bl":
            cursor = this.cursors["bl"];
            break;
          case "br":
            cursor = this.cursors["br"];
            break;

          // Centers
          case "cl":
            cursor = this.cursors["cl"];
            break;
          case "ct":
            cursor = this.cursors["ct"];
            break;
          case "cr":
            cursor = this.cursors["cr"];
            break;
          case "cb":
            cursor = this.cursors["cb"];
            break;

          default:
            cursor;
            break;
        }

        // Set witch resizer is grabed
        this.selectedResizer = item;

        window.addEventListener("pointerup", this.mouseUp);
        window.addEventListener("pointermove", this.mouseMove);
      }

      // Change cursor
      this.cursor(cursor);
    }

    // Check if clicked point is the square
    if (this.recHit(e, this)) {
      cursor = "move";

      this.addRemoveEvents();
    } else {
      if (!this.selectedResizer) {
        this.addRemoveEvents();
        this.drawing = true;
      }
    }
  }

  mouseMove(e) {
    const target = this.canvas?.getBoundingClientRect();

    this.position = {
      x: e.target === this.canvas ? e.offsetX : e.offsetX - target.x,
      y: e.target === this.canvas ? e.offsetY : e.offsetY - target.y,
    };

    this.update();

    // Return data. it can be on mouse down too
    this.callback && this.callback(this.outPut());
  }

  mouseUp() {
    this.selectedResizer = null;
    this.drawing = false;
    this.cursor("crosshair");

    // Fix the position and size after drawing selector
    this.x = this.resizers["tl"].x + this.pointSize / 2;
    this.y = this.resizers["tl"].y + this.pointSize / 2;
    this.width = Math.abs(this.width);
    this.height = Math.abs(this.height);

    window.removeEventListener("pointerup", this.mouseUp);
    window.removeEventListener("pointermove", this.mouseMove);

    this.detectSelectedPointSide();
    this.selector();
  }

  hoverCursor(e) {
    let cursor = "crosshair";

    if (this.recHit(e, this)) {
      cursor = "move";
    }

    for (const item in this.resizers) {
      if (this.recHit(e, this.resizers[item])) {
        switch (item) {
          case "tl":
            cursor = this.cursors["tl"];
            break;
          case "tr":
            cursor = this.cursors["tr"];
            break;
          case "bl":
            cursor = this.cursors["bl"];
            break;
          case "br":
            cursor = this.cursors["br"];
            break;
          case "cl":
            cursor = this.cursors["cl"];
            break;
          case "ct":
            cursor = this.cursors["ct"];
            break;
          case "cr":
            cursor = this.cursors["cr"];
            break;
          case "cb":
            cursor = this.cursors["cb"];
            break;

          default:
            cursor;
            break;
        }
      }
    }
    // Change cursor
    this.cursor(cursor);
  }

  outPut() {
    let x, y, width, height;
    if (this.width < 0) {
      x = this.x - Math.abs(this.width);
      y = this.y;
    } else {
      x = this.x;
      y = this.y;
    }
    if (this.height < 0) {
      y = this.y - Math.abs(this.height);
    }
    width = Math.abs(this.width);
    height = Math.abs(this.height);
    x = x + this.canvas.getBoundingClientRect().left;
    y = y + this.canvas.getBoundingClientRect().top;

    return {
      x,
      y,
      width,
      height,
    };
  }

  centerize() {
    this.x = this.containerInfo.width / 2 - this.width / 2;
    this.y = this.containerInfo.height / 2 - this.height / 2;
    this.update(true);
  }

  setAspect(ratio) {
    if (ratio) {
      this.height = this.containerInfo.height / 2;
      this.width = this.getWidth(this.height, ratio);
      this.centerize();
    }

    this.update(true);
  }

  resize() {
    this.containerInfo = this.container.getBoundingClientRect();
    this.canvas.width = this.containerInfo.width;
    this.canvas.height = this.containerInfo.height;

    const cbCaller = () => this.callback && this.callback(this.outPut());

    if (this.width > this.containerInfo.width) {
      this.width = this.containerInfo.width;
      cbCaller();
    }

    if (this.height > this.containerInfo.height) {
      this.height = this.containerInfo.height;
      cbCaller();
    }

    this.update();
  }

  init(callback) {
    this.update();
    this.setAspect(this.ratio);

    this.container.addEventListener("pointerdown", this.mouseDown);

    window.addEventListener("mousemove", this.hoverCursor);

    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "1":
          this.ratio = 16 / 9;
          this.setAspect(this.ratio);
          break;

        case "2":
          this.ratio = 9 / 16;
          this.setAspect(this.ratio);
          break;

        case "3":
          this.ratio = 1 / 1;
          this.setAspect(this.ratio);
          break;

        case "4":
          this.ratio = null;
          this.setAspect(this.ratio);
          break;

        default:
          this.ratio = null;
          this.setAspect(this.ratio);
          break;
      }
    });

    this.callback = callback;
    this.callback && this.callback(this.outPut());
  }
}

export default Selector;
