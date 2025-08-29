// Mapnav.js
// Handles player controls and rendering for the maze game

// Player logic for tank controls
const player = {
    position: { x: 0, y: 0 },
    facing: 'east' // Initial facing
};

let currentMaze = null;
let intersectionsCount = 0;
let intersections = []; // Store {x, y, number} for each intersection
let branchArrows = []; // Store {x, y, isValid, direction} for branch arrows of first intersection

function loadGameMaze(maze) {
    if (!maze) {
        console.error('Error: No maze provided to loadGameMaze');
        return;
    }
    player.position = { ...maze.start };
    player.facing = 'east'; // Reset facing
    currentMaze = maze;
    const intersectionData = countIntersectionsToExit(maze);
    intersectionsCount = intersectionData.count;
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
const cellSize = 25; // Adjusted for 16x16

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
    const angles = {
        north: 0,
        east: Math.PI / 2,
        south: Math.PI,
        west: 3 * Math.PI / 2
    };
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
        msg += ' - You reached the end!';
    }
    msg += `<br>Intersections to exit: ${intersectionsCount}`;
    status.innerHTML = msg;
}

// Initialize new maze button and keyboard controls
document.addEventListener('DOMContentLoaded', () => {
    const maze = generateRandomMaze('gameMaze', 30, 20);
    loadGameMaze(maze);

    document.getElementById('newMazeButton').addEventListener('click', () => {
        const maze = generateRandomMaze('gameMaze', 30, 20);
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

// Function to compute intersections from start to end
function countIntersectionsToExit(maze) {
    const path = findPath(maze.start, maze.end, maze.cells);  // BFS to get list of {x,y} from start to end
    if (!path || path.length < 2) {
        return { count: 0, intersections: [], branchArrows: [] };  // No intersections
    }

    let count = 0;
    const intersections = [];
    const branchArrows = [];
    let firstIntersectionFound = false;

    for (let i = 0; i < path.length - 1; i++) {  // Include start, skip end
        const curr = path[i];
        const next = path[i + 1];
        let prev = i > 0 ? path[i - 1] : null;

        const open_dirs = getOpenDirections(maze.cells[curr.y][curr.x]);
        const degree = open_dirs.length;

        let valid_branches = 0;
        const incoming_dir = prev ? getDirection(prev, curr) : null;
        const forward_dir = getDirection(curr, next);

        // Check each open direction for validity
        for (const dir of open_dirs) {
            if (dir === forward_dir || (incoming_dir && dir === incoming_dir)) {
                continue; // Skip forward and incoming directions
            }
            const branchStart = getNeighbor(curr, dir);
            const isValid = isValidPath(maze, curr, dir);
            if (!firstIntersectionFound) {
                branchArrows.push({ x: branchStart.x, y: branchStart.y, isValid, direction: dir });
            }
            if (isValid) {
                valid_branches++;
            }
        }

        // Start: degree > 1 with valid branch, Others: degree > 2 with valid branch
        if ((i === 0 && degree > 1 && valid_branches >= 1) || 
            (i > 0 && degree > 2 && valid_branches >= 1)) {
            count += 1;
            intersections.push({ x: curr.x, y: curr.y, number: count });
            firstIntersectionFound = true; // Stop collecting branch arrows after first intersection
        }
    }

    return { count, intersections, branchArrows };
}

// Helper to find unique path using BFS
function findPath(start, end, cells) {
    const queue = [];
    queue.push(start);
    const visited = Array.from({ length: cells.length }, () => Array(cells[0].length).fill(false));
    visited[start.y][start.x] = true;
    const parent = Array.from({ length: cells.length }, () => Array(cells[0].length).fill(null));

    while (queue.length > 0) {
        const curr = queue.shift();
        console.log(`Visiting cell: (${curr.x}, ${curr.y})`); // Log coordinates
        if (curr.x === end.x && curr.y === end.y) {
            break;
        }
        const open_dirs = getOpenDirections(cells[curr.y][curr.x]);
        for (const dir of open_dirs) {
            const next = getNeighbor(curr, dir);
            if (isInBounds(next, cells[0].length, cells.length) && !visited[next.y][next.x]) {
                visited[next.y][next.x] = true;
                parent[next.y][next.x] = curr;
                queue.push(next);
            }
        }
    }

    // Reconstruct path
    const path = [];
    let curr = end;
    while (curr !== null) {
        console.log(`Path cell: (${curr.x}, ${curr.y})`); // Log coordinates
        path.push(curr);
        const px = parent[curr.y][curr.x];
        curr = px;
    }
    path.reverse();  // start to end
    if (path.length > 0 && path[0].x === start.x && path[0].y === start.y) {
        console.log('Path found:', path.map(cell => `(${cell.x}, ${cell.y})`).join(' -> '));
        return path;
    }
    console.error('No valid path found');
    return [];  // No path, though shouldn't happen
}

// Helper to check if a path is valid (longer than 3 cells or has a fork)
function isValidPath(maze, start_pos, start_dir) {
    let curr_pos = getNeighbor(start_pos, start_dir);
    let curr_dir = start_dir;
    let length = 1;
    let steps = 0; // Fail-safe counter

    while (steps < 1000) { // Fail-safe
        steps++;
        if (!isInBounds(curr_pos, maze.width, maze.height)) return false;

        const cell = maze.cells[curr_pos.y][curr_pos.x];
        const open_dirs = getOpenDirections(cell);
        const back_dir = oppositeDir(curr_dir);
        const forward_opts = open_dirs.filter(dir => dir !== back_dir);

        if (forward_opts.length === 0) { // Dead-end
            return length > 3;
        } else if (forward_opts.length > 1) { // Fork
            return true;
        } else { // Continue
            curr_dir = forward_opts[0];
            curr_pos = getNeighbor(curr_pos, curr_dir);
            length += 1;
            if (length > 3) {
                return true; // Long enough
            }
        }
    }
    console.error('Fail-safe triggered in isValidPath');
    return false;
}

// Helper to get direction from a to b
function getDirection(a, b) {
    if (b.x === a.x + 1) return 'east';
    if (b.x === a.x - 1) return 'west';
    if (b.y === a.y + 1) return 'south';
    if (b.y === a.y - 1) return 'north';
    throw new Error('Invalid direction');
}

// Helper to get list of open directions for cell
function getOpenDirections(cell) {
    const dirs = [];
    if (!cell.north) dirs.push('north');
    if (!cell.south) dirs.push('south');
    if (!cell.east) dirs.push('east');
    if (!cell.west) dirs.push('west');
    return dirs;
}

// Helper opposite dir
function oppositeDir(dir) {
    if (dir === 'north') return 'south';
    if (dir === 'south') return 'north';
    if (dir === 'east') return 'west';
    if (dir === 'west') return 'east';
    throw new Error('Invalid direction');
}

// Helper to get neighbor position
function getNeighbor(pos, dir) {
    const newPos = { x: pos.x, y: pos.y };
    switch (dir) {
        case 'north': newPos.y--; break;
        case 'south': newPos.y++; break;
        case 'east': newPos.x++; break;
        case 'west': newPos.x--; break;
    }
    return newPos;
}

// Helper to check bounds
function isInBounds(pos, width, height) {
    return pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height;
}