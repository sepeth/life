let ctx = canvas.getContext('2d');

// Options
let rowCount = 50;
let colCount = 50;
let cellWidth = 10;

// Set canvas size
canvas.width = rowCount * cellWidth;
canvas.height = colCount * cellWidth;


function drawGrid() {
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
}

function fill(x, y) {
    ctx.fillStyle = '#40e0d0';
    ctx.rect(x * cellWidth, y * cellWidth, cellWidth, cellWidth);
    ctx.fill();
}


function rAFInterval(fn, delay) {
    var start = window.performance.now();
    function loop(time) {
        requestAnimationFrame(loop);
        if (time - start >= delay) {
            fn();
            start = window.performance.now();
        }
    }
    requestAnimationFrame(loop);
}


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


let world = parseMap(`
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


function drawWorld(world) {
    for (var y = 0; y < rowCount; y++)
        for (var x = 0; x < colCount; x++)
            if (world[y * colCount + x])
                fill(x, y);
}



function neighbourCount(x, y) {
    function checkCell(x, y) {
        if (x < 0 || x >= colCount || y < 0 || y >= rowCount)
            return 0;
        var ret = world[y * colCount + x];
        return ret;
    }

    return (
        checkCell(x-1, y-1) +
        checkCell(x,   y-1) +
        checkCell(x+1, y-1) +

        checkCell(x-1, y) +
        checkCell(x+1, y) +

        checkCell(x-1, y+1) +
        checkCell(x,   y+1) +
        checkCell(x+1, y+1)
    );
}


function worldTick() {
    var newWorld = world.slice();

    for (var y = 0; y < rowCount; y++)
        for (var x = 0; x < colCount; x++) {
            if (world[y * colCount + x]) {
                // alive
                var nc = neighbourCount(x, y);
                // any live cell with fewer than two live neighbours dies, as if caused by underpopulation.
                if (nc < 2) {
                    newWorld[y * colCount + x] = 0;
                }
                // any live cell with more than three live neighbours dies, as if by overpopulation.
                else if (nc > 3) {
                    newWorld[y * colCount + x] = 0;
                }
                // any live cell with two or three live neighbours lives on to the next generation.
            } else {
                // dead
                var nc = neighbourCount(x, y);

                // any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
                if (nc == 3) {
                    newWorld[y * colCount + x] = 1;
                }
            }
        }

    world = newWorld;
}

function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawWorld(world);
    worldTick();
}

rAFInterval(tick, 100);
