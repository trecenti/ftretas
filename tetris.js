var boardCanvas, previous, state;

const TILE_SIZE = 30;

boardCanvas = document.getElementById('board');
previous = 0;

boardCanvas.width = 300;
boardCanvas.height = 600;

//Data Creation
function row() {
  return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}

function tetriminos() {
  return {
    I: { color: 'red',     coordinates: function () { return [[-1,  0], [ 0,  0], [ 1,  0], [ 2,  0]]; } },
    T: { color: 'lime',    coordinates: function () { return [[ 0, -1], [-1,  0], [ 0,  0], [ 1,  0]]; } },
    O: { color: 'blue',    coordinates: function () { return [[ 0, -1], [ 1, -1], [ 0,  0], [ 1,  0]]; } },
    J: { color: 'yellow',  coordinates: function () { return [[-1, -1], [-1,  0], [ 0,  0], [ 1,  0]]; } },
    L: { color: 'magenta', coordinates: function () { return [[ 1, -1], [-1,  0], [ 0,  0], [ 1,  0]]; } },
    S: { color: 'cyan',    coordinates: function () { return [[ 0, -1], [ 1, -1], [-1,  0], [ 0,  0]]; } },
    Z: { color: 'orange',  coordinates: function () { return [[-1, -1], [ 0, -1], [ 0,  0], [ 1,  0]]; } }
  }
}

function randomTetrimino() {
  var choices = Object.keys(tetriminos());

  return tetriminos()[choices[Math.floor(Math.random()*choices.length)]];
}

function emptyBoard() {
  var board = [];

  for (var i = 0; i < boardCanvas.height / TILE_SIZE; i++) {
    board.push(row());
  }

  return board;
}

//State management
function doesItFit(board, piece, position) {
  return piece.every(function (coord) {
    try {
      return board[position[1] + coord[1]][position[0] + coord[0]] === 0;
    } catch(e) {
      //out of bounds, doesn't fit
      return false;
    }
  });
}

function initialPosition(board, piece, position) {
  return (!doesItFit(board, piece, position) ? [position[0], position[1]+1]: position);
}

function initialState() {
  var piece = randomTetrimino();

  return {
    board: emptyBoard(),
    piece: piece.coordinates(),
    position: initialPosition(board, piece.coordinates(), [4, 0]),
    color: piece.color
  };
}

function removeCompletedLines(board) {
  function byCompletedLines(row) {
    return row.every(function (tile) { return tile !== 0; });
  }

  function byUncompleteLines(row) {
    return !row.every(function (tile) { return tile !== 0; });
  }

  board.filter(byCompletedLines).forEach(function (completedRow) {
    board.unshift(row());
  });

  return board.filter(byUncompleteLines);
}

function addPieceToBoard(state) {
  state.piece.forEach(function (coord) {
    state.board[state.position[1] + coord[1]][state.position[0] + coord[0]] = state.color;
  });

  return state.board;
}

function next(state) {
  var nextPosition = [state.position[0], state.position[1] + 1];

  if (!doesItFit(state.board, state.piece, nextPosition) && nextPosition[1] <= 2) {
    console.log('game over');
    return initialState();
  }

  if (!doesItFit(state.board, state.piece, nextPosition)) {
    var nextPiece = randomTetrimino();

    state.board = removeCompletedLines(addPieceToBoard(state));
    state.piece = nextPiece.coordinates();
    state.position = initialPosition(state.board, state.piece, [4, 0]);
    state.color = nextPiece.color;

    return state;
  }

  state.position = nextPosition;

  return state;
}

//Controls
function rotateCoord(coord) {
  return [-coord[1],coord[0]];
}

function rotate(state) {
  var newPiece = state.piece.map(rotateCoord);
  if (doesItFit(state.board, newPiece, state.position)) {
    state.piece = newPiece;
  }
  return state;
}

function move(state, xAxisModifier) {
  var newPosition = [state.position[0] + xAxisModifier, state.position[1]];
  if (doesItFit(state.board, state.piece, newPosition)) {
    state.position = newPosition;
  }
  return state;
}

function hardDrop(state) {
  while (doesItFit(state.board, state.piece, state.position)) {
    state.position = [state.position[0], state.position[1] + 1];
  }
  state.position = [state.position[0], state.position[1] - 1];
  return state;
}

//Rendering
function renderTile(x, y, color) {
  var context = boardCanvas.getContext('2d');

  context.strokeStyle = 'gray';
  context.fillStyle = color;
  context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  context.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
}

function renderBoard(board) {
  board.forEach(function (row, i) {
    row.forEach(function (tile, j) {
      var x = TILE_SIZE * j;
      var y = TILE_SIZE * i;
      renderTile(x, y, (tile !== 0 ? tile : 'black'));
    });
  });
}

function renderPiece(piece, position, color) {
  piece.forEach(function (coord) {
    var x = TILE_SIZE * (coord[0] + position[0]);
    var y = TILE_SIZE * (coord[1] + position[1]);
    renderTile(x, y, color);
  });
};

function render(state) {
  renderBoard(state.board);
  renderPiece(state.piece, state.position, state.color);
}

//Bootstrap
//have to keep state on a variable, requestAnimationFrame doesn't like functions.
state = initialState();

window.addEventListener('keyup', function (e) {
  if (e.keyCode == 38) {
    render(rotate(state));
  } else if (e.keyCode === 37) {
    render(move(state, -1));
  } else if (e.keyCode === 39) {
    render(move(state, 1));
  } else if (e.keyCode === 40) {
    render(hardDrop(state));
  }
});

render(state);

function loop(timestamp) {
  if (timestamp - previous > 1000) {
    state = next(state);
    render(state);
    previous = timestamp;
  }

  window.requestAnimationFrame(loop);
}
window.requestAnimationFrame(loop);
