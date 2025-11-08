// Get a random puzzle from pregenerated puzzles
function getRandomPuzzle(difficulty) {
    let puzzles;

    if (difficulty === 'easy') {
        puzzles = EASY_PUZZLES;
    } else if (difficulty === 'medium') {
        puzzles = MEDIUM_PUZZLES;
    } else {
        puzzles = HARD_PUZZLES;
    }

    const randomIndex = Math.floor(Math.random() * puzzles.length);
    // Return a deep copy to avoid modifying the original
    return puzzles[randomIndex].map(row => [...row]);
}

// Game state
let initialPuzzle = null;
let currentGrid = null;
let selectedNumber = null;
let pencilMode = false;
let suggestions = {}; // Format: { "row-col": Set(numbers) }
let history = [];
let redoStack = [];
let prefilled = new Set();

// DOM elements
const gridElement = document.getElementById('sudoku-grid');
const numberSelectorElement = document.getElementById('number-selector');
const easyBtn = document.getElementById('easy-btn');
const mediumBtn = document.getElementById('medium-btn');
const hardBtn = document.getElementById('hard-btn');
const pencilBtn = document.getElementById('pencil-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

// Start a new game
function startNewGame(difficulty, buttonElement) {
    // Check if there's a game in progress
    if (history.length > 0) {
        if (!confirm('Are you sure you want to start a new game? Your current progress will be lost.')) {
            return;
        }
    }

    // Get a random puzzle from pregenerated puzzles (instant - no loading needed)
    initialPuzzle = getRandomPuzzle(difficulty);
    currentGrid = JSON.parse(JSON.stringify(initialPuzzle));

    // Reset game state
    selectedNumber = null;
    pencilMode = false;
    suggestions = {};
    history = [];
    redoStack = [];
    prefilled.clear();

    // Clear number selection
    document.querySelectorAll('.number-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Clear pencil mode
    if (pencilBtn.classList.contains('active')) {
        pencilBtn.classList.remove('active');
    }

    // Update prefilled cells
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (initialPuzzle[row][col] !== 0) {
                prefilled.add(`${row}-${col}`);
            }
        }
    }

    createGrid();
    updateButtons();
    updateNumberButtons();
}

// Initialize the game
function init() {
    createNumberSelector();
    // Start with an easy puzzle
    startNewGame('easy', easyBtn);
}

// Render cell content (value or suggestions)
function renderCellContent(cell, row, col) {
    cell.innerHTML = '';
    const value = currentGrid[row][col];
    const cellKey = `${row}-${col}`;

    // Remove highlight class first
    cell.classList.remove('highlighted');

    if (value !== 0) {
        // Cell has a value
        cell.textContent = value;

        // Highlight if it matches selected number
        if (selectedNumber !== null && value === selectedNumber) {
            cell.classList.add('highlighted');
        }
    } else if (suggestions[cellKey] && suggestions[cellKey].size > 0) {
        // Cell has suggestions
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'cell-suggestions';

        // Create 9 positions in 3x3 grid (positions 1-9)
        for (let pos = 1; pos <= 9; pos++) {
            const suggestionDiv = document.createElement('div');
            suggestionDiv.className = 'suggestion';
            if (suggestions[cellKey].has(pos)) {
                suggestionDiv.textContent = pos;
                // Highlight if it matches selected number
                if (selectedNumber !== null && pos === selectedNumber) {
                    suggestionDiv.classList.add('highlighted');
                }
            }
            suggestionsContainer.appendChild(suggestionDiv);
        }

        cell.appendChild(suggestionsContainer);
    }
}

// Create the 9x9 grid
function createGrid() {
    gridElement.innerHTML = '';

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            renderCellContent(cell, row, col);

            if (prefilled.has(`${row}-${col}`)) {
                cell.classList.add('prefilled');
            } else {
                cell.addEventListener('click', handleCellClick);
            }

            gridElement.appendChild(cell);
        }
    }

    validateGrid();
}

// Create number selector buttons (1-9)
function createNumberSelector() {
    for (let num = 1; num <= 9; num++) {
        const button = document.createElement('button');
        button.className = 'number-btn';
        button.textContent = num;
        button.dataset.number = num;
        button.addEventListener('click', () => selectNumber(num));
        numberSelectorElement.appendChild(button);
    }
}

// Select a number
function selectNumber(num) {
    // Check if the number is completed (can't select completed numbers)
    const targetBtn = document.querySelector(`.number-btn[data-number="${num}"]`);
    if (targetBtn && targetBtn.classList.contains('completed')) {
        return; // Don't allow selection of completed numbers
    }

    selectedNumber = num;

    // Update button styles
    document.querySelectorAll('.number-btn').forEach(btn => {
        if (parseInt(btn.dataset.number) === num) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    // Update highlighting on all cells (including suggestions)
    document.querySelectorAll('.cell').forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        renderCellContent(cell, row, col);
    });
}

// Toggle pencil mode
function togglePencilMode() {
    pencilMode = !pencilMode;
    if (pencilMode) {
        pencilBtn.classList.add('active');
    } else {
        pencilBtn.classList.remove('active');
    }
}

// Update number button visibility based on completion
function updateNumberButtons() {
    // Count occurrences of each number
    const counts = {};
    for (let num = 1; num <= 9; num++) {
        counts[num] = 0;
    }

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const value = currentGrid[row][col];
            if (value !== 0) {
                counts[value]++;
            }
        }
    }

    // Mark completed numbers (9 occurrences) as grayed out
    document.querySelectorAll('.number-btn').forEach(btn => {
        const num = parseInt(btn.dataset.number);
        if (counts[num] >= 9) {
            btn.classList.add('completed');
            // If this is the currently selected number, deselect it
            if (selectedNumber === num) {
                selectedNumber = null;
                btn.classList.remove('selected');
                // Clear highlighting from all cells
                document.querySelectorAll('.cell').forEach(cell => {
                    cell.classList.remove('highlighted');
                });
            }
        } else {
            btn.classList.remove('completed');
        }
    });
}

// Remove a number from suggestions in the same row, column, and 3x3 box
function removeSuggestionsForPlacedNumber(row, col, num) {
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    // Remove from same row
    for (let c = 0; c < 9; c++) {
        const cellKey = `${row}-${c}`;
        if (suggestions[cellKey]) {
            suggestions[cellKey].delete(num);
        }
    }

    // Remove from same column
    for (let r = 0; r < 9; r++) {
        const cellKey = `${r}-${col}`;
        if (suggestions[cellKey]) {
            suggestions[cellKey].delete(num);
        }
    }

    // Remove from same 3x3 box
    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            const cellKey = `${r}-${c}`;
            if (suggestions[cellKey]) {
                suggestions[cellKey].delete(num);
            }
        }
    }
}

// Update all cells display (useful after bulk suggestion changes)
function updateAllCellsDisplay() {
    document.querySelectorAll('.cell').forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        renderCellContent(cell, row, col);
    });
}

// Handle cell click
function handleCellClick(event) {
    if (selectedNumber === null) return;

    const cell = event.target.classList.contains('cell') ? event.target : event.target.closest('.cell');
    if (!cell) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const cellKey = `${row}-${col}`;
    const currentValue = currentGrid[row][col];

    if (pencilMode) {
        // Pencil mode: toggle suggestion
        if (currentValue !== 0) return; // Can't add suggestions to filled cells

        if (!suggestions[cellKey]) {
            suggestions[cellKey] = new Set();
        }

        const oldSuggestions = new Set(suggestions[cellKey]);

        // Toggle suggestion
        if (suggestions[cellKey].has(selectedNumber)) {
            suggestions[cellKey].delete(selectedNumber);
        } else {
            suggestions[cellKey].add(selectedNumber);
        }

        // Save state for undo
        history.push({
            row,
            col,
            oldValue: currentValue,
            newValue: currentValue,
            oldSuggestions: oldSuggestions,
            newSuggestions: new Set(suggestions[cellKey]),
            isPencil: true
        });
        redoStack = []; // Clear redo stack on new action

        renderCellContent(cell, row, col);
    } else {
        // Normal mode: place value
        const newValue = currentValue === selectedNumber ? 0 : selectedNumber;

        // Save state for undo
        const oldSuggestions = suggestions[cellKey] ? new Set(suggestions[cellKey]) : new Set();
        history.push({
            row,
            col,
            oldValue: currentValue,
            newValue: newValue,
            oldSuggestions: oldSuggestions,
            newSuggestions: new Set(),
            isPencil: false
        });
        redoStack = []; // Clear redo stack on new action

        // Update grid value
        currentGrid[row][col] = newValue;

        // Clear suggestions when placing a value
        if (newValue !== 0) {
            suggestions[cellKey] = new Set();
            // Remove this number from suggestions in same row/column/box
            removeSuggestionsForPlacedNumber(row, col, newValue);
            // Re-render all affected cells to update their suggestions
            updateAllCellsDisplay();
        } else {
            // Just update the current cell
            renderCellContent(cell, row, col);
        }

        validateGrid();
    }

    updateButtons();
    updateNumberButtons();
}

// Validate the grid and highlight invalid rows/columns/boxes
function validateGrid() {
    // Clear all validation classes
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('invalid-row', 'invalid-col', 'invalid-box',
            'invalid-box-top', 'invalid-box-bottom', 'invalid-box-left', 'invalid-box-right');
    });

    const invalidRows = new Set();
    const invalidCols = new Set();
    const invalidBoxes = new Set();

    // Check rows
    for (let row = 0; row < 9; row++) {
        const seen = new Set();
        for (let col = 0; col < 9; col++) {
            const value = currentGrid[row][col];
            if (value !== 0) {
                if (seen.has(value)) {
                    invalidRows.add(row);
                    break;
                }
                seen.add(value);
            }
        }
    }

    // Check columns
    for (let col = 0; col < 9; col++) {
        const seen = new Set();
        for (let row = 0; row < 9; row++) {
            const value = currentGrid[row][col];
            if (value !== 0) {
                if (seen.has(value)) {
                    invalidCols.add(col);
                    break;
                }
                seen.add(value);
            }
        }
    }

    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
            const seen = new Set();
            let isInvalid = false;

            for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
                for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
                    const value = currentGrid[row][col];
                    if (value !== 0) {
                        if (seen.has(value)) {
                            isInvalid = true;
                            break;
                        }
                        seen.add(value);
                    }
                }
                if (isInvalid) break;
            }

            if (isInvalid) {
                invalidBoxes.add(`${boxRow}-${boxCol}`);
            }
        }
    }

    // Apply validation classes
    document.querySelectorAll('.cell').forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const boxRow = Math.floor(row / 3);
        const boxCol = Math.floor(col / 3);

        if (invalidRows.has(row)) {
            cell.classList.add('invalid-row');
        }
        if (invalidCols.has(col)) {
            cell.classList.add('invalid-col');
        }
        if (invalidBoxes.has(`${boxRow}-${boxCol}`)) {
            cell.classList.add('invalid-box');

            // Add border classes to create a box outline
            const rowInBox = row % 3;
            const colInBox = col % 3;

            if (rowInBox === 0) cell.classList.add('invalid-box-top');
            if (rowInBox === 2) cell.classList.add('invalid-box-bottom');
            if (colInBox === 0) cell.classList.add('invalid-box-left');
            if (colInBox === 2) cell.classList.add('invalid-box-right');
        }
    });
}

// Undo last action
function undo() {
    if (history.length === 0) return;

    const action = history.pop();
    redoStack.push(action);

    const cellKey = `${action.row}-${action.col}`;
    currentGrid[action.row][action.col] = action.oldValue;
    suggestions[cellKey] = new Set(action.oldSuggestions);

    const cell = document.querySelector(`[data-row="${action.row}"][data-col="${action.col}"]`);
    renderCellContent(cell, action.row, action.col);

    validateGrid();
    updateButtons();
    updateNumberButtons();
}

// Redo last undone action
function redo() {
    if (redoStack.length === 0) return;

    const action = redoStack.pop();
    history.push(action);

    const cellKey = `${action.row}-${action.col}`;
    currentGrid[action.row][action.col] = action.newValue;
    suggestions[cellKey] = new Set(action.newSuggestions);

    const cell = document.querySelector(`[data-row="${action.row}"][data-col="${action.col}"]`);
    renderCellContent(cell, action.row, action.col);

    validateGrid();
    updateButtons();
    updateNumberButtons();
}

// Update undo/redo button states
function updateButtons() {
    undoBtn.disabled = history.length === 0;
    redoBtn.disabled = redoStack.length === 0;
}

// Event listeners
easyBtn.addEventListener('click', (e) => startNewGame('easy', e.target));
mediumBtn.addEventListener('click', (e) => startNewGame('medium', e.target));
hardBtn.addEventListener('click', (e) => startNewGame('hard', e.target));
pencilBtn.addEventListener('click', togglePencilMode);
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

// Initialize the game
init();
