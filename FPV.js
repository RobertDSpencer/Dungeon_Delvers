// FPV.js
// Renders a static first-person view of a maze from a random position and facing direction

console.log('FPV.js loaded');

// Configuration
const viewDistance = 3; // Maximum tiles to render (player can see 3 tiles ahead)
const fov = Math.PI / 3; // Field of view (60 degrees)

// Global variables to share position and facing with Mapnav.js
let cameraPosition = null;
let cameraFacing = null;

// Draws a first-person view of the maze at a given position and facing direction
function drawFirstPersonView(mazeName) {
    console.log('drawFirstPersonView called with mazeName:', mazeName);

    // Initialize canvas and context
    let firstPersonCanvas = document.getElementById('firstPersonCanvas');
    if (!firstPersonCanvas) {
        console.log('Creating firstPersonCanvas...');
        firstPersonCanvas = document.createElement('canvas');
        firstPersonCanvas.id = 'firstPersonCanvas';
        firstPersonCanvas.width = 400; // Fixed width for simplicity
        firstPersonCanvas.height = 300; // Fixed height
        const mazeCanvas = document.getElementById('mazeCanvas');
        if (mazeCanvas) {
            document.body.insertBefore(firstPersonCanvas, mazeCanvas); // Ensure it appears above mazeCanvas
        } else {
            document.body.appendChild(firstPersonCanvas);
        }
    }
    const ctx = firstPersonCanvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get 2D context for firstPersonCanvas');
        return;
    }

    const maze = getMaze(mazeName);
    if (!maze) {
        console.error(`Error: Maze '${mazeName}' not found.`);
        return;
    }

    // Pick random position
    cameraPosition = {
        x: Math.floor(Math.random() * maze.width),
        y: Math.floor(Math.random() * maze.height)
    };

    // Pick random facing direction
    const directions = ['north', 'east', 'south', 'west'];
    cameraFacing = directions[Math.floor(Math.random() * directions.length)];

    // Clear canvas
    ctx.clearRect(0, 0, firstPersonCanvas.width, firstPersonCanvas.height);

    // Draw background (floor and ceiling)
    ctx.fillStyle = 'darkgray'; // Floor
    ctx.fillRect(0, firstPersonCanvas.height / 2, firstPersonCanvas.width, firstPersonCanvas.height / 2);
    ctx.fillStyle = 'lightgray'; // Ceiling
    ctx.fillRect(0, 0, firstPersonCanvas.width, firstPersonCanvas.height / 2);

    // Perspective projection parameters
    const canvasWidth = firstPersonCanvas.width;
    const canvasHeight = firstPersonCanvas.height;
    const wallHeights = [canvasHeight * 0.8, canvasHeight * 0.5, canvasHeight * 0.3]; // Heights for 1, 2, 3 tiles away
    const wallWidths = [canvasWidth * 0.8, canvasWidth * 0.5, canvasWidth * 0.3]; // Widths for 1, 2, 3 tiles away
    const offsets = [canvasWidth * 0.1, canvasWidth * 0.25, canvasWidth * 0.35]; // X offsets for centering
    const sideWallWidths = [canvasWidth * 0.2, canvasWidth * 0.125, canvasWidth * 0.075]; // Narrower for side walls

    // Check cells up to 3 tiles ahead in the facing direction
    let currentPos = { x: cameraPosition.x, y: cameraPosition.y };
    let blocked = false;
    for (let distance = 1; distance <= viewDistance; distance++) {
        if (blocked) break;

        // Get next cell in facing direction
        let nextPos;
        let wallProp;
        let leftWallProp, rightWallProp;
        switch (cameraFacing) {
            case 'north':
                nextPos = { x: currentPos.x, y: currentPos.y - 1 };
                wallProp = 'north';
                leftWallProp = 'west';
                rightWallProp = 'east';
                break;
            case 'south':
                nextPos = { x: currentPos.x, y: currentPos.y + 1 };
                wallProp = 'south';
                leftWallProp = 'east';
                rightWallProp = 'west';
                break;
            case 'east':
                nextPos = { x: currentPos.x + 1, y: currentPos.y };
                wallProp = 'east';
                leftWallProp = 'north';
                rightWallProp = 'south';
                break;
            case 'west':
                nextPos = { x: currentPos.x - 1, y: currentPos.y };
                wallProp = 'west';
                leftWallProp = 'south';
                rightWallProp = 'north';
                break;
        }

        // Check if next position is out of bounds (treat as a wall)
        if (nextPos.x < 0 || nextPos.x >= maze.width || nextPos.y < 0 || nextPos.y >= maze.height) {
            // Draw wall at the border
            const wallHeight = wallHeights[distance - 1];
            const wallWidth = wallWidths[distance - 1];
            const xOffset = offsets[distance - 1];
            const yTop = (canvasHeight - wallHeight) / 2;
            const yBottom = yTop + wallHeight;
            ctx.fillStyle = 'gray';
            ctx.fillRect(xOffset, yTop, wallWidth, wallHeight);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(xOffset, yTop, wallWidth, wallHeight);
            blocked = true;
            continue;
        }

        // Check if there's a wall in the current cell blocking the view
        if (maze.cells[currentPos.y][currentPos.x][wallProp]) {
            // Draw wall
            const wallHeight = wallHeights[distance - 1];
            const wallWidth = wallWidths[distance - 1];
            const xOffset = offsets[distance - 1];
            const yTop = (canvasHeight - wallHeight) / 2;
            const yBottom = yTop + wallHeight;
            ctx.fillStyle = 'gray';
            ctx.fillRect(xOffset, yTop, wallWidth, wallHeight);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(xOffset, yTop, wallWidth, wallHeight);
            blocked = true;
            continue;
        }

        // Draw side walls for the next cell (corridor ahead)
        if (nextPos.x >= 0 && nextPos.x < maze.width && nextPos.y >= 0 && nextPos.y < maze.height) {
            const wallHeight = wallHeights[distance - 1];
            const sideWidth = sideWallWidths[distance - 1];
            const innerHeight = wallHeight * (1 - distance * 0.1); // Smaller inner height for perspective
            const yTop = (canvasHeight - wallHeight) / 2;
            const yBottom = yTop + wallHeight;
            const innerYTop = (canvasHeight - innerHeight) / 2;
            const innerYBottom = innerYTop + innerHeight;

            // Left wall
            if (maze.cells[nextPos.y][nextPos.x][leftWallProp]) {
                const xOffset = offsets[distance - 1] - sideWidth;
                ctx.beginPath();
                ctx.moveTo(xOffset, yTop); // outer top
                ctx.lineTo(xOffset + sideWidth, innerYTop); // inner top
                ctx.lineTo(xOffset + sideWidth, innerYBottom); // inner bottom
                ctx.lineTo(xOffset, yBottom); // outer bottom
                ctx.closePath();
                ctx.fillStyle = 'gray';
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Right wall
            if (maze.cells[nextPos.y][nextPos.x][rightWallProp]) {
                const xOffset = offsets[distance - 1] + wallWidths[distance - 1];
                ctx.beginPath();
                ctx.moveTo(xOffset + sideWidth, yTop); // outer top
                ctx.lineTo(xOffset, innerYTop); // inner top
                ctx.lineTo(xOffset, innerYBottom); // inner bottom
                ctx.lineTo(xOffset + sideWidth, yBottom); // outer bottom
                ctx.closePath();
                ctx.fillStyle = 'gray';
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Check if the end point is at the next position
        if (nextPos.x === maze.end.x && nextPos.y === maze.end.y) {
            // Draw end point as a green square
            const endSize = wallWidths[distance - 1] * 0.5; // Smaller than wall
            const xOffset = offsets[distance - 1] + (wallWidths[distance - 1] - endSize) / 2;
            const yOffset = (canvasHeight - endSize) / 2;
            ctx.fillStyle = 'green';
            ctx.fillRect(xOffset, yOffset, endSize, endSize);
        }

        // Move to next position
        currentPos = nextPos;
    }

    // Display position and facing for debugging
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Position: (${cameraPosition.x}, ${cameraPosition.y}) Facing: ${cameraFacing}`, 10, 10);

    console.log('First-person view drawn with position:', cameraPosition, 'facing:', cameraFacing);
}