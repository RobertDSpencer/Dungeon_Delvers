// Maze.js
// Handles maze storage and retrieval

const mazes = new Map(); // Stores mazes by name

/**
 * Generates a random solvable maze using either backtracking or Prim's.
 * @param {string} name - Unique name for the maze.
 * @param {number} width - Width of the maze grid.
 * @param {number} height - Height of the maze grid.
 */
function generateRandomMaze(name, width, height) {
    if (mazes.has(name)) {
        mazes.delete(name); // Overwrite for simplicity in browser
    }

    // Randomly choose generation method
    const method = Math.random() < 0.5 ? 'backtracking' : 'prims';
    let maze;
    if (method === 'backtracking') {
        maze = generateBacktrackingMaze(width, height);
    } else {
        maze = generatePrimsMaze(width, height);
    }

    mazes.set(name, maze);
    return maze;
}

/**
 * Sets a custom maze provided by the user.
 * @param {string} name - Unique name for the maze.
 * @param {object} mazeObj - { width, height, cells: 2D array of {north, south, east, west}, start: {x,y}, end: {x,y} }
 */
function setCustomMaze(name, mazeObj) {
    if (mazes.has(name)) {
        mazes.delete(name); // Overwrite for simplicity
    }
    // Basic validation
    if (!mazeObj.width || !mazeObj.height || !Array.isArray(mazeObj.cells) ||
        mazeObj.cells.length !== mazeObj.height ||
        !mazeObj.cells.every(row => Array.isArray(row) && row.length === mazeObj.width) ||
        !mazeObj.start || !mazeObj.end) {
        throw new Error('Invalid maze object format.');
    }
    mazes.set(name, mazeObj);
}

/**
 * Retrieves a stored maze by name.
 * @param {string} name - The name of the maze.
 * @returns {object|null} The maze object or null if not found.
 */
function getMaze(name) {
    return mazes.get(name) || null;
}