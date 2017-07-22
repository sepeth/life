let ctx = canvas.getContext('2d');

// Options
let rowCount = 50;
let colCount = 50;
let cellWidth = 10;

// Set canvas size
canvas.width = rowCount * cellWidth;
canvas.height = colCount * cellWidth;


function parseMap(map) {
    let lines = map.split('\n').filter(l => l.trim() != "");
    let ret = [];
    lines.forEach((line, idx) => {
        line = line.trim();
        for (var i = 0; i < line.length; i++) {
            ret.push(line[i] == "X" ? 1 : 0);
        }
        for (; i < colCount; i++) {
            ret.push(0);
        }
    });
    var missingLines = (rowCount - lines.length) * colCount;
    for (var i = 0; i < missingLines; i++) {
        ret.push(0);
    }
    return ret;
}


function rAFInterval(fn, delay) {
    var start = window.performance.now();
    var handle = {};
    function loop(time) {
        handle.value = requestAnimationFrame(loop);
        if (time - start >= delay) {
            fn();
            start = window.performance.now();
        }
    }
    handle.value = requestAnimationFrame(loop);
    return handle;
}


var Canvas = {
    clear: function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    },

    drawGrid: function() {
        // Set the style of the grid lines
        ctx.strokeStyle = '#40e0d0';
        ctx.lineWidth = 0.25;

        // Draw vertical lines
        for (var i = cellWidth; i < canvas.width; i += cellWidth) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.closePath();
            ctx.stroke();
        }

        // Draw horizontal lines
        for (var i = cellWidth; i < canvas.height; i += cellWidth) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.closePath();
            ctx.stroke();
        }
    },

    fill: function (x, y) {
        ctx.fillStyle = '#40e0d0';
        ctx.fillRect(x * cellWidth, y * cellWidth, cellWidth, cellWidth);
    },

    clearCell: function(x, y) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(x * cellWidth + .25, y * cellWidth + .25, cellWidth - .5, cellWidth - .5);
    }
};


class World {
    constructor(map) {
        this.map = map;
    }

    draw() {
        for (var y = 0; y < rowCount; y++)
            for (var x = 0; x < colCount; x++)
                if (this.map[y * colCount + x])
                    Canvas.fill(x, y);
    }

    checkCell(x, y) {
        if (x < 0 || x >= colCount || y < 0 || y >= rowCount)
            return 0;
        return this.map[y * colCount + x];
    }

    aliveNeighbour(x, y) {
        return (
            this.checkCell(x-1, y-1) +
            this.checkCell(x,   y-1) +
            this.checkCell(x+1, y-1) +

            this.checkCell(x-1, y) +
            this.checkCell(x+1, y) +

            this.checkCell(x-1, y+1) +
            this.checkCell(x,   y+1) +
            this.checkCell(x+1, y+1)
        );
    }

    tick() {
        var newMap = this.map.slice();

        for (var y = 0; y < rowCount; y++)
            for (var x = 0; x < colCount; x++) {
                var nc = this.aliveNeighbour(x, y);
                if (this.map[y * colCount + x]) {  // alive
                    // any live cell with fewer than two live neighbours dies, as if caused by underpopulation.
                    if (nc < 2)
                        newMap[y * colCount + x] = 0;
                    // any live cell with more than three live neighbours dies, as if by overpopulation.
                    else if (nc > 3)
                        newMap[y * colCount + x] = 0;
                    // any live cell with two or three live neighbours lives on to the next generation.
                } else {  // dead
                    // any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
                    if (nc == 3)
                        newMap[y * colCount + x] = 1;
                }
            }

        this.map = newMap;
    }

    getMap() {
        return this.map.slice();
    }

    setMap(map) {
        this.map = map.slice();
    }
}


let map = parseMap(`
________________________________________________
________________________________________________
________________________________________________
________________________________________________
________________________________________________
_______________X________X_______________________
____X_________XXX______XX_______________________
___X_X_________X______XXX_X_____________________
____X___________X_______________________________
________________________________________________
________________________________________________
_________XX_____________________________________
_________XX_____________________________________
________________________________________________
_____X__________________________________________
____X_X_____X_____________________X_____________
___X___X____X___________________________________
____X_______X___________________________________
_____X__________________________________________
________________________________________________
______________________________X_X_______________
_______________________________X________________
______________________________X_________________
________________________________________________
__X_____________________________________________
_XXX_____X______________________________________
__X_____XXXX____________________________________
__X_XX__________________________________________
_XXX____________________________________________
__X_____________________________________________
_______________________________________X________
_____________________________________XX_XX______
____________________________________XX___XX_____
_____________________________________XXXXX______
________________________________X_______________
________________________________X_X_____________
________________________________XX______________
________________________________X_______________
________________________________________________
________________________________________________
`);


class App {
    constructor() {
        this.world = new World(map);  // Game of life implementation
        this.editMode = false;        // is in edit mode or not
        this.newMap = null;           // copy of the map if we are in edit mode
        this.editFill = true;         // fill color, true == fill, false == clear
        this.mouseDown = false;       // mouse is pressed while moving
        this.prevX = -1;              // previous mouse coordinations
        this.prevY = -1;

        btnPlay.addEventListener('click', _evt => {
            btnPlay.style.display = 'none';
            btnPause.style.display = 'inline';
            if (this.editMode) {
                this.editMode = false;
                btnEditMap.disabled = false;
                this.world.setMap(this.newMap);
                this.newMap = null;
            }
            this.start();
        });

        btnPause.addEventListener('click', _evt => {
            this.stop();
            btnPlay.style.display = 'inline';
            btnPause.style.display = 'none';
        });

        btnEditMap.addEventListener('click', _evt => {
            this.stop();
            this.editMode = true;
            btnEditMap.disabled = true;
            this.newMap = this.world.getMap();
            btnPlay.style.display = 'inline';
            btnPause.style.display = 'none';
        });

        canvas.addEventListener('mousemove', evt => {
            if (!this.editMode)
                return;
            var newX = Math.floor(evt.offsetX / 10);
            var newY = Math.floor(evt.offsetY / 10);
            if (this.mouseDown) {
                this.colorCell(newX, newY);
                this.prevX = -1;
                this.prevY = -1;
            } else {
                if (this.prevX != newX || this.prevY != newY) {
                    if (this.prevX != -1 && this.prevY != -1) {
                        this.restoreCell(this.prevX, this.prevY);
                    }
                    this.flipCell(newX, newY);
                    this.prevX = newX;
                    this.prevY = newY;
                }
            }
        });

        canvas.addEventListener('mouseout', _evt => {
            if (!this.editMode)
                return;
            if (this.prevX != -1 && this.prevY != -1) {
                Canvas.clearCell(this.prevX, this.prevY);
            }
            this.prevX = -1;
            this.prevY = -1;
        });

        canvas.addEventListener('mousedown', evt => {
            if (!this.editMode)
                return;
            this.mouseDown = true;
            var newX = Math.floor(evt.offsetX / 10);
            var newY = Math.floor(evt.offsetY / 10);
            this.editFill = !this.newMap[newY * colCount + newX];
            this.colorCell(newX, newY);
        });

        canvas.addEventListener('mouseup', evt => {
            if (!this.editMode)
                return;
            this.mouseDown = false;
        });
    }

    colorCell(x, y) {
        if (this.editFill) {
            Canvas.fill(x, y);
            this.newMap[y * colCount + x] = 1;
        } else {
            Canvas.clearCell(x, y);
            this.newMap[y * colCount + x] = 0;
        }
    }

    flipCell(x, y) {
        if (this.newMap[y * colCount + x]) {
            Canvas.clearCell(x, y);
        } else {
            Canvas.fill(x, y);
        }
    }

    restoreCell(x, y) {
        if (this.newMap[y * colCount + x]) {
            Canvas.fill(x, y);
        } else {
            Canvas.clearCell(x, y);
        }
    }

    tick() {
        this.world.tick();
        this.draw();
    }

    draw() {
        Canvas.clear();
        Canvas.drawGrid();
        this.world.draw();
    }

    start() {
        this.draw();
        this.rafHandle = rAFInterval(() => this.tick(), 100);
    }

    stop() {
        window.cancelAnimationFrame(this.rafHandle.value);
    }
}


new App().start();
