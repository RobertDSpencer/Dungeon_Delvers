// Mapnav.js
// Handles player controls and rendering for the maze game

// Configuration
const disable_complexity_checks = false; // Set to true to show intersection markers and branch arrows
const map_x = 6;
const map_y = 6;

// Player logic for tank controls
const player = {
    position: { x: 0, y: 0 },
    facing: 'east' // Initial facing
};

let currentMaze = null;
let intersectionsCount = 0;
let pathLength = 0; // Store path length to exit
let intersections = []; // Store {x, y, number} for each intersection
let branchArrows = []; // Store {x, y, isValid, direction} for branch arrows of all intersections
let checkedCells = []; // Store {x, y, direction} for cells checked in isValidPath

// Determines relative complexity based on maze size, path length, and intersection count
function getComplexityLabels(width, height, pathLength, intersectionsCount) {
    const sizeKey = `${width}x${height}`;
    const thresholds = {
        '6x6': {
            pathLength: [
                { max: 5, label: 'very short' },    // <= 20th percentile
                { max: 7, label: 'short' },        // <= 40th percentile
                { max: 10, label: 'average' },     // <= 60th percentile
                { max: 13, label: 'long' },        // <= 80th percentile
                { max: 36, label: 'very long' }    // <= 100th percentile
            ],
            intersections: [
                { max: 1, label: 'simple' },  // <= 20th percentile
                { max: 2, label: 'average' },      // <= 60th percentile
                { max: 3, label: 'complex' },      // <= 80th percentile
                { max: 9, label: 'very complex' }  // <= 100th percentile
            ]
        },
        '11x11': {
            pathLength: [
                { max: 10, label: 'very short' },  // <= 20th percentile
                { max: 15, label: 'short' },       // <= 40th percentile
                { max: 21, label: 'average' },     // <= 60th percentile
                { max: 32, label: 'long' },        // <= 80th percentile
                { max: 104, label: 'very long' }   // <= 100th percentile
            ],
            intersections: [
                { max: 2, label: 'very simple' },  // <= 20th percentile
                { max: 3, label: 'simple' },       // <= 40th percentile
                { max: 5, label: 'average' },      // <= 60th percentile
                { max: 6, label: 'complex' },      // <= 80th percentile
                { max: 19, label: 'very complex' } // <= 100th percentile
            ]
        },
        '16x16': {
            pathLength: [
                { max: 16, label: 'very short' },  // <= 20th percentile
                { max: 24, label: 'short' },       // <= 40th percentile
                { max: 33, label: 'average' },     // <= 60th percentile
                { max: 59, label: 'long' },        // <= 80th percentile
                { max: 204, label: 'very long' }   // <= 100th percentile
            ],
            intersections: [
                { max: 3, label: 'very simple' },  // <= 20th percentile
                { max: 5, label: 'simple' },       // <= 40th percentile
                { max: 7, label: 'average' },      // <= 60th percentile
                { max: 10, label: 'complex' },     // <= 80th percentile
                { max: 28, label: 'very complex' } // <= 100th percentile
            ]
        }
    };

    // Default to 11x11 if size is not recognized
    const mazeThresholds = thresholds[sizeKey] || thresholds['11x11'];

    // Find path length label
    let pathLabel = 'very long';
    for (const threshold of mazeThresholds.pathLength) {
        if (pathLength <= threshold.max) {
            pathLabel = threshold.label;
            break;
        }
    }

    // Find intersection count label
    let intersectionLabel = 'very complex';
    for (const threshold of mazeThresholds.intersections) {
        if (intersectionsCount <= threshold.max) {
            intersectionLabel = threshold.label;
            break;
        }
    }

    return { pathLabel, intersectionLabel };
}

function loadGameMaze(maze) {
    if (!maze) {
        console.error('Error: No maze provided to loadGameMaze');
        return;
    }
    player.position = { ...maze.start };
    player.facing = 'east'; // Reset facing
    currentMaze = maze;
    checkedCells = []; // Clear checked cells for new maze
    const intersectionData = countIntersectionsToExit(maze, checkedCells);
    intersectionsCount = intersectionData.count;
    pathLength = intersectionData.pathLength;
    intersections = intersectionData.intersections;
    branchArrows = intersectionData.branchArrows;
    drawMaze();
    updateStatus();
}

// Tank controls helper functions
function turn(dir) {
    const facings = ['north', 'east', 'south', 'west'];
    let idx = facings.indexOf(player.facing);
    if (dir === 'left') {
        idx = (idx - 1 + 4) % 4;
    } else {
        idx = (idx + 1) % 4;
    }
    player.facing = facings[idx];
    drawMaze();
    updateStatus();
}

function moveInDirection(direction) {
    if (!currentMaze) {
        console.error('Error: No maze loaded in moveInDirection');
        return;
    }
    const { x, y } = player.position;
    const cell = currentMaze.cells[y][x];

    let newX = x;
    let newY = y;

    switch (direction) {
        case 'north':
            if (cell.north) return;
            newY--;
            break;
        case 'south':
            if (cell.south) return;
            newY++;
            break;
        case 'east':
            if (cell.east) return;
            newX++;
            break;
        case 'west':
            if (cell.west) return;
            newX--;
            break;
    }

    // Check bounds
    if (newX < 0 || newX >= currentMaze.width || newY < 0 || newY >= currentMaze.height) {
        return;
    }

    player.position = { x: newX, y: newY };
    drawMaze();
    updateStatus();
}

function moveForward() {
    moveInDirection(player.facing);
}

function moveBackward() {
    const opposites = { north: 'south', south: 'north', east: 'west', west: 'east' };
    moveInDirection(opposites[player.facing]);
}

function isAtEnd() {
    if (!currentMaze) {
        console.error('Error: No maze loaded in isAtEnd');
        return false;
    }
    return player.position.x === currentMaze.end.x && player.position.y === currentMaze.end.y;
}

// Drawing functions
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const cellSize = 25; // Adjusted for map size

function drawMaze() {
    if (!currentMaze) {
        console.error('Error: No maze to draw');
        return;
    }

    const { width, height, cells } = currentMaze;
    canvas.width = width * cellSize;
    canvas.height = height * cellSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    // Define angles for arrow rotations
    const angles = {
        north: 0,
        east: Math.PI / 2,
        south: Math.PI,
        west: 3 * Math.PI / 2
    };

    // Draw walls
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = cells[y][x];
            const px = x * cellSize;
            const py = y * cellSize;

            if (cell.north) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + cellSize, py);
                ctx.stroke();
            }
            if (cell.south) {
                ctx.beginPath();
                ctx.moveTo(px, py + cellSize);
                ctx.lineTo(px + cellSize, py + cellSize);
                ctx.stroke();
            }
            if (cell.east) {
                ctx.beginPath();
                ctx.moveTo(px + cellSize, py);
                ctx.lineTo(px + cellSize, py + cellSize);
                ctx.stroke();
            }
            if (cell.west) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px, py + cellSize);
                ctx.stroke();
            }
        }
    }

    // Draw intersections and branch arrows only if disable_complexity_checks is true
    if (disable_complexity_checks) {
        // Draw intersections as light blue circles with numbers
        ctx.fillStyle = 'lightblue';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        intersections.forEach(({ x, y, number }) => {
            const cx = x * cellSize + cellSize / 2;
            const cy = y * cellSize + cellSize / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, cellSize / 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.fillText(number, cx, cy);
            ctx.fillStyle = 'lightblue'; // Reset for next circle
        });

        // Draw branch arrows (green for valid, red for invalid)
        const arrowSize = cellSize / 3; // Smaller than player arrow
        branchArrows.forEach(({ x, y, isValid, direction }) => {
            const px = x * cellSize + cellSize / 2;
            const py = y * cellSize + cellSize / 2;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angles[direction]);
            ctx.fillStyle = isValid ? 'green' : 'red';
            ctx.beginPath();
            ctx.moveTo(0, -arrowSize / 2);
            ctx.lineTo(-arrowSize / 2, arrowSize / 2);
            ctx.lineTo(arrowSize / 2, arrowSize / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });

        // Draw checked cells as yellow arrows
        const checkedArrowSize = cellSize / 4; // Smaller than branch arrows
        checkedCells.forEach(({ x, y, direction }) => {
            const px = x * cellSize + cellSize / 2;
            const py = y * cellSize + cellSize / 2;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angles[direction]);
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.moveTo(0, -checkedArrowSize / 2);
            ctx.lineTo(-checkedArrowSize / 2, checkedArrowSize / 2);
            ctx.lineTo(checkedArrowSize / 2, checkedArrowSize / 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
    }

    // Draw player as red arrow (rotated based on facing)
    const px = player.position.x * cellSize + cellSize / 2;
    const py = player.position.y * cellSize + cellSize / 2;
    const playerArrowSize = cellSize / 2;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angles[player.facing]);
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(0, -playerArrowSize / 2);
    ctx.lineTo(-playerArrowSize / 2, playerArrowSize / 2);
    ctx.lineTo(playerArrowSize / 2, playerArrowSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw end point as green circle
    const ex = currentMaze.end.x * cellSize + cellSize / 2;
    const ey = currentMaze.end.y * cellSize + cellSize / 2;
    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(ex, ey, playerArrowSize / 2, 0, 2 * Math.PI);
    ctx.fill();
}

function updateStatus() {
    const status = document.getElementById('status');
    let msg = `Position: (${player.position.x}, ${player.position.y}) Facing: ${player.facing}`;
    if (isAtEnd()) {
        msg += '<br>You reached the end!';
    }
    status.innerHTML = msg;

    // Update complexity text with descriptive labels
    const complexity = document.getElementById('complexity');
    const { pathLabel, intersectionLabel } = getComplexityLabels(currentMaze.width, currentMaze.height, pathLength, intersectionsCount);
    complexity.innerHTML = `Complexity<br>Path length: ${pathLabel}<br>Intersections: ${intersectionLabel}`;
}

// Initialize new maze button and keyboard controls
document.addEventListener('DOMContentLoaded', () => {
    const maze = generateRandomMaze('gameMaze', map_x, map_y);
    loadGameMaze(maze);

    document.getElementById('newMazeButton').addEventListener('click', () => {
        const maze = generateRandomMaze('gameMaze', map_x, map_y);
        loadGameMaze(maze);
    });

    document.addEventListener('keydown', (event) => {
        switch (event.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                moveForward();
                break;
            case 's':
            case 'arrowdown':
                moveBackward();
                break;
            case 'a':
            case 'arrowleft':
                turn('left');
                break;
            case 'd':
            case 'arrowright':
                turn('right');
                break;
        }
    });
});