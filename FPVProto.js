// FPVProto.js
// Draws a gray rectangle (far wall) and a pink polygon (side wall) with two dividing lines

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
const farWallWidth = canvas.width * 0.25; // 25% of canvas width for distant wall (3 tiles away)
const farWallHeight = farWallWidth * canvasRatio; // Height matches canvas ratio (0.75 * farWallWidth)

// Draw the far wall rectangle and side wall polygon with dividing lines
function drawCenterWall() {
    if (!ctx) {
        console.error('Cannot draw: No canvas context for centerWallCanvas');
        return;
    }
    // Clear canvas with distinct background color
    ctx.fillStyle = '#1e3a5f'; // Dark blue background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Define vertices for the side wall polygon
    const farWallX = (canvas.width - farWallWidth) / 2; // Center of far wall (x: 300)
    const farWallY = (canvas.height - farWallHeight) / 2; // Center of far wall (y: 225)
    const vertexA = { x: farWallX, y: farWallY }; // Top-left of far wall (300, 225)
    const vertexB = { x: farWallX, y: farWallY + farWallHeight }; // Bottom-left of far wall (300, 375)
    const vertexC = { x: 0, y: 100 }; // Left border, near top
    const vertexD = { x: 0, y: 500 }; // Left border, near bottom

    // Draw side wall polygon (left side)
    ctx.beginPath();
    ctx.moveTo(vertexA.x, vertexA.y); // A: Top-left of far wall
    ctx.lineTo(vertexB.x, vertexB.y); // B: Bottom-left of far wall
    ctx.lineTo(vertexD.x, vertexD.y); // D: Left border, near bottom
    ctx.lineTo(vertexC.x, vertexC.y); // C: Left border, near top
    ctx.closePath();
    ctx.fillStyle = '#ff69b4'; // Pink fill
    ctx.fill();
    ctx.strokeStyle = 'white'; // White border
    ctx.lineWidth = 2; // Border width
    ctx.stroke();

    // Draw dividing lines for side wall
    const leftX = vertexC.x; // Left edge (x: 0)
    const rightX = vertexA.x; // Right edge (x: 300)
    const width = rightX - leftX; // 300 pixels
    const x1 = leftX + width / 3; // First line at x=100
    const x2 = leftX + (2 * width) / 3; // Second line at x=200

    // Calculate y-coordinates for top and bottom edges
    const topSlope = (vertexA.y - vertexC.y) / (vertexA.x - vertexC.x); // (225-100)/(300-0) = 0.4167
    const bottomSlope = (vertexB.y - vertexD.y) / (vertexB.x - vertexD.x); // (375-500)/(300-0) = -0.4167
    const yTop1 = vertexC.y + topSlope * (x1 - vertexC.x); // y=100 + 0.4167 * 100 = 141.67
    const yBottom1 = vertexD.y + bottomSlope * (x1 - vertexD.x); // y=500 - 0.4167 * 100 = 458.33
    const yTop2 = vertexC.y + topSlope * (x2 - vertexC.x); // y=100 + 0.4167 * 200 = 183.33
    const yBottom2 = vertexD.y + bottomSlope * (x2 - vertexD.x); // y=500 - 0.4167 * 200 = 416.67

    // Draw first dividing line (x=100)
    ctx.beginPath();
    ctx.moveTo(x1, yTop1);
    ctx.lineTo(x1, yBottom1);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw second dividing line (x=200)
    ctx.beginPath();
    ctx.moveTo(x2, yTop2);
    ctx.lineTo(x2, yBottom2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw far wall rectangle
    const x = (canvas.width - farWallWidth) / 2; // Center horizontally (x: 300)
    const y = (canvas.height - farWallHeight) / 2; // Center vertically (y: 225)
    ctx.fillStyle = 'gray'; // Wall fill color
    ctx.fillRect(x, y, farWallWidth, farWallHeight);
    ctx.strokeStyle = 'white'; // Border color
    ctx.strokeRect(x, y, farWallWidth, farWallHeight); // Draw border

    console.log('Far wall drawn at x:', x, 'y:', y, 'width:', farWallWidth, 'height:', farWallHeight);
    console.log('Side wall polygon drawn with vertices:', {
        A: vertexA,
        B: vertexB,
        C: vertexC,
        D: vertexD
    });
    console.log('Dividing lines drawn at:', {
        line1: { x: x1, yTop: yTop1, yBottom: yBottom1 },
        line2: { x: x2, yTop: yTop2, yBottom: yBottom2 }
    });
}