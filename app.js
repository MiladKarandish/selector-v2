import Selector from "./selector.js";
import Cutter from "./cutter.js";

const canvas = document.getElementById("selector");
const container = document.getElementById("container");
const image = document.getElementById("crop-target");

const colors = {
  // resizersStroke: '#333',
  resizersFill: "#fff",
  rect: "#fff",
};

// Selector
const selector = new Selector({
  container,
  canvas,
  colors,
  lineWidth: 1,
  resizersSize: 10,
  aspectRatio: 9 / 16,
});

// Cutter
const cutter = new Cutter(image, container);

const callback = (data) => {
  cutter.saveData(data);
};

cutter.init();
selector.init(callback);

document.getElementById("download").addEventListener("click", () => {
  cutter.download();
});
