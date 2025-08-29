// ComplexityCheck.js
// Handles intersection and branch validation for maze complexity

function countIntersectionsToExit(maze, checkedCells) {
    const path = findPath(maze.start, maze.end, maze.cells);  // BFS to get list of {x,y} from start to end
    if (!path || path.length < 2) {
        return { count: 0, intersections: [], branchArrows: [], pathLength: 0 };  // No possible intersections
    }

    // Create set of critical path cells for O(1) lookup
    const criticalPathSet = new Set(path.map(cell => `${cell.x},${cell.y}`));

    let count = 0;
    const intersections = [];
    const branchArrows = [];

    for (let i = 0; i < path.length - 1; i++) {  // Include start, skip end
        const curr = path[i];
        const open_dirs = getOpenDirections(maze.cells[curr.y][curr.x]);
        const degree = open_dirs.length;

        let valid_branches = 0;
        // Check each open direction, skip if first cell is on critical path
        const branches = open_dirs.filter(dir => {
            const neighbor = getNeighbor(curr, dir);
            return !criticalPathSet.has(`${neighbor.x},${neighbor.y}`);
        });

        for (const dir of branches) {
            const isValid = isValidPath(maze, curr, dir, checkedCells);
            if (isValid) {
                valid_branches++;
            }
            // Add arrow for this branch if the cell is an intersection
            if ((i === 0 && degree > 1 && valid_branches >= 1) || 
                (i > 0 && degree > 2 && valid_branches >= 1)) {
                const branchStart = getNeighbor(curr, dir);
                branchArrows.push({ x: branchStart.x, y: branchStart.y, isValid, direction: dir });
            }
        }

        // Start: degree > 1 with valid branch, Others: degree > 2 with valid branch
        if ((i === 0 && degree > 1 && valid_branches >= 1) || 
            (i > 0 && degree > 2 && valid_branches >= 1)) {
            count += 1;
            intersections.push({ x: curr.x, y: curr.y, number: count });
        }
    }

    return { count, intersections, branchArrows, pathLength: path.length };
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
        path.push(curr);
        const px = parent[curr.y][curr.x];
        curr = px;
    }
    path.reverse();  // start to end
    if (path.length > 0 && path[0].x === start.x && path[0].y === start.y) {
        return path;
    }
    return [];  // No path, though shouldn't happen
}

// Helper to check if a path is valid (check up to 3 cells, valid if fork or length > 3)
function isValidPath(maze, start_pos, curr_dir, checkedCells) {
    let curr_pos = getNeighbor(start_pos, curr_dir);
    let steps = 0;

    // Add first cell to checkedCells
    checkedCells.push({ x: curr_pos.x, y: curr_pos.y, direction: curr_dir });

    while (steps < 3) {
        steps++;
        if (!isInBounds(curr_pos, maze.width, maze.height)) return false;

        let cell = maze.cells[curr_pos.y][curr_pos.x];
        const open_dirs = getOpenDirections(cell);
        const degree = open_dirs.length;

        if (degree === 1) { // Dead-end
            return false;
        } else if (degree >= 3) { // Fork
            return true;
        } else { // Degree 2
            const back_dir = oppositeDir(curr_dir);
            const forward_dir = open_dirs.find(dir => dir !== back_dir);
            if (!forward_dir) return false; // Shouldn't happen

            // Check if directions are not opposite (hall bends)
            const isOpposite = (curr_dir === 'north' && back_dir === 'south') ||
                              (curr_dir === 'south' && back_dir === 'north') ||
                              (curr_dir === 'east' && back_dir === 'west') ||
                              (curr_dir === 'west' && back_dir === 'east');
            if (!isOpposite) {
                return true; // Bend
            }

            // Continue straight
            curr_dir = forward_dir;
            curr_pos = getNeighbor(curr_pos, curr_dir);
            checkedCells.push({ x: curr_pos.x, y: curr_pos.y, direction: curr_dir });
        }
    }

    return true; // Reached 3 steps in straight hall
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