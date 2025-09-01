# analyze_mazes.py
# Generates mazes, records path lengths and intersections, and prints percentile values

import random
import numpy as np
from collections import deque

# Configuration
MAZE_WIDTH = 11
MAZE_HEIGHT = 11
NUM_MAZES = 2000000  # Number of mazes to generate for analysis

# Helper to pick a weighted random position
def pick_position(width, height):
    rand = random.random()
    positions = []
    if rand < 0.66:
        # Edge
        for x in range(width):
            positions.append((x, 0))
            positions.append((x, height - 1))
        for y in range(1, height - 1):
            positions.append((0, y))
            positions.append((width - 1, y))
    elif rand < 0.66 + 0.31:
        # Middle
        for y in range(1, height - 1):
            for x in range(1, width - 1):
                positions.append((x, y))
    else:
        # Truly random
        for y in range(height):
            for x in range(width):
                positions.append((x, y))
    return random.choice(positions)

# Generate maze using recursive backtracking
def generate_backtracking_maze(width=16, height=16):
    cells = [[[True, True, True, True] for _ in range(width)] for _ in range(height)]

    directions = [
        (0, -1, 0, 1),  # north: dy=-1, opp=south
        (0, 1, 1, 0),   # south: dy=1, opp=north
        (1, 0, 2, 3),   # east: dx=1, opp=west
        (-1, 0, 3, 2)   # west: dx=-1, opp=east
    ]

    visited = [[False for _ in range(width)] for _ in range(height)]

    def carve(x, y):
        visited[y][x] = True
        random.shuffle(directions)
        for dx, dy, wall_idx, opp_wall_idx in directions:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and not visited[ny][nx]:
                cells[y][x][wall_idx] = False
                cells[ny][nx][opp_wall_idx] = False
                carve(nx, ny)

    start_x = random.randint(0, width - 1)
    start_y = random.randint(0, height - 1)
    carve(start_x, start_y)

    start = pick_position(width, height)
    end = pick_position(width, height)
    while start == end:
        end = pick_position(width, height)

    return {'width': width, 'height': height, 'cells': cells, 'start': start, 'end': end}

# Generate maze using iterative randomized Prim's
def generate_prims_maze(width=16, height=16):
    cells = [[[True, True, True, True] for _ in range(width)] for _ in range(height)]

    visited = [[False for _ in range(width)] for _ in range(height)]

    directions = [
        (0, -1, 0, 1),  # north
        (0, 1, 1, 0),   # south
        (1, 0, 2, 3),   # east
        (-1, 0, 3, 2)   # west
    ]

    def get_adjacent_walls(x, y):
        walls = []
        for dx, dy, wall_idx, opp_wall_idx in directions:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                walls.append((x, y, wall_idx, dx, dy, opp_wall_idx))
        return walls

    start_x = random.randint(0, width - 1)
    start_y = random.randint(0, height - 1)
    visited[start_y][start_x] = True

    frontier = get_adjacent_walls(start_x, start_y)

    while frontier:
        wall_idx = random.randint(0, len(frontier) - 1)
        x, y, dir_idx, dx, dy, opp_dir_idx = frontier.pop(wall_idx)
        nx, ny = x + dx, y + dy

        if 0 <= nx < width and 0 <= ny < height and not visited[ny][nx]:
            cells[y][x][dir_idx] = False
            cells[ny][nx][opp_dir_idx] = False
            visited[ny][nx] = True
            frontier.extend(get_adjacent_walls(nx, ny))

    start = pick_position(width, height)
    end = pick_position(width, height)
    while start == end:
        end = pick_position(width, height)

    return {'width': width, 'height': height, 'cells': cells, 'start': start, 'end': end}

# Randomly generate maze
def generate_random_maze(width, height):
    method = random.choice(['backtracking', 'prims'])
    if method == 'backtracking':
        return generate_backtracking_maze(width, height)
    else:
        return generate_prims_maze(width, height)

# Find critical path using BFS
def find_path(maze):
    start = maze['start']
    end = maze['end']
    cells = maze['cells']
    width = maze['width']
    height = maze['height']

    queue = deque([(start[0], start[1])])
    visited = [[False for _ in range(width)] for _ in range(height)]
    visited[start[1]][start[0]] = True
    parent = [[None for _ in range(width)] for _ in range(height)]

    directions = [
        (0, -1, 0),  # north
        (0, 1, 1),   # south
        (1, 0, 2),   # east
        (-1, 0, 3)   # west
    ]

    while queue:
        x, y = queue.popleft()
        if (x, y) == end:
            break
        for dx, dy, wall_idx in directions:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and not visited[ny][nx] and not cells[y][x][wall_idx]:
                visited[ny][nx] = True
                parent[ny][nx] = (x, y)
                queue.append((nx, ny))

    # Reconstruct path
    path = []
    curr = end
    while curr is not None:
        path.append(curr)
        curr = parent[curr[1]][curr[0]]
    path.reverse()
    if path and path[0] == start:
        return path
    return []

# Get open directions (0=north, 1=south, 2=east, 3=west)
def get_open_directions(cell):
    dirs = []
    if not cell[0]: dirs.append(0)  # north
    if not cell[1]: dirs.append(1)  # south
    if not cell[2]: dirs.append(2)  # east
    if not cell[3]: dirs.append(3)  # west
    return dirs

# Opposite direction
def opposite_dir(d):
    return (d + 2) % 4  # 0<->2, 1<->3

# Get neighbor
def get_neighbor(x, y, d):
    if d == 0: return x, y - 1  # north
    if d == 1: return x, y + 1  # south
    if d == 2: return x + 1, y  # east
    if d == 3: return x - 1, y  # west
    return x, y

# Check bounds
def is_in_bounds(nx, ny, width, height):
    return 0 <= nx < width and 0 <= ny < height

# Check if path is valid
def is_valid_path(maze, start_x, start_y, curr_d, checked_cells):
    x, y = get_neighbor(start_x, start_y, curr_d)
    steps = 0

    checked_cells.append({'x': x, 'y': y, 'direction': curr_d})

    while steps < 3:
        steps += 1
        if not is_in_bounds(x, y, maze['width'], maze['height']):
            return False

        cell = maze['cells'][y][x]
        open_dirs = get_open_directions(cell)
        degree = len(open_dirs)

        if degree == 1:  # Dead-end
            return False
        elif degree >= 3:  # Fork
            return True
        else:  # Degree 2
            back_d = opposite_dir(curr_d)
            forward_d = next(d for d in open_dirs if d != back_d)

            is_opposite = back_d == opposite_dir(curr_d)
            if not is_opposite:
                return True  # Bend

            curr_d = forward_d
            x, y = get_neighbor(x, y, curr_d)
            checked_cells.append({'x': x, 'y': y, 'direction': curr_d})

    return True  # Reached 3 steps in straight hall

# Count intersections
def count_intersections(maze, checked_cells):
    path = find_path(maze)
    if not path or len(path) < 2:
        return 0

    critical_path_set = set((p[0], p[1]) for p in path)

    count = 0
    for i in range(len(path) - 1):
        x, y = path[i]
        cell = maze['cells'][y][x]
        open_dirs = get_open_directions(cell)
        degree = len(open_dirs)

        valid_branches = 0
        branches = [d for d in open_dirs if get_neighbor(x, y, d) not in critical_path_set]

        for d in branches:
            if is_valid_path(maze, x, y, d, checked_cells):
                valid_branches += 1

        if (i == 0 and degree > 1 and valid_branches >= 1) or (i > 0 and degree > 2 and valid_branches >= 1):
            count += 1

    return count

# Main analysis function
def analyze_mazes(num_mazes, width, height):
    path_lengths = []
    intersection_counts = []
    checked_cells = []  # Dummy for is_valid_path

    generated = 0
    while generated < num_mazes:
        maze = generate_random_maze(width, height)
        path = find_path(maze)
        path_length = len(path) if path else 0
        if path_length == 0:  # Regenerate if start equals end
            continue
        intersection_count = count_intersections(maze, checked_cells)
        path_lengths.append(path_length)
        intersection_counts.append(intersection_count)
        generated += 1

    # Calculate percentiles
    percentiles = [20, 40, 60, 80, 100]
    length_percentiles = np.percentile(path_lengths, percentiles, method='nearest')
    intersection_percentiles = np.percentile(intersection_counts, percentiles, method='nearest')

    # Print results
    print(f"Path Length Percentiles ({num_mazes} Mazes, {width}x{height}):")
    for p, value in zip(percentiles, length_percentiles):
        print(f"{p}% of mazes have path length <= {int(value)}")
    print(f"\nIntersection Count Percentiles ({num_mazes} Mazes, {width}x{height}):")
    for p, value in zip(percentiles, intersection_percentiles):
        print(f"{p}% of mazes have intersection count <= {int(value)}")

# Run analysis
if __name__ == "__main__":
    analyze_mazes(NUM_MAZES, MAZE_WIDTH, MAZE_HEIGHT)