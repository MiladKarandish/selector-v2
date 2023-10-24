class Drawer {
  constructor(img, container, selector) {
    // Selector
    this.selectorInstance = selector;

    // Canvas
    this.canvas = document.createElement("canvas");
    this.c = this.canvas.getContext("2d");

    // Container
    this.container = container;
    this.containerInfo = container.getBoundingClientRect();

    // Image
    this.img = img;
    this.imgInfo = this.img.getBoundingClientRect();

    // Aspect ratio
    this.xRatio = this.img.naturalWidth / this.imgInfo.width;
    this.yRatio = this.img.naturalHeight / this.imgInfo.height;

    // Event handlers
    this.zoom = this.zoom.bind(this);
    this.resize = this.resize.bind(this);

    // Zoom
    this.zoomDir = null;
    this.zoomDx = 50;

    // Flip
    this.flipX = false;
    this.flipY = false;

    // Initiate size of canvas
    this.canvas.width = this.containerInfo.width;
    this.canvas.height = this.containerInfo.height;

    // Selector data
    this.data = null;
  }

  zoom() {
    if (this.zoomDir && this.selectorInstance) {
      let width = container.getBoundingClientRect().width;
      if (this.zoomDir > 0) {
        this.zoomDx++;
        container.style.width = width + this.zoomDx + "px";
      } else {
        this.zoomDx--;
        container.style.width = width - this.zoomDx + "px";
      }
      this.xRatio = this.img.naturalWidth / this.containerInfo.width;
      this.yRatio = this.img.naturalHeight / this.containerInfo.height;

      this.selectorInstance.resize();
      this.resize();
    }
  }

  flip(e) {}

  saveData(data) {
    this.resize();

    this.data = data;
  }

  draw(data) {
    this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.width = data.width * this.xRatio;
    this.canvas.height = data.height * this.yRatio;

    // X and Y flip
    let fy, fx;

    // Check and do the x flip
    let rightDis;
    let left;
    let selectorWidth;
    if (this.flipX) {
      rightDis = data.x + data.width - this.containerInfo.width;
      left = rightDis * -1;
      selectorWidth = data.width * -1;
      fx = -1;
    } else {
      left = data.x - this.imgInfo.left;
      selectorWidth = data.width;
      fx = 1;
    }

    // Check and do the y flip
    let bottomDis;
    let top;
    let selectorHeight;
    if (this.flipY) {
      bottomDis = data.y + data.height - this.containerInfo.height;
      top = bottomDis * -1;
      selectorHeight = data.height * -1;
      fy = -1;
    } else {
      top = data.y - this.imgInfo.top;
      selectorHeight = data.height;
      fy = 1;
    }

    this.c.beginPath();
    this.c.scale(fx, fy);
    // Draw the cropped image
    this.c.drawImage(
      this.img,
      left * this.xRatio,
      top * this.yRatio,
      data.width * this.xRatio,
      data.height * this.yRatio,
      0,
      0,
      selectorWidth * this.xRatio,
      selectorHeight * this.yRatio
    );
    this.c.closePath();
  }

  resize() {
    this.containerInfo = container.getBoundingClientRect();
    this.imgInfo = this.img.getBoundingClientRect();

    this.canvas.width = this.containerInfo.width;
    this.canvas.height = this.containerInfo.height;
    this.xRatio = this.img.naturalWidth / this.imgInfo.width;
    this.yRatio = this.img.naturalHeight / this.imgInfo.height;
  }

  download() {
    this.draw(this.data);

    const link = document.createElement("a");
    link.download = "filename.png";
    link.href = this.canvas.toDataURL();
    link.click();
  }

  init() {
    if (this.selectorInstance) {
      const onZoom = (e) => {
        this.zoomDir = e.wheelDelta;
        this.zoom();
      };

      window.removeEventListener("wheel", onZoom);
      window.addEventListener("wheel", onZoom);
    }
  }
}

export default Drawer;
