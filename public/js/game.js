let canvas, ctx;
let lenCoeff = 0.8;
let widthCoeff = 0.8;
let angleCoeff = Math.PI / 4;
let angleStd = Math.PI / 16;
let lenStd = 0.05;
let widthStd = 0.05;
let startWidth = 10;
let startLength = 100;
let seed = 61;
let numTrees = 3;
let trees = [];
let drawShadows = false;
let branchColor = "#4d2806";
let leafColor = "green";
let doDrawLeaves = true;

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

let moonLoc = new Point(100, 100);

window.onload = function () {
  //get the canvas element
  canvas = document.getElementById("game");
  //get the 2d context
  ctx = canvas.getContext("2d");
  //set the canvas width and height
  canvas.width = 1200;
  canvas.height = 800;

  const renderScene = () => {
    trees = [];
    Math.seedrandom(seed);
    resetBackground();
    genTrees();
    drawTrees();
    drawFog();
  };

  //set on input listeners
  let seedElt = window.document.getElementById("seed");

  let fancyRender = window.document.getElementById("generate");
  fancyRender.addEventListener("click", () => {
    drawShadows = true;
    renderScene();
    drawShadows = false;
  });

  let leafColorElt = window.document.getElementById("leafColor");
  leafColorElt.addEventListener("input", (e) => {
    leafColor = e.target.value;
    renderScene();
  });

  let branchColorElt = window.document.getElementById("branchColor");
  branchColorElt.addEventListener("input", (e) => {
    branchColor = e.target.value;
    renderScene();
  });

  let leavesElt = window.document.getElementById("leaves");
  leavesElt.addEventListener("input", (e) => {
    //check if the checkbox is checked
    doDrawLeaves = e.target.checked;
    renderScene();
  });

  let downloadButton = window.document.getElementById("download");
  downloadButton.addEventListener("click", () => {
    //download the canvas as an image
    let link = document.createElement("a");
    link.download = "treeScene.png";
    link.href = canvas.toDataURL();
    link.click();
  });

  let startLengthElt = window.document.getElementById("startLength");
  startLengthElt.addEventListener("input", (e) => {
    startLength = e.target.value;
    renderScene();
  });

  let lenCoeffElt = window.document.getElementById("lenCoeff");
  lenCoeffElt.addEventListener("input", (e) => {
    lenCoeff = e.target.value;
    renderScene();
  });



  seedElt.oninput = (event) => {
    seed = event.target.value;
    renderScene();
  };

  renderScene();

  //add a key listener
  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      seed = Math.floor(Math.random() * 100000);
      seedElt.value = seed;
      renderScene();
    }
  });
};

const drawFog = () => {
  //add a grey fog effect using gradient to the bottom of the canvas
  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0.25, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,.25)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const resetBackground = () => {
  //draw shadow
  if (drawShadows) {
    ctx.shadowColor = "black";
    ctx.shadowBlur = 50;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = "black";
  } else {
    ctx.shadowColor = "none";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = "white";
  }
  //set the canvas background color
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //create a "moon" in the corner
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.ellipse(moonLoc.x, moonLoc.y, 50, 50, 0, 0, 2 * Math.PI);
  ctx.fill();

  drawStars();
};

const genTrees = () => {
  for (let i = 0; i < numTrees; i++) {
    let tree = new Tree(
      new Point(Math.random() * canvas.width, canvas.height),
      startLength,
      -Math.PI / 2,
      startWidth
    );
    trees.push(tree);
  }
};

const drawTrees = () => {
  trees.forEach(async (tree) => {
    tree.draw();
  });
};

const drawStars = () => {
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      Math.random() * 2,
      Math.random() * 2,
      0,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }
};

const getNormalDist = (mean, std) => {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // to avoid log(0)
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  num = num * std + mean;
  return num;
};

class Branch {
  constructor(start, length, angle, stroke) {
    this.start = start;
    this.length = length;
    this.angle = angle;
    this.stroke = stroke;

    this.end = new Point(
      this.start.x + this.length * Math.cos(this.angle),
      this.start.y + this.length * Math.sin(this.angle)
    );

    this.branches = [];
    if (stroke < 1) return;

    for (let i = 0; i < 2; i++) {
      let newAngle =
        getNormalDist(this.angle, angleStd) + angleCoeff * (i - 0.5);
      let newLength = this.length * getNormalDist(lenCoeff, lenStd);
      let newStroke = this.stroke * getNormalDist(widthCoeff, widthStd);
      this.branches.push(new Branch(this.end, newLength, newAngle, newStroke));
    }
  }

  drawLeaf() {
    ctx.strokeStyle = leafColor;
    ctx.fillStyle = leafColor;
    //draw an oval from the start point to the end point at the correct angle
    ctx.beginPath();
    //set angle
    ctx.translate(this.end.x, this.end.y);
    ctx.rotate(this.angle);
    //draw oval
    ctx.ellipse(0, 0, this.length, this.stroke * 2, 0, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.fill();
    //reset angle
    ctx.rotate(-this.angle);
    ctx.translate(-this.end.x, -this.end.y);
  }

  drawBranch() {
    ctx.strokeStyle = branchColor;

    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);
    ctx.lineWidth = this.stroke;
    ctx.stroke();
  }

  draw() {
    if (this.length < 20 && doDrawLeaves) {
      //leaf
      this.drawLeaf();
    } else {
      //branch
      this.drawBranch();
    }

    for (let branch of this.branches) {
      branch.draw();
    }
  }
}

class Tree {
  constructor(start, length, angle, stroke) {
    this.start = start;
    this.length = length;
    this.angle = angle;
    this.stroke = stroke;
    this.root = new Branch(this.start, this.length, this.angle, this.stroke);
  }

  draw() {
    this.root.draw();
  }
}
