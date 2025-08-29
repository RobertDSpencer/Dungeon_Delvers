// Mapgen.js
// Contains maze generation algorithms

// default size of mazes
const default_size = 5
// Helper to pick a weighted random position
function pickPosition(width, height) {
    const rand = Math.random();
    let positions = [];
    if (rand < 0.66) {
        // Edge
        for (let x = 0; x < width; x++) {
            positions.push({ x, y: 0 });
            positions.push({ x, y: height - 1 });
        }
        for (let y = 1; y < height - 1; y++) {
            positions.push({ x: 0, y });
            positions.push({ x: width - 1, y });
        }
    } else if (rand < 0.66 + 0.31) {
        // Middle
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                positions.push({ x, y });
            }
        }
    } else {
        // Truly random
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                positions.push({ x, y });
            }
        }
    }
    return positions[Math.floor(Math.random() * positions.length)];
}

/**
 * Generates a maze using recursive backtracking.
 * @param {number} width - Width of the maze grid.
 * @param {number} height - Height of the maze grid.
 * @returns {object} Maze object with width, height, cells, start, end.
 */
function generateBacktrackingMaze(width = default_size, height = default_size) {
    // Initialize grid with all walls present and unvisited
    const cells = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => ({
            north: true,
            south: true,
            east: true,
            west: true,
            visited: false
        }))
    );

    // Directions with offsets and opposite walls
    const directions = [
        { dx: 0, dy: -1, wall: 'north', oppWall: 'south' }, // North
        { dx: 0, dy: 1, wall: 'south', oppWall: 'north' },  // South
        { dx: 1, dy: 0, wall: 'east', oppWall: 'west' },    // East
        { dx: -1, dy: 0, wall: 'west', oppWall: 'east' }    // West
    ];

    // Recursive backtracker function
    function carve(x, y) {
        cells[y][x].visited = true;
        const shuffledDirs = directions.sort(() => Math.random() - 0.5);

        for (const dir of shuffledDirs) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height && !cells[ny][nx].visited) {
                // Remove shared wall (2-sided)
                cells[y][x][dir.wall] = false;
                cells[ny][nx][dir.oppWall] = false;
                carve(nx, ny);
            }
        }
    }

    // Start carving from random cell
    carve(Math.floor(Math.random() * width), Math.floor(Math.random() * height));

    // Clean up visited flags
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            delete cells[y][x].visited;
        }
    }

    // Set start and end
    const start = pickPosition(width, height);
    let end = pickPosition(width, height);
    while (start.x === end.x && start.y === end.y) {
        end = pickPosition(width, height);
    }

    return { width, height, cells, start, end };
}

/**
 * Generates a maze using iterative randomized Prim's algorithm.
 * @param {number} width - Width of the maze grid.
 * @param {number} height - Height of the maze grid.
 * @returns {object} Maze object with width, height, cells, start, end.
 */
function generatePrimsMaze(width = default_size, height = default_size) {
    // Initialize grid with all walls present and unvisited
    const cells = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => ({
            north: true,
            south: true,
            east: true,
            west: true,
            visited: false
        }))
    );

    // Start from a random cell
    const startX = Math.floor(Math.random() * width);
    const startY = Math.floor(Math.random() * height);
    cells[startY][startX].visited = true;

    // Frontier list: walls adjacent to visited cells
    let frontier = getAdjacentWalls(startX, startY, width, height);

    while (frontier.length > 0) {
        // Pick random wall from frontier
        const wallIdx = Math.floor(Math.random() * frontier.length);
        const wall = frontier[wallIdx];
        frontier.splice(wallIdx, 1);

        // Get the unvisited cell on the other side
        const { x, y, dir } = wall;
        let nx = x, ny = y;
        let oppDir;
        switch (dir) {
            case 'north': ny--; oppDir = 'south'; break;
            case 'south': ny++; oppDir = 'north'; break;
            case 'east': nx++; oppDir = 'west'; break;
            case 'west': nx--; oppDir = 'east'; break;
        }

        if (nx >= 0 && nx < width && ny >= 0 && ny < height && !cells[ny][nx].visited) {
            // Remove wall
            cells[y][x][dir] = false;
            cells[ny][nx][oppDir] = false;

            // Mark visited and add its walls to frontier
            cells[ny][nx].visited = true;
            frontier.push(...getAdjacentWalls(nx, ny, width, height));
        }
    }

    // Clean up visited flags
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            delete cells[y][x].visited;
        }
    }

    // Set start and end
    const start = pickPosition(width, height);
    let end = pickPosition(width, height);
    while (start.x === end.x && start.y === end.y) {
        end = pickPosition(width, height);
    }

    return { width, height, cells, start, end };
}

// Helper to get adjacent walls for a cell (for Prim's)
function getAdjacentWalls(x, y, width, height) {
    const walls = [];
    if (y > 0) walls.push({ x, y, dir: 'north' });
    if (y < height - 1) walls.push({ x, y, dir: 'south' });
    if (x < width - 1) walls.push({ x, y, dir: 'east' });
    if (x > 0) walls.push({ x, y, dir: 'west' });
    return walls;
}