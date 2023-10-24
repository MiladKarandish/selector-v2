# Cutter-v2

## npm: https://www.npmjs.com/package/mil-selector

## How to use:

> **container**: the container of the resizer. resizer can't overflow the contianer.

> **canvas**: you can provide a canvas element. it is optional if not provided it'll create one and append it to the contiainer.

> **x**: the initial x position of the resizer.

> **y**: the initial y position of the resizer.

> **width**: the initial width of the resizer.

> **height**: the initial height of the resizer.

> **lineWidth**: the thickness of the resizer boundries.

> **resizersSize**: the size of the resizer points.

> **colors**: you can controll the color of the resizer and resizing point using this property.

const colors = {
resizersStroke: "#fff",
resizersFill: "#fff",
rect: "#fff",
}

const selector = new Selector(
container,
canvas,
x,
y,
width,
height,
lineWidth: 1,
resizersSize: 10,
colors
)
