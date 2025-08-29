// Player.js
// Stores data about the player and handles navigation

const playerData = {
    name: 'Player1',
    currentMaze: null,
    position: { x: 0, y: 0 },
    health: 100,
    inventory: []
};

/**
 * Loads a maze for the player and resets position to start.
 * @param {string} mazeName - The name of the maze to load.
 */
function loadMaze(mazeName) {
    const maze = getMaze(mazeName);
    if (!maze) {
        console.error(`Error: Maze '${mazeName}' not found.`);
        return;
    }
    playerData.currentMaze = mazeName;
    playerData.position = { ...maze.start };
}

/**
 * Gets the current player data.
 * @returns {object} The player object.
 */
function getPlayerData() {
    return playerData;
}

/**
 * Attempts to move the player in a given direction if no wall blocks it.
 * @param {string} direction - 'north', 'south', 'east', or 'west'.
 * @returns {boolean} True if move succeeded, false if blocked or invalid.
 */
function move(direction) {
    if (!playerData.currentMaze) {
        console.error('Error: No maze loaded in move');
        return false;
    }
    const maze = getMaze(playerData.currentMaze);
    const { x, y } = playerData.position;
    const cell = maze.cells[y][x];

    let newX = x;
    let newY = y;

    switch (direction.toLowerCase()) {
        case 'north':
            if (cell.north) return false;
            newY--;
            break;
        case 'south':
            if (cell.south) return false;
            newY++;
            break;
        case 'east':
            if (cell.east) return false;
            newX++;
            break;
        case 'west':
            if (cell.west) return false;
            newX--;
            break;
        default:
            return false;
    }

    // Check bounds
    if (newX < 0 || newX >= maze.width || newY < 0 || newY >= maze.height) {
        return false;
    }

    playerData.position = { x: newX, y: newY };
    return true;
}

/**
 * Checks if the player has reached the end point.
 * @returns {boolean} True if at end position.
 */
function isAtEnd() {
    if (!playerData.currentMaze) {
        console.error('Error: No maze loaded in isAtEnd');
        return false;
    }
    const maze = getMaze(playerData.currentMaze);
    return playerData.position.x === maze.end.x && playerData.position.y === maze.end.y;
}