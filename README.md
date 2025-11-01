# Sudoku Game

A clean, responsive Sudoku game built with HTML, CSS, and vanilla JavaScript.

## Features

- **Three difficulty levels**: Easy, Medium, and Hard
- **Pencil Mode**: Add candidate numbers to cells
- **Smart validation**: Highlights conflicting rows, columns, and 3x3 boxes in real-time
- **Undo/Redo**: Full history tracking for all moves
- **Auto-complete helpers**:
  - Completed numbers (all 9 placed) are grayed out
  - Pencil marks automatically removed when numbers are placed
  - Selected numbers highlighted across the grid
- **Responsive design**: Works on desktop, tablet, and mobile
- **Guaranteed solvable puzzles**: Every puzzle has exactly one unique solution

## How to Play

1. Click **Easy**, **Medium**, or **Hard** to start a new game
2. Select a number (1-9) from the bottom row
3. Click a cell to place that number
4. Click the same cell again to remove the number
5. Use **✏️ Pencil Mode** to add candidate numbers (small notes)
6. Use **↶ Undo** and **↷ Redo** to navigate through moves

## Technologies Used

- Pure HTML5, CSS3, and JavaScript
- No frameworks or libraries
- CSS Grid for layout
- Backtracking algorithm for puzzle generation with uniqueness verification

## Live Demo

[Play Sudoku](https://yourusername.github.io/sudoku-game)

## Local Development

Simply open `index.html` in your browser. No build process required!

## License

MIT License - Feel free to use and modify as you wish.
