# MazeMaster — Maze Backtracking Using Stack (DSAL Project)

> **"Find Your Way Out."**  
> *An interactive exploration of stacks and backtracking.*

A complete, interactive, full-stack Data Structures and Algorithms Laboratory (DSAL) submission website powered directly by a compiled native C++ program implementing depth-first maze backtracking.

---

## 📑 Table of Contents
1. [Project Overview](#project-overview)
2. [Project Architecture](#project-architecture)
3. [File Structure](#file-structure)
4. [How Your Original C++ Algorithm is Preserved](#how-your-original-c-algorithm-is-preserved)
5. [Prerequisites & System Requirements](#prerequisites--system-requirements)
6. [Compilation & Execution Instructions (Windows)](#compilation--execution-instructions-windows)
7. [Automated Test Suite & Verification Results](#automated-test-suite--verification-results)
8. [Features of the Web Application](#features-of-the-web-application)
9. [Comprehensive DSAL Viva Preparation Guide](#comprehensive-dsal-viva-preparation-guide)
10. [Top 15 Likely Viva Questions & Model Answers](#top-15-likely-viva-questions--model-answers)
11. [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## 1. Project Overview

- **Problem Statement:** Maze Backtracking Using Stack
- **Subject:** Data Structures and Algorithms Laboratory (DSAL)
- **Degree:** B.Tech Computer Engineering
- **Core Algorithm:** Non-recursive Depth-First Search (DFS) with Backtracking using `std::stack<Cell>` and a dynamically allocated 2D `visited` array.
- **Frontend:** Responsive, semantic HTML5, modern CSS3 (Navy Blue, White, Cyan theme), and Vanilla JavaScript.
- **Backend:** Native C++ executable (`solver.exe`) compiled with MinGW `g++`, invoked through a lightweight local Python server (`server.py`) or Node.js server (`server.js`).

---

## 2. Project Architecture

The architecture bridges a native C++ compiled binary with a modern web visualizer:

```
+-------------------------------------------------------------------+
|                        FRONTEND (Browser)                         |
|   index.html  •  style.css  •  script.js (Vanilla JS)             |
|   - Interactive Grid Editor (Walls, Start, Destination)           |
|   - Real-time Physical Stack Container Visualizer                 |
|   - Step-by-Step Play/Pause Playback Engine                       |
+-------------------------------------------------------------------+
                                  │
                       HTTP POST /api/solve (JSON)
                                  ▼
+-------------------------------------------------------------------+
|                     LOCAL SERVER BRIDGE (server.py)                |
|   - Zero third-party dependencies (uses Python standard library)  |
|   - Spawns subprocess: solver.exe                                 |
|   - Pipes maze JSON via stdin; captures JSON trace via stdout     |
+-------------------------------------------------------------------+
                                  │
                         stdin / stdout (JSON)
                                  ▼
+-------------------------------------------------------------------+
|                    C++ NATIVE ENGINE (solver.exe)                 |
|   - struct Cell { int row; int col; };                            |
|   - isValid() boundary, wall, and visited checking               |
|   - Direction Priority: 1. Down, 2. Right, 3. Up, 4. Left         |
|   - stack<Cell> s & dynamically allocated bool** visited          |
|   - if (!moved) { s.pop(); } // Backtracking                      |
|   - Secondary stack path reversal                                 |
|   - Dynamic memory deallocation (delete[])                        |
+-------------------------------------------------------------------+
```

---

## 3. File Structure

```
MazeMaster/
├── backend/
│   ├── original_code.cpp   # Exact verbatim code from your midterm submission PDF
│   ├── solver.cpp          # Production C++ engine (preserves algorithm + records JSON trace)
│   ├── solver.exe          # Compiled native Windows executable
│   ├── compile.bat         # 1-click compilation batch script using g++
│   ├── server.py           # Zero-dependency Python server (serves frontend & runs C++)
│   ├── server.js           # Node.js alternative bridge server
│   └── test_backend.py     # Automated test suite verifying 8 test scenarios
├── frontend/
│   ├── index.html          # Semantic HTML5 layout with Navy/White/Cyan DSAL theme
│   ├── style.css           # Responsive styling, physical stack container, glowing grid
│   └── script.js           # Grid interaction, C++ API calls, step-by-step stack animation
└── README.md               # Complete documentation, compilation, and viva guide
```

---

## 4. How Your Original C++ Algorithm is Preserved

Every crucial algorithmic characteristic from your midterm code (`original_code.cpp`) is preserved in `solver.cpp`:

1. **`struct Cell`**:
   ```cpp
   struct Cell {
       int row;
       int col;
   };
   ```
2. **`isValid()` Function**:
   Checks within grid bounds, ensures `maze[r][c] == 1` (open path), and verifies `!visited[r][c]`:
   ```cpp
   bool isValid(int** maze, bool** visited, int rows, int cols, int r, int c) {
       return (r >= 0 && r < rows &&
               c >= 0 && c < cols &&
               maze[r][c] == 1 &&
               !visited[r][c]);
   }
   ```
3. **Deterministic 4-Direction Priority Order**:
   Exploration priority is strictly maintained via an `else if` cascade:
   - **Step 1:** Down `(r + 1, c)`
   - **Step 2:** Right `(r, c + 1)`
   - **Step 3:** Up `(r - 1, c)`
   - **Step 4:** Left `(r, c - 1)`
4. **Immediate Marking of Visited Cells**:
   Cells are marked `visited[r][c] = true` *immediately* when pushed onto `s`.
5. **Backtracking on Dead End**:
   When all 4 directions fail, `moved` remains `false`, executing:
   ```cpp
   if (!moved) {
       s.pop();
   }
   ```
6. **Reconstructing Final Path via Secondary Stack**:
   The primary stack holds elements from destination down to start. A secondary stack `stack<Cell> path` inverts this order, outputting the path from start to destination:
   ```cpp
   stack<Cell> path;
   while (!s.empty()) {
       path.push(s.top());
       s.pop();
   }
   ```
7. **Dynamic Memory Deallocation**:
   Dynamic 2D arrays are deallocated using `delete[]` loops to prevent leaks.

### Minimal Modifications Made:
- Standard input reads JSON instead of interactive `cin` prompts so the local server can transmit the web grid.
- Records an `AlgorithmEvent` object upon each push, pop, and goal check to send a chronological event history to the frontend.

---

## 5. Prerequisites & System Requirements

- **Operating System:** Windows 10 or Windows 11
- **C++ Compiler:** MinGW `g++` (GCC 6.3.0 or higher)
- **Runtime Bridge:** Python 3.x (already installed on Windows) or Node.js

---

## 6. Compilation & Execution Instructions (Windows)

### Step 1: Open PowerShell or Command Prompt
Navigate to the `MazeMaster` project directory:
```powershell
cd C:\Users\bhand\.gemini\antigravity\scratch\MazeMaster
```

### Step 2: Compile the C++ Backend
Run the included batch script:
```powershell
.\backend\compile.bat
```
*Or compile manually with `g++`:*
```powershell
g++ -std=c++11 -O2 backend\solver.cpp -o backend\solver.exe
```

### Step 3: Run the Automated Backend Tests
Verify all 8 test cases before starting the server:
```powershell
python backend\test_backend.py
```

### Step 4: Start the Local Server
```powershell
python backend\server.py
```
*(If you prefer Node.js, run: `node backend\server.js`)*

The terminal will display:
```
=================================================================
  MAZEMASTER LOCAL SERVER (C++ BACKEND BRIDGE)
=================================================================
  Server URL:       http://localhost:8000
  Frontend Folder:  C:\Users\bhand\...\MazeMaster\frontend
  C++ Solver:       C:\Users\bhand\...\MazeMaster\backend\solver.exe
  Status:           Ready & Listening on port 8000
=================================================================
```

### Step 5: Open the Website
Open your browser and navigate to:
```
http://localhost:8000
```

---

## 7. Automated Test Suite & Verification Results

The automated test suite (`test_backend.py`) was executed on the compiled `solver.exe` binary. All 8 tests passed with a **100% success rate**:

| Test # | Test Scenario | Input Configuration | Result | Output / Validation |
|---|---|---|---|---|
| **1** | **Midterm PDF Exam 4x4 Case** | Exact matrix from your PDF exam | **PASS** | `(0,0) -> (1,0) -> (1,1) -> (2,1) -> (3,1) -> (3,2) -> (3,3)` |
| **2** | **Backtracking Required** | Dead end branch forced by Down priority | **PASS** | Backtracks recorded (`s.pop()` called > 0) |
| **3** | **No Valid Path Exists** | Destination surrounded by walls | **PASS** | `status: NO_PATH`, gracefully terminates on empty stack |
| **4** | **Blocked Starting Cell** | `maze[0][0] = 0` | **PASS** | `status: BLOCKED_ENDPOINT` validation error returned |
| **5** | **Blocked Destination Cell**| `maze[dr][dc] = 0` | **PASS** | `status: BLOCKED_ENDPOINT` validation error returned |
| **6** | **Out-of-Bounds Coordinates**| `sr = -1, dr = 3` on 3x3 grid | **PASS** | `status: INVALID_COORDINATES` validation error returned |
| **7** | **One-Cell Maze** | 1x1 grid with Start == Destination | **PASS** | Solved in 1 step: path length = 1 |
| **8** | **Complex 6x6 Maze** | Multiple corridors and loops | **PASS** | Solved in 12 steps: path length = 11 |

---

## 8. Features of the Web Application

1. **Interactive Maze Canvas:**
   - Click and drag cells to toggle walls (`0`) and open passages (`1`).
   - Change start (`S`) and destination (`D`) coordinates dynamically.
   - Quick presets: Midterm Exam 4x4, Backtracking Test, No Path, Spiral, and Random Solvable Maze generator.
2. **True Stack Data Structure Simulation:**
   - Physical vertical stack vessel rendering elements from bottom to top.
   - Pointer indicating `s.top()` in real time.
   - Real-time push and pop animations.
3. **Playback & Speed Controls:**
   - Step Forward and Step Backward to explain individual push/pop transitions during your viva.
   - Play/Pause automated playback.
   - 5-level speed slider (0.5x Slow, 0.8x Relaxed, 1.0x Normal, 2.5x Fast, Max Turbo).
4. **Live Diagnostics & Terminal Log:**
   - Displays Current Top Cell, Stack Depth, Visited Count, and Backtrack (Pop) Count.
   - Formatted C++ terminal output stream showing student-friendly explanations of every step.
   - Reconstructed solution path display with a 1-click "Copy" button.
5. **Academic Viva Guide & C++ Source Code:**
   - Theoretical explanations of Stacks, LIFO, Backtracking, and complexity derivations.
   - Complete comparison table between DFS (Stack) and BFS (Queue).
   - Side-by-side code tabs displaying your original exam code, backend C++ solver, and server bridge.
6. **Editable Student Information Card:**
   - Editable Name, PRN, Division, College Name, Subject, and Problem Statement.
   - Automatically saved to `localStorage` so your details persist across browser refreshes.

---

## 9. Comprehensive DSAL Viva Preparation Guide

### A. The Core Principle: LIFO and Backtracking
- A **stack** is a restricted linear data structure where elements are added and removed only from the **top**.
- In maze traversal, when we decide to move to a neighboring cell, we save our path history by **pushing** the new cell onto the stack.
- When we reach a **dead end** (all 4 cardinal directions are either walls, out of bounds, or previously visited), we cannot proceed.
- To recover, we **backtrack**: we **pop** the dead-end cell off the stack. The new top of the stack is the cell we came from, allowing us to test its next candidate direction.

### B. Time & Space Complexity Derivation
- **Time Complexity:** $\mathcal{O}(R \times C)$
  - In a maze of $R$ rows and $C$ columns, there are at most $R \times C$ cells.
  - Thanks to the `visited[r][c]` boolean array, each cell is marked upon entry and is **never pushed more than once**.
  - At each cell, checking the 4 directions takes $\mathcal{O}(1)$ constant time.
  - Therefore, the maximum number of pushes and pops is $2 \times (R \times C)$, yielding a strict $\mathcal{O}(R \times C)$ upper bound.
- **Space Complexity:** $\mathcal{O}(R \times C)$
  - Visited 2D array: requires $R \times C$ boolean values.
  - Stack storage: in the worst case (a snake-like path winding through every cell), the stack stores up to $R \times C$ cells.
  - Auxiliary space is $\mathcal{O}(R \times C)$.

---

## 10. Top 15 Likely Viva Questions & Model Answers

#### Q1: What is the problem statement of your project?
> **Answer:** "Maze Backtracking Using Stack. The objective is to find a path from a designated start coordinate to a destination coordinate in a 2D grid using a stack-based depth-first search and backtracking mechanism."

#### Q2: Why is a stack data structure used instead of a queue or array?
> **Answer:** "A stack operates on the Last-In, First-Out (LIFO) principle. Backtracking requires us to return to the most recent decision point when hitting a dead end. The top of the stack always represents our current position, and calling `pop()` immediately returns us to our previous position."

#### Q3: What is the direction priority in your program, and why does order matter?
> **Answer:** "The priority is: **1. Down, 2. Right, 3. Up, 4. Left**. Order matters because the algorithm deterministically selects the first valid unvisited neighbor using an `else if` cascade. Changing the order changes the exploration order and the path found."

#### Q4: Does your algorithm guarantee the shortest path?
> **Answer:** "No. Stack-based backtracking implements Depth-First Search (DFS), which returns the *first* valid path it discovers based on direction priority. To guarantee the shortest path in an unweighted grid, Breadth-First Search (BFS) using a Queue must be used."

#### Q5: What is the purpose of the `visited` array?
> **Answer:** "The `visited` 2D boolean array prevents infinite loops. Without it, the algorithm would oscillate back and forth between adjacent open cells (e.g., from (0,0) to (1,0) and back to (0,0)) indefinitely."

#### Q6: When exactly is a cell marked as visited in your program?
> **Answer:** "A cell is marked visited *immediately* when it is pushed onto the stack. This ensures no other branch attempts to explore this cell while it is part of the active search."

#### Q7: What does the variable `bool moved` signify?
> **Answer:** "It is a flag initialized to `false` at each iteration. If any of the 4 directional checks (`Down`, `Right`, `Up`, `Left`) succeed, a cell is pushed and `moved` becomes `true`. If all 4 checks fail, `moved` remains `false`, indicating a dead end and triggering `s.pop()`."

#### Q8: How is the final path reconstructed and printed in the correct order?
> **Answer:** "At the destination, the primary stack `s` holds cells from destination down to start (LIFO). To output the path from start to destination, we pop elements from `s` and push them into a temporary secondary stack `path`. Popping from `path` then prints the coordinates in the correct start-to-destination order."

#### Q9: What happens if there is no path from start to destination?
> **Answer:** "The while loop continues popping dead ends until the stack becomes completely empty (`s.empty() == true`). The loop terminates, and the function outputs `'No path exists!'`."

#### Q10: How do you handle dynamic memory in C++ to prevent memory leaks?
> **Answer:** "Every 2D array allocated with `new int*[rows]` or `new bool*[rows]` has its individual rows deallocated in a loop via `delete[] array[i]`, followed by `delete[] array`. Both the maze and visited matrices are deallocated upon function exit."

#### Q11: What are the edge cases handled by your code?
> **Answer:** 
> 1. Start equals Destination (`sr == dr && sc == dc`).
> 2. Single-cell maze (`1x1`).
> 3. Blocked start cell or blocked destination cell (`maze == 0`).
> 4. Out-of-bounds start or destination coordinates.
> 5. Completely walled mazes with no exit.

#### Q12: How does the frontend communicate with your C++ code?
> **Answer:** "The frontend does not simulate the algorithm in JavaScript. When the user clicks 'Solve Maze', a JSON payload containing the grid and coordinates is sent via HTTP POST to our local server bridge (`server.py`). The bridge executes the compiled `solver.exe` binary, which parses the input, executes the backtracking algorithm, and returns a JSON trace of all stack events."

#### Q13: What is the difference between recursive backtracking and stack backtracking?
> **Answer:** "Recursive backtracking uses the compiler's implicit call stack, which can cause stack overflow errors on large mazes. Our program uses an explicit, iterative `std::stack<Cell>` in heap memory, giving us full control over memory and state."

#### Q14: What is the time and space complexity of your algorithm?
> **Answer:** "Time Complexity is $\mathcal{O}(R \times C)$ because each of the $R \times C$ cells is pushed and popped at most once. Auxiliary Space Complexity is $\mathcal{O}(R \times C)$ for the stack and visited array."

#### Q15: Name two real-world applications of stacks and backtracking.
> **Answer:** 
> 1. **Compiler Syntax Parsing:** Validating matching parentheses, brackets, and XML/HTML tags.
> 2. **Puzzle & Constraint Satisfaction:** Sudoku solvers, the N-Queens problem, and routing algorithms in robotics.

---

## 11. Troubleshooting & FAQs

- **Error: `solver.exe` not found:**  
  Make sure you ran `backend\compile.bat` or `g++ -std=c++11 -O2 backend\solver.cpp -o backend\solver.exe`.
- **Port 8000 is already in use:**  
  Change `PORT = 8000` to `PORT = 8080` in `backend/server.py`.
- **Browser shows "C++ Backend Disconnected":**  
  Ensure `python backend\server.py` is currently running in your terminal.
