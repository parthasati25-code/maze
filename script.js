/**
 * ============================================================================
 * PROJECT: MazeMaster — DSAL End-Term Project
 * FILE: frontend/script.js
 *
 * DESCRIPTION:
 * Frontend controller handling:
 * - Interactive maze grid creation and wall toggling
 * - Presets (Midterm Exam 4x4, Backtracking, No Path, Spiral, Random)
 * - Safe API communication with compiled C++ native backend (/api/solve)
 * - True step-by-step playback strictly driven by C++ recorded stack events
 * - Physical vertical stack container visualization (push/pop animations)
 * - Live DSAL terminal logging and stats dashboard
 * - Editable student information with localStorage persistence
 * ============================================================================
 */

(function () {
  'use strict';

  // --- APPLICATION STATE ---
  const state = {
    rows: 4,
    cols: 4,
    maze: [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 1]
    ],
    start: { row: 0, col: 0 },
    destination: { row: 3, col: 3 },
    editMode: 'wall', // 'wall', 'start', 'dest'
    isMouseDown: false,
    
    // C++ Execution Data
    events: [],
    finalPath: [],
    currentStepIndex: -1,
    isPlaying: false,
    timerId: null,
    animationSpeedMs: 200,

    backendConnected: false
  };

  // --- PRESET MAZES ---
  const PRESETS = {
    midterm: {
      rows: 4,
      cols: 4,
      start: { row: 0, col: 0 },
      destination: { row: 3, col: 3 },
      maze: [
        [1, 0, 0, 0],
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 1, 1]
      ]
    },
    backtrack: {
      rows: 5,
      cols: 5,
      start: { row: 0, col: 0 },
      destination: { row: 4, col: 4 },
      // Forces Down priority into dead ends at (2,0) and (4,1) to showcase pops
      maze: [
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 0],
        [1, 0, 0, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 0, 1, 1]
      ]
    },
    noPath: {
      rows: 4,
      cols: 4,
      start: { row: 0, col: 0 },
      destination: { row: 3, col: 3 },
      maze: [
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 1],
        [0, 0, 1, 1]
      ]
    },
    spiral: {
      rows: 6,
      cols: 6,
      start: { row: 0, col: 0 },
      destination: { row: 3, col: 2 },
      maze: [
        [1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1]
      ]
    }
  };

  // --- DOM ELEMENT REFERENCES ---
  const elements = {
    backendStatusPill: document.getElementById('backendStatusPill'),
    backendStatusText: document.getElementById('backendStatusText'),
    mazeGrid: document.getElementById('mazeGrid'),
    gridDimensionsBadge: document.getElementById('gridDimensionsBadge'),
    customRows: document.getElementById('customRows'),
    customCols: document.getElementById('customCols'),
    applyCustomDimBtn: document.getElementById('applyCustomDimBtn'),

    // Preset buttons
    presetMidtermBtn: document.getElementById('presetMidtermBtn'),
    presetBacktrackBtn: document.getElementById('presetBacktrackBtn'),
    presetNoPathBtn: document.getElementById('presetNoPathBtn'),
    presetSpiralBtn: document.getElementById('presetSpiralBtn'),
    presetRandomBtn: document.getElementById('presetRandomBtn'),

    // Mode buttons
    modeWallBtn: document.getElementById('modeWallBtn'),
    modeStartBtn: document.getElementById('modeStartBtn'),
    modeDestBtn: document.getElementById('modeDestBtn'),

    // Solver controls
    solveBtn: document.getElementById('solveBtn'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    playIcon: document.getElementById('playIcon'),
    pauseIcon: document.getElementById('pauseIcon'),
    playPauseLabel: document.getElementById('playPauseLabel'),
    stepPrevBtn: document.getElementById('stepPrevBtn'),
    stepNextBtn: document.getElementById('stepNextBtn'),
    resetBtn: document.getElementById('resetBtn'),
    clearBtn: document.getElementById('clearBtn'),
    speedSlider: document.getElementById('speedSlider'),
    speedLabel: document.getElementById('speedLabel'),

    // Status Banner
    statusAlertBanner: document.getElementById('statusAlertBanner'),
    bannerIcon: document.getElementById('bannerIcon'),
    bannerText: document.getElementById('bannerText'),

    // Stack and Diagnostics
    stackVessel: document.getElementById('stackVessel'),
    stackEmptyPlaceholder: document.getElementById('stackEmptyPlaceholder'),
    stackDepthBadge: document.getElementById('stackDepthBadge'),
    metricCurrentCell: document.getElementById('metricCurrentCell'),
    metricStackSize: document.getElementById('metricStackSize'),
    metricVisitedCount: document.getElementById('metricVisitedCount'),
    metricBacktrackCount: document.getElementById('metricBacktrackCount'),
    pathResultBox: document.getElementById('pathResultBox'),
    pathString: document.getElementById('pathString'),
    copyPathBtn: document.getElementById('copyPathBtn'),
    terminalBody: document.getElementById('terminalBody'),
    terminalStepCounter: document.getElementById('terminalStepCounter'),

    // Code tabs
    codeTabs: document.querySelectorAll('.code-tab'),
    codePanes: document.querySelectorAll('.code-pane'),
    codeBlockOriginal: document.getElementById('codeBlockOriginal'),
    codeBlockBackend: document.getElementById('codeBlockBackend'),
    codeBlockBridge: document.getElementById('codeBlockBridge'),

    // Student Info & Modal
    displayStudentName: document.getElementById('displayStudentName'),
    displayPRN: document.getElementById('displayPRN'),
    displayDivision: document.getElementById('displayDivision'),
    displayCollege: document.getElementById('displayCollege'),
    displaySubject: document.getElementById('displaySubject'),
    displayProblemStatement: document.getElementById('displayProblemStatement'),
    editStudentBtn: document.getElementById('editStudentBtn'),
    studentModal: document.getElementById('studentModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    inputStudentName: document.getElementById('inputStudentName'),
    inputPRN: document.getElementById('inputPRN'),
    inputDivision: document.getElementById('inputDivision'),
    inputCollege: document.getElementById('inputCollege'),
    inputSubject: document.getElementById('inputSubject'),
    inputProblemStatement: document.getElementById('inputProblemStatement'),
    saveStudentBtn: document.getElementById('saveStudentBtn'),
    resetStudentDefaultBtn: document.getElementById('resetStudentDefaultBtn')
  };

  // --- INITIALIZATION ---
  function init() {
    setupEventListeners();
    loadStudentDetails();
    renderGrid();
    checkBackendHealth();
    loadSourceCodes();
    applySpeed(parseInt(elements.speedSlider.value, 10));
  }

  // --- BACKEND HEALTH & SOURCE CODE LOADER ---
  async function checkBackendHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        state.backendConnected = true;
        const dot = elements.backendStatusPill.querySelector('.status-dot');
        dot.className = 'status-dot online';
        elements.backendStatusText.textContent = 'C++ Backend Connected';
        elements.backendStatusPill.title = `Solver: ${data.solverPath}`;
        addTerminalLog('// Connected to native C++ backend (MinGW solver.exe)', 'text-muted');
      } else {
        throw new Error('Health check responded non-200');
      }
    } catch (err) {
      state.backendConnected = false;
      const dot = elements.backendStatusPill.querySelector('.status-dot');
      dot.className = 'status-dot offline';
      elements.backendStatusText.textContent = 'C++ Disconnected (Check Server)';
      addTerminalLog('// Warning: Cannot connect to server.py backend on port 8000', 'pop');
    }
  }

  async function loadSourceCodes() {
    // Load original C++ code
    try {
      const res = await fetch('/api/original-code');
      if (res.ok) {
        const data = await res.json();
        elements.codeBlockOriginal.textContent = data.code;
      }
    } catch (e) {}

    // Load backend solver C++ code
    try {
      const res = await fetch('/api/backend-code');
      if (res.ok) {
        const data = await res.json();
        elements.codeBlockBackend.textContent = data.code;
      }
    } catch (e) {}

    // Load Python bridge code
    try {
      elements.codeBlockBridge.textContent = `# backend/server.py
# Lightweight Python Bridge connecting the web frontend to solver.exe
# Handles POST /api/solve by piping JSON to solver.exe via stdin/stdout
# Serves static frontend files with zero third-party pip dependencies.
`;
    } catch (e) {}
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Dimension presets
    document.querySelectorAll('[data-size]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-size]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const size = parseInt(btn.dataset.size, 10);
        setGridDimensions(size, size);
      });
    });

    elements.applyCustomDimBtn.addEventListener('click', () => {
      const r = parseInt(elements.customRows.value, 10);
      const c = parseInt(elements.customCols.value, 10);
      if (r >= 2 && r <= 15 && c >= 2 && c <= 15) {
        document.querySelectorAll('[data-size]').forEach(b => b.classList.remove('active'));
        setGridDimensions(r, c);
      } else {
        alert('Please enter dimensions between 2 and 15.');
      }
    });

    // Preset mazes
    elements.presetMidtermBtn.addEventListener('click', () => loadPreset('midterm'));
    elements.presetBacktrackBtn.addEventListener('click', () => loadPreset('backtrack'));
    elements.presetNoPathBtn.addEventListener('click', () => loadPreset('noPath'));
    elements.presetSpiralBtn.addEventListener('click', () => loadPreset('spiral'));
    elements.presetRandomBtn.addEventListener('click', generateRandomMaze);

    // Editing modes
    document.querySelectorAll('.btn-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.editMode = btn.dataset.mode;
      });
    });

    // Mouse drag support for grid
    window.addEventListener('mouseup', () => { state.isMouseDown = false; });

    // Solver controls
    elements.solveBtn.addEventListener('click', handleSolveMaze);
    elements.playPauseBtn.addEventListener('click', togglePlayPause);
    elements.stepNextBtn.addEventListener('click', stepForward);
    elements.stepPrevBtn.addEventListener('click', stepBackward);
    elements.resetBtn.addEventListener('click', resetExploration);
    elements.clearBtn.addEventListener('click', clearAllWalls);

    // Speed slider
    elements.speedSlider.addEventListener('input', (e) => {
      applySpeed(parseInt(e.target.value, 10));
    });

    // Copy path
    elements.copyPathBtn.addEventListener('click', () => {
      const pathText = elements.pathString.textContent;
      if (pathText && !pathText.includes('No path')) {
        navigator.clipboard.writeText(pathText);
        elements.copyPathBtn.textContent = 'Copied!';
        setTimeout(() => { elements.copyPathBtn.textContent = 'Copy'; }, 1500);
      }
    });

    // Code tabs
    elements.codeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.codeTabs.forEach(t => t.classList.remove('active'));
        elements.codePanes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const targetPane = document.getElementById(`pane-${tab.dataset.tab}`);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Student Modal
    elements.editStudentBtn.addEventListener('click', openStudentModal);
    elements.closeModalBtn.addEventListener('click', closeStudentModal);
    elements.saveStudentBtn.addEventListener('click', saveStudentDetails);
    elements.resetStudentDefaultBtn.addEventListener('click', resetStudentDefaults);
    elements.studentModal.addEventListener('click', (e) => {
      if (e.target === elements.studentModal) closeStudentModal();
    });
  }

  // --- GRID CREATION & EDITING ---
  function setGridDimensions(rows, cols) {
    state.rows = rows;
    state.cols = cols;
    state.start = { row: 0, col: 0 };
    state.destination = { row: rows - 1, col: cols - 1 };
    
    // Initialize open maze
    state.maze = [];
    for (let i = 0; i < rows; i++) {
      const rowArr = [];
      for (let j = 0; j < cols; j++) {
        rowArr.push(1);
      }
      state.maze.push(rowArr);
    }

    elements.customRows.value = rows;
    elements.customCols.value = cols;
    resetExploration();
    renderGrid();
  }

  function loadPreset(key) {
    document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`preset${key.charAt(0).toUpperCase() + key.slice(1)}Btn`);
    if (btn) btn.classList.add('active');

    const p = PRESETS[key];
    if (!p) return;

    state.rows = p.rows;
    state.cols = p.cols;
    state.start = { ...p.start };
    state.destination = { ...p.destination };
    state.maze = p.maze.map(row => [...row]);

    elements.customRows.value = p.rows;
    elements.customCols.value = p.cols;

    document.querySelectorAll('[data-size]').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.size, 10) === p.rows && p.rows === p.cols);
    });

    resetExploration();
    renderGrid();
    setStatus('idle', `Loaded preset: <strong>${key}</strong>. Click Solve Maze to execute.`);
  }

  function generateRandomMaze() {
    document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
    elements.presetRandomBtn.classList.add('active');

    // Create random maze with density ~30% walls, guaranteeing start & dest open
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        if ((r === state.start.row && c === state.start.col) ||
            (r === state.destination.row && c === state.destination.col)) {
          state.maze[r][c] = 1;
        } else {
          state.maze[r][c] = Math.random() < 0.28 ? 0 : 1;
        }
      }
    }
    resetExploration();
    renderGrid();
    setStatus('idle', 'Generated randomized maze. Click Solve Maze to test reachability.');
  }

  function clearAllWalls() {
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        state.maze[r][c] = 1;
      }
    }
    resetExploration();
    renderGrid();
    setStatus('idle', 'Cleared all walls. Maze is fully open.');
  }

  function renderGrid() {
    elements.gridDimensionsBadge.textContent = `${state.rows} \u00d7 ${state.cols} Grid`;
    elements.mazeGrid.style.gridTemplateColumns = `repeat(${state.cols}, minmax(40px, 1fr))`;
    elements.mazeGrid.innerHTML = '';

    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'maze-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;

        // Coordinate tag
        const coords = document.createElement('span');
        coords.className = 'cell-coords';
        coords.textContent = `${r},${c}`;
        cell.appendChild(coords);

        const badge = document.createElement('span');
        badge.className = 'cell-badge';
        cell.appendChild(badge);

        applyCellVisuals(cell, r, c);

        // Interaction events
        cell.addEventListener('mousedown', (e) => {
          e.preventDefault();
          state.isMouseDown = true;
          handleCellInteract(r, c);
        });

        cell.addEventListener('mouseenter', () => {
          if (state.isMouseDown && state.editMode === 'wall') {
            handleCellInteract(r, c);
          }
        });

        elements.mazeGrid.appendChild(cell);
      }
    }
  }

  function handleCellInteract(r, c) {
    if (state.isPlaying) pause();

    if (state.editMode === 'start') {
      if (r === state.destination.row && c === state.destination.col) return;
      state.start = { row: r, col: c };
      state.maze[r][c] = 1; // Start must be open
    } else if (state.editMode === 'dest') {
      if (r === state.start.row && c === state.start.col) return;
      state.destination = { row: r, col: c };
      state.maze[r][c] = 1; // Destination must be open
    } else if (state.editMode === 'wall') {
      // Don't wall the start or destination directly
      if ((r === state.start.row && c === state.start.col) ||
          (r === state.destination.row && c === state.destination.col)) {
        return;
      }
      state.maze[r][c] = state.maze[r][c] === 1 ? 0 : 1;
    }

    resetExploration();
    updateGridVisuals();
  }

  function applyCellVisuals(cellEl, r, c) {
    // Clear dynamic classes
    cellEl.classList.remove('cell-open', 'cell-wall', 'cell-start', 'cell-dest',
                            'cell-current', 'cell-explored', 'cell-backtracked', 'cell-final-path');

    const badge = cellEl.querySelector('.cell-badge');
    badge.textContent = '';

    const isStart = (r === state.start.row && c === state.start.col);
    const isDest = (r === state.destination.row && c === state.destination.col);

    if (isStart) {
      cellEl.classList.add('cell-start');
      badge.textContent = 'S';
    } else if (isDest) {
      cellEl.classList.add('cell-dest');
      badge.textContent = 'D';
    } else if (state.maze[r][c] === 0) {
      cellEl.classList.add('cell-wall');
      badge.textContent = '';
    } else {
      cellEl.classList.add('cell-open');
    }
  }

  function updateGridVisuals() {
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = elements.mazeGrid.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (cell) applyCellVisuals(cell, r, c);
      }
    }
  }

  // --- SOLVE MAZE VIA C++ BACKEND ---
  async function handleSolveMaze() {
    resetExploration();
    setStatus('running', 'Invoking native C++ solver (solver.exe)...');
    elements.solveBtn.disabled = true;

    const payload = {
      rows: state.rows,
      cols: state.cols,
      sr: state.start.row,
      sc: state.start.col,
      dr: state.destination.row,
      dc: state.destination.col,
      maze: state.maze
    };

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.events) {
        throw new Error(data.message || 'C++ backend error.');
      }

      state.events = data.events;
      state.finalPath = data.path || [];

      elements.playPauseBtn.disabled = false;
      elements.stepNextBtn.disabled = false;
      elements.stepPrevBtn.disabled = true;

      addTerminalLog(`// C++ Solver completed: ${data.status}. Recorded ${state.events.length} stack events.`, 'push');

      if (data.success) {
        setStatus('success', `Path found by C++ solver! (${state.finalPath.length} cells). Playing stack animation...`);
        formatPathString(state.finalPath);
      } else {
        setStatus('failed', `C++ Solver: ${data.message}`);
        elements.pathString.textContent = 'No path found. Stack emptied without reaching destination.';
      }

      // Auto-start animation
      play();

    } catch (err) {
      console.error(err);
      setStatus('failed', `Error: ${err.message}. Ensure backend/server.py is running!`);
      addTerminalLog(`// Error executing C++ solver: ${err.message}`, 'fail');
    } finally {
      elements.solveBtn.disabled = false;
    }
  }

  // --- STEP-BY-STEP PLAYBACK ENGINE ---
  function play() {
    if (state.events.length === 0) return;
    state.isPlaying = true;
    elements.playIcon.classList.add('hidden');
    elements.pauseIcon.classList.remove('hidden');
    elements.playPauseLabel.textContent = 'Pause';

    clearInterval(state.timerId);
    state.timerId = setInterval(() => {
      if (state.currentStepIndex < state.events.length - 1) {
        stepForward();
      } else {
        pause();
      }
    }, state.animationSpeedMs);
  }

  function pause() {
    state.isPlaying = false;
    clearInterval(state.timerId);
    elements.playIcon.classList.remove('hidden');
    elements.pauseIcon.classList.add('hidden');
    elements.playPauseLabel.textContent = 'Play';
  }

  function togglePlayPause() {
    if (state.isPlaying) {
      pause();
    } else {
      if (state.currentStepIndex >= state.events.length - 1) {
        state.currentStepIndex = -1;
      }
      play();
    }
  }

  function stepForward() {
    if (state.currentStepIndex < state.events.length - 1) {
      state.currentStepIndex++;
      renderCurrentStep();
    }
    updateControlButtons();
  }

  function stepBackward() {
    if (state.currentStepIndex > 0) {
      state.currentStepIndex--;
      renderCurrentStep();
    }
    updateControlButtons();
  }

  function updateControlButtons() {
    elements.stepPrevBtn.disabled = (state.currentStepIndex <= 0);
    elements.stepNextBtn.disabled = (state.currentStepIndex >= state.events.length - 1);
  }

  function renderCurrentStep() {
    if (state.currentStepIndex < 0 || state.currentStepIndex >= state.events.length) return;

    const event = state.events[state.currentStepIndex];

    // 1. Update Grid Cell Highlights
    updateGridToStep(state.currentStepIndex);

    // 2. Update Physical Stack Container
    renderStackSnapshot(event.stack, event.action);

    // 3. Update Metrics Dashboard
    elements.terminalStepCounter.textContent = `Step: ${event.step} / ${state.events.length}`;
    elements.metricCurrentCell.textContent = (event.cell.row >= 0) ? `(${event.cell.row}, ${event.cell.col})` : '--';
    elements.metricStackSize.textContent = event.stack.length;
    elements.metricVisitedCount.textContent = event.visitedCount;

    // Count backtracks up to current step
    let backtracksSoFar = 0;
    for (let i = 0; i <= state.currentStepIndex; i++) {
      if (state.events[i].action === 'POP') backtracksSoFar++;
    }
    elements.metricBacktrackCount.textContent = backtracksSoFar;

    // 4. Log to Terminal
    const logType = (event.action === 'PUSH') ? 'push' : (event.action === 'POP') ? 'pop' : (event.type === 'GOAL') ? 'goal' : 'line';
    addTerminalLog(`[Step ${event.step}] [${event.action}] ${event.description}`, logType);

    // 5. Goal completion visual
    if (event.type === 'GOAL') {
      highlightFinalPath();
      setStatus('success', `Destination reached! Reconstructed path in start-to-destination order.`);
    } else if (event.type === 'NO_PATH') {
      setStatus('failed', `Search terminated: Stack is empty. No valid path exists.`);
    }
  }

  function updateGridToStep(stepIdx) {
    // Reset non-wall cells to basic visual state
    updateGridVisuals();

    // Replay visits up to this step
    const visitedSet = new Set();
    const backtrackedSet = new Set();

    for (let i = 0; i <= stepIdx; i++) {
      const ev = state.events[i];
      if (ev.cell.row >= 0 && ev.cell.col >= 0) {
        const key = `${ev.cell.row},${ev.cell.col}`;
        if (ev.action === 'PUSH') {
          visitedSet.add(key);
        } else if (ev.action === 'POP') {
          backtrackedSet.add(key);
        }
      }
    }

    // Apply visited & backtracked styling
    visitedSet.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const isStart = (r === state.start.row && c === state.start.col);
      const isDest = (r === state.destination.row && c === state.destination.col);
      if (!isStart && !isDest && state.maze[r][c] === 1) {
        const cell = elements.mazeGrid.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
          cell.classList.add('cell-explored');
        }
      }
    });

    backtrackedSet.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      const isStart = (r === state.start.row && c === state.start.col);
      const isDest = (r === state.destination.row && c === state.destination.col);
      if (!isStart && !isDest && state.maze[r][c] === 1) {
        const cell = elements.mazeGrid.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
          cell.classList.remove('cell-explored');
          cell.classList.add('cell-backtracked');
        }
      }
    });

    // Highlight current top cell
    const currEvent = state.events[stepIdx];
    if (currEvent.cell.row >= 0 && currEvent.cell.col >= 0) {
      const currCell = elements.mazeGrid.querySelector(`[data-row="${currEvent.cell.row}"][data-col="${currEvent.cell.col}"]`);
      if (currCell) {
        currCell.classList.add('cell-current');
      }
    }
  }

  function highlightFinalPath() {
    state.finalPath.forEach(pt => {
      const isStart = (pt.row === state.start.row && pt.col === state.start.col);
      const isDest = (pt.row === state.destination.row && pt.col === state.destination.col);
      const cell = elements.mazeGrid.querySelector(`[data-row="${pt.row}"][data-col="${pt.col}"]`);
      if (cell && !isStart && !isDest) {
        cell.classList.remove('cell-explored', 'cell-backtracked', 'cell-current');
        cell.classList.add('cell-final-path');
      }
    });
  }

  function renderStackSnapshot(stackArr, action) {
    elements.stackDepthBadge.textContent = `Depth: ${stackArr.length}`;

    if (!stackArr || stackArr.length === 0) {
      elements.stackVessel.innerHTML = `
        <div class="stack-empty-placeholder">
          <span>Stack is empty</span>
          <small>s.empty() == true</small>
        </div>
      `;
      return;
    }

    elements.stackVessel.innerHTML = '';

    // Stack is rendered from bottom to top; our container uses flex-direction: column-reverse
    stackArr.forEach((item, idx) => {
      const isTop = (idx === stackArr.length - 1);
      const el = document.createElement('div');
      el.className = `stack-element ${isTop ? 'is-top' : ''}`;

      const coordsSpan = document.createElement('span');
      coordsSpan.className = 'elem-coords';
      coordsSpan.textContent = `Cell (${item.row}, ${item.col})`;

      const dirSpan = document.createElement('span');
      dirSpan.className = 'elem-dir';
      dirSpan.textContent = isTop ? 'TOP' : `Lv ${idx}`;

      el.appendChild(coordsSpan);
      el.appendChild(dirSpan);
      elements.stackVessel.appendChild(el);
    });
  }

  function resetExploration() {
    pause();
    state.events = [];
    state.finalPath = [];
    state.currentStepIndex = -1;

    elements.playPauseBtn.disabled = true;
    elements.stepPrevBtn.disabled = true;
    elements.stepNextBtn.disabled = true;

    elements.metricCurrentCell.textContent = '--';
    elements.metricStackSize.textContent = '0';
    elements.metricVisitedCount.textContent = '0';
    elements.metricBacktrackCount.textContent = '0';
    elements.terminalStepCounter.textContent = 'Step: 0 / 0';
    elements.pathString.textContent = 'No path calculated yet.';

    renderStackSnapshot([], 'NONE');
    updateGridVisuals();
    setStatus('idle', 'Exploration reset. Click Solve Maze (C++) to run.');
    addTerminalLog('// State reset. Ready for next solve.', 'text-muted');
  }

  // --- TERMINAL & STATUS LOGGERS ---
  function addTerminalLog(msg, type = 'line') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.textContent = msg;
    elements.terminalBody.appendChild(line);
    elements.terminalBody.scrollTop = elements.terminalBody.scrollHeight;
  }

  function setStatus(statusClass, message) {
    elements.statusAlertBanner.className = `status-banner ${statusClass}`;
    elements.bannerText.innerHTML = message;
  }

  function formatPathString(pathArr) {
    if (!pathArr || pathArr.length === 0) {
      elements.pathString.textContent = 'No path found.';
      return;
    }
    const str = pathArr.map(p => `(${p.row}, ${p.col})`).join(' -> ');
    elements.pathString.textContent = str;
  }

  function applySpeed(sliderVal) {
    const speeds = {
      1: { ms: 750, label: '0.5x Slow' },
      2: { ms: 400, label: '0.8x Relaxed' },
      3: { ms: 200, label: '1.0x Normal' },
      4: { ms: 70,  label: '2.5x Fast' },
      5: { ms: 15,  label: 'Max Turbo' }
    };
    const s = speeds[sliderVal] || speeds[3];
    state.animationSpeedMs = s.ms;
    elements.speedLabel.textContent = s.label;

    if (state.isPlaying) {
      play(); // restart timer with new interval
    }
  }

  // --- STUDENT DETAILS & LOCALSTORAGE ---
  const DEFAULT_STUDENT = {
    name: 'Parth',
    prn: '125B1B286',
    division: 'Div B',
    college: 'Pimpri Chinchwad College of Engineering (PCCOE)',
    subject: 'Data Structures and Algorithms Laboratory (DSAL)',
    problem: 'Maze Backtracking Using Stack'
  };

  function loadStudentDetails() {
    let student = DEFAULT_STUDENT;
    try {
      const saved = localStorage.getItem('mazemaster_student_info');
      if (saved) student = { ...DEFAULT_STUDENT, ...JSON.parse(saved) };
    } catch (e) {}

    elements.displayStudentName.textContent = student.name;
    elements.displayPRN.textContent = `PRN: ${student.prn}`;
    elements.displayDivision.textContent = student.division;
    elements.displayCollege.textContent = student.college;
    elements.displaySubject.textContent = student.subject;
    elements.displayProblemStatement.textContent = student.problem;
  }

  function openStudentModal() {
    elements.inputStudentName.value = elements.displayStudentName.textContent;
    elements.inputPRN.value = elements.displayPRN.textContent.replace('PRN: ', '');
    elements.inputDivision.value = elements.displayDivision.textContent;
    elements.inputCollege.value = elements.displayCollege.textContent;
    elements.inputSubject.value = elements.displaySubject.textContent;
    elements.inputProblemStatement.value = elements.displayProblemStatement.textContent;
    elements.studentModal.classList.remove('hidden');
  }

  function closeStudentModal() {
    elements.studentModal.classList.add('hidden');
  }

  function saveStudentDetails() {
    const updated = {
      name: elements.inputStudentName.value.trim() || DEFAULT_STUDENT.name,
      prn: elements.inputPRN.value.trim() || DEFAULT_STUDENT.prn,
      division: elements.inputDivision.value.trim() || DEFAULT_STUDENT.division,
      college: elements.inputCollege.value.trim() || DEFAULT_STUDENT.college,
      subject: elements.inputSubject.value.trim() || DEFAULT_STUDENT.subject,
      problem: elements.inputProblemStatement.value.trim() || DEFAULT_STUDENT.problem
    };

    localStorage.setItem('mazemaster_student_info', JSON.stringify(updated));
    loadStudentDetails();
    closeStudentModal();
  }

  function resetStudentDefaults() {
    localStorage.removeItem('mazemaster_student_info');
    loadStudentDetails();
    closeStudentModal();
  }

  // Launch application
  window.addEventListener('DOMContentLoaded', init);

})();
