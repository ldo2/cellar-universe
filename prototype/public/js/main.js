function cellEquals(a, b) {
    if (a === undefined || b === undefined) {
        return false;
    }
    return a.x == b.x && a.y == b.y;
}

var Renderer = function(grid) {
    var self = this;

    this.hoveredCell = undefined;
    this.lastX = 0;
    this.lastY = 0;
    this.flaggedCells = [];

    this.grid = grid;
  
    this.spacing = 1;
    this.cellSize = 12;

    this.width = 80;
    this.height = 40; 

    this.pixelWidth = this.width * (this.cellSize + this.spacing) + 1;
    this.pixelHeight = this.height * (this.cellSize + this.spacing) + 1;

    this.placeCellsButton = document.getElementById('place-cells');

    this.canvas = document.getElementById('view');
    this.context = this.canvas.getContext('2d')

    // prevent text selection when interacting with the canvas
    this.canvas.addEventListener('selectstart', function(e) {
      event.preventDefault();
    });

    // keep track of the mouse position on the canvas
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this), false);

    // repaint the hovered cell when the mouse leaves the canvas
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this), false);

    // make the cell living when clicked
    this.canvas.addEventListener('click', this.handleClick.bind(this), false);

    // attempt to place flagged cells when the place cells button is pushed
    this.placeCellsButton.addEventListener('click', this.handlePlaceCells.bind(this));

    this.canvas.width = this.pixelWidth;
    this.canvas.height = this.pixelHeight;
    this.canvas.parentElement.style.width = this.pixelWidth + 'px';
    this.canvas.parentElement.style.height = this.pixelHeight + 'px';

    this.drawGrid();
}

Renderer.prototype.clear = function() {
    this.context.clearRect(0, 0, this.pixelWidth, this.pixelHeight);
}

Renderer.prototype.render = function() {
    this.clear();
    this.drawGrid();

    var i, j;
    for (i = 0; i < this.width; i++) {
        for (j = 0; j < this.height; j++) {
            this.drawCell({ x: i, y: j, alive: this.grid[j * this.width + i] == 1});
        }
    }

    for (i = 0; i < this.flaggedCells.length; i++) {
        this.drawFramedCell(this.flaggedCells[i]);
    }
    
    if (this.hoveredCell !== undefined) {
       this.drawFramedCell(this.hoveredCell);
    }
}

Renderer.prototype.drawGrid = function() {
    var i,
      context = this.context,
      cellSize = this.cellSize,
      spacing = this.spacing;

    context.lineWidth = spacing;
    context.strokeStyle = 'rgba(0,0,0,1)';
 
   for (i = 0; i < this.height; i++) {
        context.beginPath();
        context.moveTo(0, i * (cellSize + spacing) + 0.5);
        context.lineTo(this.pixelWidth, i * (cellSize + spacing) + 0.5);
        context.stroke();
    }

    for (i = 0; i < this.width; i++) {
        context.beginPath();
        context.moveTo(i * (cellSize + spacing) + 0.5, 0);
        context.lineTo(i * (cellSize + spacing) + 0.5, this.pixelHeight);
        context.stroke();
    }

    // finish the border
    context.beginPath();
    context.moveTo(this.pixelWidth - 0.5, 0);
    context.lineTo(this.pixelWidth - 0.5, this.pixelHeight);
    context.stroke();

    context.beginPath();
    context.moveTo(0, this.pixelHeight - 0.5);
    context.lineTo(this.pixelWidth - 0.5, this.pixelHeight - 0.5);
    context.stroke();
}

Renderer.prototype.drawCell = function(cell) {
    // return if the cell was made undefined by handleMouseLeave
    if (cell === undefined) {
      return;
    }

    var context = this.context,
      cellSize = this.cellSize,
      spacing = this.spacing,
      x1 = cell.x * (cellSize + spacing) + 1,
      y1 = cell.y * (cellSize + spacing) + 1,
      color;

    if (!cell.alive) {
      context.fillStyle = 'rgba(255, 255, 255, 1)';
    } else {
      context.fillStyle = 'rgba(105, 155, 205, 1)';      
    }

    context.fillRect(x1, y1, cellSize, cellSize);
}

Renderer.prototype.drawFramedCell = function(cell) {
    if (cell === undefined) {
      return;
    }

    var context = this.context,
      cellSize = this.cellSize,
      spacing = this.spacing,
      x1 = cell.x * (cellSize + spacing) + 1.5,
      y1 = cell.y * (cellSize + spacing) + 1.5;

    context.lineWidth = 1.5;
    context.strokeStyle = 'rgba(105, 205, 155, 1)';
    context.strokeRect(x1 + .5, y1 + .5, cellSize - 2, cellSize - 2);
};

Renderer.prototype.redrawCell = function(cell, flagged) {
    if (cell === undefined) {
        return;
    }

    this.drawCell({ x: cell.x, y: cell.y, 
      alive: this.grid[cell.y * this.width + cell.x] == 1});
    if (flagged) {
       this.drawFramedCell(cell);
    }
};

Renderer.prototype.getCellIndexFromPosition = function(x, y) {
    var cellSize = this.cellSize,
      spacing = this.spacing,
      cellX = Math.floor((x - 1) / (cellSize + spacing)),
      cellY = Math.floor((y - 1) / (cellSize + spacing));

    if (cellY === this.height) {
      cellY--;
    }

    return { x: cellX, y: cellY };
};

Renderer.prototype.isFlaggedCell = function(cell) {
    for (var i = 0; i < this.flaggedCells.length; i++) {
        if (cellEquals(cell, this.flaggedCells[i])) {
            return true;
        }
    }
    return false;
};


Renderer.prototype.handleClick = function(event) {
    var clickedCell = this.getCellIndexFromPosition(this.lastX, this.lastY);

    for (var i = 0; i < this.flaggedCells.length; i++) {
        if (cellEquals(clickedCell, this.flaggedCells[i])) {
            this.flaggedCells.splice(i, 1);
            this.redrawCell(clickedCell, false);
            return;
        }
    }

    // if it isn't a flagged cell, and you have cells left to place
    this.flaggedCells.push(clickedCell);
    this.redrawCell(clickedCell, true);
};

Renderer.prototype.handleMouseLeave = function(event) {
    var oldCell = this.hoveredCell;
    this.hoveredCell = undefined;
    this.redrawCell(oldCell, this.isFlaggedCell(oldCell));
};

Renderer.prototype.handleMouseMove = function(event) {
    if (event.offsetX && event.offsetY) {
        this.lastX = event.offsetX;
        this.lastY = event.offsetY;
    } else {
        var rect = this.canvas.getBoundingClientRect();
        this.lastX = event.pageX - rect.left - window.scrollX;
        this.lastY = event.pageY - rect.top - window.scrollY;
    }

    var oldCell = this.hoveredCell;
    this.hoveredCell = this.getCellIndexFromPosition(this.lastX, this.lastY);

    this.redrawCell(oldCell, this.isFlaggedCell(oldCell));
    this.drawFramedCell(this.hoveredCell);
};

Renderer.prototype.handlePlaceCells = function(event) {
    event.preventDefault();

    var cellsToPlace = this.flaggedCells;
    this.flaggedCells = [];

    var http_request = new XMLHttpRequest();
    http_request.open("POST", "place", true);
    http_request.send(JSON.stringify(cellsToPlace));
};

function updateGrid(renderer) {
   var http_request = new XMLHttpRequest();
   http_request.onreadystatechange  = function() {
      if (http_request.readyState == 4) {
        renderer.grid = JSON.parse(http_request.responseText);
        renderer.render();
        updateGrid(renderer);
      }
   }
   http_request.open("GET", "grid.json", true);
   http_request.send();
}

window.onload = function() {
    // main function

    var gridSize = 80 * 40;
    var grid = new Array(gridSize);
    for (var i = 0; i < gridSize; i++) {
        grid[i] = Math.random() > 0.75;
    }

    var renderer = new Renderer(grid);
    renderer.render();

    updateGrid(renderer);
}

