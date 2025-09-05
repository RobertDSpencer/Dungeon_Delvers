// FPVProto.js
// Draws far walls at 0, 1, 2, or 3 tiles away, cycling one by one, with all side wall segments (0: white, 1: light gray, 2: medium gray, 3: dark gray)

console.log('FPVProto.js loaded');

// Initialize canvas and context
const canvas = document.getElementById('centerWallCanvas');
if (!canvas) {
    console.error('centerWallCanvas not found');
}
const ctx = canvas ? canvas.getContext('2d') : null;
if (!ctx) {
    console.error('Failed to get 2D context for centerWallCanvas');
}

// Configuration
canvas.width = 800; // Canvas width
canvas.height = 600; // Canvas height
const canvasRatio = canvas.height / canvas.width; // 600/800 = 0.75

// Segment colors
const segmentColors = ['white', '#d3d3d3', '#808080', '#404040']; // 0: white, 1: light gray, 2: medium gray, 3: dark gray
const farWallColors = ['', '#e9e9e9', '#a8a8a8', '#606060', '#202020']; // 0: between white and light gray, 1: between light and medium, 2: between medium and dark, 3: very dark gray
const farWallWidths = [800, 740, 560, 380]; // 0: x=0 to 800, 1: x=30 to 770, 2: x=120 to 680, 3: x=210 to 590
const farWallHeights = farWallWidths.map(w => w * canvasRatio); // Heights match canvas ratio (0.75)

// Trapezoid vertices for side walls
const leftVertexA = { x: 300, y: 225 }; // Top-left of far wall at distance 3
const leftVertexB = { x: 300, y: 375 }; // Bottom-left of far wall at distance 3
const leftVertexC = { x: 0, y: 100 }; // Left border, near top
const leftVertexD = { x: 0, y: 500 }; // Left border, near bottom

const rightVertexA = { x: 500, y: 225 }; // Top-right of far wall at distance 3
const rightVertexB = { x: 500, y: 375 }; // Bottom-right of far wall at distance 3
const rightVertexC = { x: canvas.width, y: 100 }; // Right border, near top (800, 100)
const rightVertexD = { x: canvas.width, y: 500 }; // Right border, near bottom (800, 500)

const leftX = leftVertexC.x; // Left edge (x: 0)
const rightX = leftVertexA.x; // Right edge for left side (x: 300)
const width = rightX - leftX; // 300 pixels
const smallWidth = 30; // Small width for segment 0
const remainingWidth = width - smallWidth; // 270 pixels for segments 1, 2, 3
const segmentWidth = remainingWidth / 3; // 90 pixels per segment
const x0 = leftX + smallWidth; // x=30
const x1 = x0 + segmentWidth; // x=120
const x2 = x1 + segmentWidth; // x=210
const x3 = x2 + segmentWidth;

const leftTopSlope = (leftVertexA.y - leftVertexC.y) / (leftVertexA.x - leftVertexC.x); // (225-100)/(300-0) = 0.4167
const leftBottomSlope = (leftVertexB.y - leftVertexD.y) / (leftVertexB.x - leftVertexD.x); // (375-500)/(300-0) = -0.4167
const leftYTop0 = leftVertexC.y + leftTopSlope * (x0 - leftVertexC.x); // y=112.5 at x=30
const leftYBottom0 = leftVertexD.y + leftBottomSlope * (x0 - leftVertexD.x); // y=487.5 at x=30
const leftYTop1 = leftVertexC.y + leftTopSlope * (x1 - leftVertexC.x); // y=141.67 at x=120
const leftYBottom1 = leftVertexD.y + leftBottomSlope * (x1 - leftVertexD.x); // y=458.33 at x=120
const leftYTop2 = leftVertexC.y + leftTopSlope * (x2 - leftVertexC.x); // y=183.33 at x=210
const leftYBottom2 = leftVertexD.y + leftBottomSlope * (x2 - leftVertexD.x); // y=416.67 at x=210
const leftYTop3 = leftVertexC.y + leftTopSlope * (x3 - leftVertexC.x);
const leftYBottom3 = leftVertexD.y + leftBottomSlope * (x3 - leftVertexD.x);


const rightFarX = rightVertexA.x; // Right edge for right side (x: 500)
const rightEndX = rightVertexC.x; // Canvas right border (x: 800)
const rightWidth = rightEndX - rightFarX; // 300 pixels
const rightX0 = rightEndX - smallWidth; // x=770
const rightX1 = rightX0 - segmentWidth; // x=680
const rightX2 = rightX1 - segmentWidth; // x=590
const rightX3 = rightX2 - segmentWidth;

const rightTopSlope = (rightVertexC.y - rightVertexA.y) / (rightVertexC.x - rightVertexA.x); // (100-225)/(800-500) = -0.4167
const rightBottomSlope = (rightVertexD.y - rightVertexB.y) / (rightVertexD.x - rightVertexB.x); // (500-375)/(800-500) = 0.4167
const rightYTop0 = rightVertexC.y + rightTopSlope * (rightX0 - rightVertexC.x); // y=112.5 at x=770
const rightYBottom0 = rightVertexD.y + rightBottomSlope * (rightX0 - rightVertexD.x); // y=487.5 at x=770
const rightYTop1 = rightVertexC.y + rightTopSlope * (rightX1 - rightVertexC.x); // y=141.67 at x=680
const rightYBottom1 = rightVertexD.y + rightBottomSlope * (rightX1 - rightVertexD.x); // y=458.33 at x=680
const rightYTop2 = rightVertexC.y + rightTopSlope * (rightX2 - rightVertexC.x); // y=183.33 at x=590
const rightYBottom2 = rightVertexD.y + rightBottomSlope * (rightX2 - rightVertexD.x); // y=416.67 at x=590

// Draw a single trapezoid segment
function drawTrapezoid(segment, xLeft, yTopLeft, yBottomLeft, xRight, yTopRight, yBottomRight, color) {
    ctx.beginPath();
    ctx.moveTo(xLeft, yTopLeft);
    ctx.lineTo(xLeft, yBottomLeft);
    ctx.lineTo(xRight, yBottomRight);
    ctx.lineTo(xRight, yTopRight);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    console.log(`Drawn trapezoid segment ${segment}:`, {
        topLeft: { x: xLeft, y: yTopLeft },
        bottomLeft: { x: xLeft, y: yBottomLeft },
        bottomRight: { x: xRight, y: yBottomRight },
        topRight: { x: xRight, y: yTopRight }
    });
}

// Draw the far wall at specified distance
function drawFarWall(distance) {
    const index = distance + 1; // Map distance (0, 1, 2, 3) to index
    const width = farWallWidths[index];
    const height = farWallHeights[index];
    const xLeft = [leftVertexC.x, x0, x1, x2, x3][index]; // Use side wall edges
    const xRight = [rightVertexC.x, rightX0, rightX1, rightX2, rightX3][index];
    const yTop = [leftVertexC.y, leftYTop0, leftYTop1, leftYTop2, leftYTop3][index];
    const yBottom = [leftVertexD.y, leftYBottom0, leftYBottom1, leftYBottom2, leftYBottom3][index];
    ctx.fillStyle = farWallColors[index];
    ctx.fillRect(xLeft, yTop, xRight - xLeft, yBottom - yTop);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(xLeft, yTop, xRight - xLeft, yBottom - yTop);
    console.log(`Far wall drawn at distance ${distance}, x: ${xLeft}, y: ${yTop}, width: ${xRight - xLeft}, height: ${yBottom - yTop}, color: ${farWallColors[index]}`);
}

// Draw walls based on boolean arrays and far wall distance
function drawWalls(leftWalls, rightWalls, farWallDistance) {
    if (!ctx) {
        console.error('Cannot draw: No canvas context for centerWallCanvas');
        return;
    }
    // Clear canvas
    ctx.fillStyle = '#1e3a5f'; // Dark blue background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw left segments (farthest to closest)
    if (leftWalls[3]) drawTrapezoid('left-3', x2, leftYTop2, leftYBottom2, leftVertexA.x, leftVertexA.y, leftVertexB.y, segmentColors[3]);
    if (leftWalls[2]) drawTrapezoid('left-2', x1, leftYTop1, leftYBottom1, x2, leftYTop2, leftYBottom2, segmentColors[2]);
    if (leftWalls[1]) drawTrapezoid('left-1', x0, leftYTop0, leftYBottom0, x1, leftYTop1, leftYBottom1, segmentColors[1]);
    if (leftWalls[0]) drawTrapezoid('left-0', leftVertexC.x, leftVertexC.y, leftVertexD.y, x0, leftYTop0, leftYBottom0, segmentColors[0]);

    // Draw right segments (farthest to closest)
    if (rightWalls[3]) drawTrapezoid('right-3', rightX2, rightYTop2, rightYBottom2, rightVertexA.x, rightVertexA.y, rightVertexB.y, segmentColors[3]);
    if (rightWalls[2]) drawTrapezoid('right-2', rightX1, rightYTop1, rightYBottom1, rightX2, rightYTop2, rightYBottom2, segmentColors[2]);
    if (rightWalls[1]) drawTrapezoid('right-1', rightX0, rightYTop0, rightYBottom0, rightX1, rightYTop1, rightYBottom1, segmentColors[1]);
    if (rightWalls[0]) drawTrapezoid('right-0', rightVertexC.x, rightVertexC.y, rightVertexD.y, rightX0, rightYTop0, rightYBottom0, segmentColors[0]);

    // Draw far wall if distance is 0, 1, 2, or 3
    if ([0, 1, 2, 3].includes(farWallDistance)) {
        drawFarWall(farWallDistance);
    }
}

// Cycle through far wall distances
let farWallCycleState = 0;
function cycleFarWalls() {
    const leftWalls = [true, true, true, true]; // All left segments
    const rightWalls = [true, true, true, true]; // All right segments
    const farWallDistance = farWallCycleState; // Cycle through 0, 1, 2, 3, 4 (not shown)
    console.log('Far wall cycle state:', farWallCycleState, 'Distance:', farWallDistance);
    drawWalls(leftWalls, rightWalls, farWallDistance);
    farWallCycleState = (farWallCycleState + 1) % 5; // Loop through 0, 1, 2, 3, 4
}

// Draw on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event triggered for FPVProto.js');
    cycleFarWalls();
});