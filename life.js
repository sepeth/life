let ctx = canvas.getContext('2d');

// Options
let rowCount = 50;
let colCount = 50;
let cellWidth = 10;

// Set canvas size
canvas.width = rowCount * cellWidth;
canvas.height = colCount * cellWidth;


function parseMap(map) {
    let lines = map.split('\n');
    let ret = [];
    lines.forEach((line, idx) => {
        line = line.trim();
        if (line == "")
            return;
        for (var i = 0; i < line.length; i++) {
            ret.push(line[i] == "X" ? 1 : 0);
        }
        for (; i < colCount; i++) {
            ret.push(0);
        }
    });
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
        this.world = new World(map);

        btnPlay.addEventListener('click', _evt => {
            this.start();
            this.editMode = false;
            btnPlay.style.display = 'none';
            btnPause.style.display = 'inline';
        });

        btnPause.addEventListener('click', _evt => {
            this.stop();
            btnPlay.style.display = 'inline';
            btnPause.style.display = 'none';
        });
    }

    tick() {
        Canvas.clear();
        Canvas.drawGrid();
        this.world.draw();
        this.world.tick();
    }

    start() {
        this.rafHandle = rAFInterval(() => this.tick(), 100);
    }

    stop() {
        window.cancelAnimationFrame(this.rafHandle.value);
    }
}


new App().start();
