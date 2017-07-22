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


class Grid {
    constructor(canvas, cellWidth) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellWidth = cellWidth;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw() {
        var ctx = this.ctx;
        this.clear();

        // Set the style of the grid lines
        ctx.strokeStyle = '#40e0d0';
        ctx.lineWidth = .25;

        // Draw vertical lines
        for (var i = this.cellWidth; i < this.canvas.width; i += this.cellWidth) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.closePath();
            ctx.stroke();
        }

        // Draw horizontal lines
        for (var i = this.cellWidth; i < this.canvas.height; i += this.cellWidth) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.closePath();
            ctx.stroke();
        }
    }

    fillCell(x, y) {
        this.ctx.fillStyle = '#40e0d0';
        this.ctx.fillRect(
            x * this.cellWidth,
            y * this.cellWidth,
            this.cellWidth,
            this.cellWidth
        );
    }

    clearCell(x, y) {
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(
            x * this.cellWidth + .25,
            y * this.cellWidth + .25,
            this.cellWidth - .5,
            this.cellWidth - .5
        );
    }
};


class World {
    constructor(map) {
        this.map = map;
    }

    aliveNeighbour(x, y) {
        return (
            this.map.get(x-1, y-1) +
            this.map.get(x,   y-1) +
            this.map.get(x+1, y-1) +

            this.map.get(x-1, y) +
            this.map.get(x+1, y) +

            this.map.get(x-1, y+1) +
            this.map.get(x,   y+1) +
            this.map.get(x+1, y+1)
        );
    }

    tick() {
        var newMap = this.map.copy();

        for (var y = 0; y < this.map.rowCount; y++)
            for (var x = 0; x < this.map.colCount; x++) {
                var nc = this.aliveNeighbour(x, y);
                if (this.map.get(x, y)) {  // alive
                    // any live cell with fewer than two live neighbours dies, as if caused by underpopulation.
                    if (nc < 2)
                        newMap.erase(x, y);
                    // any live cell with more than three live neighbours dies, as if by overpopulation.
                    else if (nc > 3)
                        newMap.erase(x, y);
                    // any live cell with two or three live neighbours lives on to the next generation.
                } else {  // dead
                    // any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
                    if (nc == 3)
                        newMap.fill(x, y);
                }
            }

        this.map = newMap;
    }

    getMap() {
        return this.map.copy();
    }

    setMap(map) {
        this.map = map.copy();
    }
}


class Map {
    constructor(rowCount, colCount, arr) {
        if (arr === undefined) {
            arr = new Array(rowCount * colCount).fill(0);
        }
        this.data = arr;
        this.rowCount = rowCount;
        this.colCount = colCount;
    }

    static fromString(rowCount, colCount, mapStr) {
        let lines = mapStr.split('\n').filter(l => l.trim() != "");
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
        return new Map(rowCount, colCount, ret);
    }

    copy() {
        return new Map(this.rowCount, this.colCount, this.data.slice());
    }

    fill(x, y) {
        this.data[y * this.colCount + x] = 1;
    }

    erase(x, y) {
        this.data[y * this.colCount + x] = 0;
    }

    get(x, y) {
        if (x < 0) {
            x = x + this.colCount;
        } else if (x >= this.colCount) {
            x = x % this.colCount;
        }
        if (y < 0) {
            y = y + this.rowCount;
        } else if (y >= this.rowCount) {
            y = y % this.rowCount;
        }
        return this.data[y * this.colCount + x];
    }
}


class App {
    constructor(options) {
        var canvas = options.canvas;

        // Set canvas size
        canvas.width = options.colCount * options.cellWidth;
        canvas.height = options.rowCount * options.cellWidth;

        var initialMap = Map.fromString(
            options.rowCount,
            options.colCount,
            options.initialMapStr
        );

        this.grid = new Grid(canvas, options.cellWidth);  // Responsible for drawing grid and cells
        this.world = new World(initialMap);               // Game of life implementation
        this.editMode = false;                            // is in edit mode or not
        this.newMap = null;                               // copy of the map if we are in edit mode
        this.editFill = true;                             // fill color, true == fill, false == clear
        this.mouseDown = false;                           // is mouse pressed while moving
        this.prevX = -1;                                  // previous mouse coordinations
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
            this.switchToEditMode();
            this.newMap = this.world.getMap();
        });

        btnClear.addEventListener('click', _evt => {
            this.switchToEditMode();
            // Create an empty map
            this.newMap = new Map(options.rowCount, options.colCount);
            // Render an empty grid
            this.grid.draw();
        });

        canvas.addEventListener('mousemove', evt => {
            if (!this.editMode)
                return;
            var newX = Math.floor(evt.offsetX / options.cellWidth);
            var newY = Math.floor(evt.offsetY / options.cellWidth);
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
                this.grid.clearCell(this.prevX, this.prevY);
            }
            this.prevX = -1;
            this.prevY = -1;
        });

        canvas.addEventListener('mousedown', evt => {
            if (!this.editMode)
                return;
            this.mouseDown = true;
            var newX = Math.floor(evt.offsetX / options.cellWidth);
            var newY = Math.floor(evt.offsetY / options.cellWidth);
            this.editFill = !this.newMap.get(newX, newY);
            this.colorCell(newX, newY);
        });

        canvas.addEventListener('mouseup', evt => {
            if (!this.editMode)
                return;
            this.mouseDown = false;
        });
    }

    switchToEditMode() {
        this.stop();
        this.editMode = true;
        btnEditMap.disabled = true;
        btnPlay.style.display = 'inline';
        btnPause.style.display = 'none';
    }

    colorCell(x, y) {
        if (this.editFill) {
            this.grid.fillCell(x, y);
            this.newMap.fill(x, y);
        } else {
            this.grid.clearCell(x, y);
            this.newMap.erase(x, y);
        }
    }

    flipCell(x, y) {
        if (this.newMap.get(x, y)) {
            this.grid.clearCell(x, y);
        } else {
            this.grid.fillCell(x, y);
        }
    }

    restoreCell(x, y) {
        if (this.newMap.get(x, y)) {
            this.grid.fillCell(x, y);
        } else {
            this.grid.clearCell(x, y);
        }
    }

    tick() {
        this.world.tick();
        this.draw();
    }

    draw() {
        this.grid.draw();
        var map = this.world.getMap();
        for (var y = 0; y < map.rowCount; y++)
            for (var x = 0; x < map.colCount; x++)
                if (map.get(x, y))
                    this.grid.fillCell(x, y);
    }

    start() {
        this.draw();
        this.rafHandle = rAFInterval(() => this.tick(), 100);
    }

    stop() {
        window.cancelAnimationFrame(this.rafHandle.value);
    }
}


let initialMapStr = `
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________X_______________________________________
____________________________X_X_______________________________________
__________________XX______XX____________XX____________________________
_________________X___X____XX____________XX____________________________
______XX________X_____X___XX__________________________________________
______XX________X___X_XX____X_X_______________________________________
________________X_____X_______X_______________________________________
_________________X___X________________________________________________
__________________XX__________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
______________________________________________________________________
________________________________________________________________XX____
________________________________________________________________XX____
______________________________________________________________________
`;


new App({
    canvas,
    initialMapStr,
    rowCount: 50,
    colCount: 70,
    cellWidth: 10
}).start();
