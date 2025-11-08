// Puzzle generation script - run with: node generate-puzzles.js
const fs = require('fs');

// Puzzle generation functions (copied from script.js)
function isValidPlacement(grid, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
        if (grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
        if (grid[x][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[boxRow + i][boxCol + j] === num) return false;
        }
    }

    return true;
}

function solveSudoku(grid) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) {
                // Shuffle numbers 1-9 for randomness
                const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                for (let i = numbers.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
                }

                for (let num of numbers) {
                    if (isValidPlacement(grid, row, col, num)) {
                        grid[row][col] = num;
                        if (solveSudoku(grid)) {
                            return true;
                        }
                        grid[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

// Count solutions (stop at maxCount for efficiency)
function countSolutions(grid, maxCount = 2) {
    let count = 0;

    function solve(g) {
        if (count >= maxCount) return;

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (g[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (isValidPlacement(g, row, col, num)) {
                            g[row][col] = num;
                            solve(g);
                            g[row][col] = 0;
                        }
                    }
                    return;
                }
            }
        }
        count++;
    }

    const gridCopy = grid.map(row => [...row]);
    solve(gridCopy);
    return count;
}

function hasUniqueSolution(grid) {
    return countSolutions(grid, 2) === 1;
}

function generatePuzzle(difficulty) {
    const grid = Array(9).fill(0).map(() => Array(9).fill(0));

    // Fill diagonal 3x3 boxes first
    for (let box = 0; box < 9; box += 3) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        let idx = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                grid[box + i][box + j] = numbers[idx++];
            }
        }
    }

    solveSudoku(grid);

    const cellsToRemove = difficulty === 'easy' ? 40 : difficulty === 'medium' ? 50 : 57;
    const cells = [];
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            cells.push([i, j]);
        }
    }

    // Shuffle cells
    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    // Remove cells ensuring unique solution
    let removed = 0;
    for (let [row, col] of cells) {
        if (removed >= cellsToRemove) break;

        const savedValue = grid[row][col];
        grid[row][col] = 0;

        if (hasUniqueSolution(grid)) {
            removed++;
        } else {
            grid[row][col] = savedValue;
        }
    }

    return grid;
}

// Generate puzzles
function generatePuzzles(difficulty, count) {
    console.log(`Generating ${count} ${difficulty} puzzles...`);
    const puzzles = [];

    for (let i = 0; i < count; i++) {
        const puzzle = generatePuzzle(difficulty);
        puzzles.push(puzzle);
        console.log(`  Generated ${i + 1}/${count}`);
    }

    return puzzles;
}

// Generate all puzzles
console.log('Starting puzzle generation...\n');

const easyPuzzles = generatePuzzles('easy', 50);
const mediumPuzzles = generatePuzzles('medium', 50);
const hardPuzzles = generatePuzzles('hard', 50);

// Save to files (compact format)
const easyContent = `const EASY_PUZZLES=${JSON.stringify(easyPuzzles)};`;
const mediumContent = `const MEDIUM_PUZZLES=${JSON.stringify(mediumPuzzles)};`;
const hardContent = `const HARD_PUZZLES=${JSON.stringify(hardPuzzles)};`;

fs.writeFileSync('easy-puzzles.js', easyContent);
fs.writeFileSync('medium-puzzles.js', mediumContent);
fs.writeFileSync('hard-puzzles.js', hardContent);

console.log('\n✓ Successfully generated all puzzles!');
console.log('  - easy-puzzles.js');
console.log('  - medium-puzzles.js');
console.log('  - hard-puzzles.js');
