'use strict';

if (window.navigator.userAgent.toLowerCase().indexOf('chrome') == -1) {
  document.querySelector('.msg').textContent = '申し訳ありません。GoogleChromeでご覧ください';
}

(function () {
  (function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;i[r] = i[r] || function () {
      (i[r].q = i[r].q || []).push(arguments);
    }, i[r].l = 1 * new Date();a = s.createElement(o), m = s.getElementsByTagName(o)[0];a.async = 1;a.src = g;m.parentNode.insertBefore(a, m);
  })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
  ga('create', 'UA-42893688-6', 'auto');
  ga('send', 'pageview');
})();

window.onerror = function (message, file, line, col, error) {
  alert(arguments.join(','));
};

jQuery.noConflict();

var APIKEY = 'yBRLWcVu3x21fniEh8IcS3hypeQ5BkT96rmFh3Wz';

var CELLCOLOR = {
  EMPTY: 0,
  BLACK: 1,
  WHITE: 2
};

var PLAYER = {
  HUMAN: 0,
  COMPUTER: 1
};

var GAMESTATE = {
  PROGRESS: 0,
  END: 1
};

var FACE = ['(*´∀｀*) .｡oO（', '(#ﾟДﾟ)', '(*ﾉД`*)･ﾟ･。', '(ﾉω･､)', '(･ω･｀*)', '(’ω’)', '(。>ω<。)', '((о(｡•ω•｡)о))', '(*　・´　∀・｀*)'];

// (Consider about introducing Immutable-js
var clone = function clone(object) {
  return jQuery.extend(true, Array.isArray(object) ? [] : {}, object);
};

var CSSTransitionGroup = React.addons.CSSTransitionGroup;

var Cell = React.createClass({
  displayName: 'Cell',

  handleCellClicked: function handleCellClicked() {
    this.props.onCellClick(this.props.row, this.props.col);
  },
  render: function render() {
    return React.createElement('div', { className: [this.props.color == CELLCOLOR.EMPTY ? 'empty' : this.props.color == CELLCOLOR.WHITE ? 'white' : 'black', 'field-cell'].join(' '), onClick: this.handleCellClicked, keys: this.props.color });
  }
});

var GameField = React.createClass({
  displayName: 'GameField',

  computerChoicedAzureMLTypeFieldColors: [],
  humanChoicedAzureMLTypeFieldColors: [],
  getInitialFieldColors: function getInitialFieldColors() {
    var fieldColors = [];
    for (var i = 0; i < 8; ++i) {
      var cols = [];
      for (var j = 0; j < 8; ++j) cols.push(0);
      fieldColors.push(cols);
    }
    fieldColors[3][3] = fieldColors[4][4] = CELLCOLOR.WHITE;
    fieldColors[3][4] = fieldColors[4][3] = CELLCOLOR.BLACK;
    return fieldColors;
  },
  getInitialState: function getInitialState() {
    return {
      fieldColors: this.getInitialFieldColors(),
      turn: PLAYER.HUMAN,
      gameState: GAMESTATE.PROGRESS
    };
  },
  getChangedFieldColors: function getChangedFieldColors(originalFieldColors, y, x, placedColor) {
    var dx = [1, 1, 1, 0, 0, -1, -1, -1];
    var dy = [1, 0, -1, 1, -1, 1, 0, -1];
    var fieldColors = clone(originalFieldColors);
    for (var i = 0; i < 8; ++i) {
      var toggleColors = function toggleColors(y, x) {
        if (y + dy[i] < 0 || y + dy[i] > 7 || x + dx[i] < 0 || x + dx[i] > 7 || fieldColors[y + dy[i]][x + dx[i]] == CELLCOLOR.EMPTY) {
          return false;
        } else if (fieldColors[y + dy[i]][x + dx[i]] == placedColor) {
          return true;
        } else {
          var chain = toggleColors(y + dy[i], x + dx[i]);
          if (chain) fieldColors[y + dy[i]][x + dx[i]] = placedColor;
          return chain;
        }
      };
      toggleColors(y, x);
    }
    fieldColors[y][x] = placedColor;
    return fieldColors;
  },
  isPlaceable: function isPlaceable(fieldColors, y, x, placedColor) {
    if (fieldColors[y][x] != CELLCOLOR.EMPTY) return false;
    var dx = [1, 1, 1, 0, 0, -1, -1, -1];
    var dy = [1, 0, -1, 1, -1, 1, 0, -1];
    var ans = false;
    for (var i = 0; i < 8; ++i) {
      var reg = function reg(_x, _x2, _x3) {
        var _again = true;

        _function: while (_again) {
          var y = _x,
              x = _x2,
              depth = _x3;
          _again = false;

          if (y + dy[i] < 0 || y + dy[i] > 7 || x + dx[i] < 0 || x + dx[i] > 7 || fieldColors[y + dy[i]][x + dx[i]] == CELLCOLOR.EMPTY) {
            return false;
          } else if (depth >= 1 && fieldColors[y + dy[i]][x + dx[i]] == placedColor) {
            return true;
          } else if (fieldColors[y + dy[i]][x + dx[i]] == placedColor) {
            return false;
          } else {
            _x = y + dy[i];
            _x2 = x + dx[i];
            _x3 = depth + 1;
            _again = true;
            continue _function;
          }
        }
      };
      ans |= reg(y, x, 0);
    }
    return ans;
  },
  getAzureMLTypeFieldColors: function getAzureMLTypeFieldColors(fieldColors) {
    var flatArray = [];
    fieldColors.forEach(function (row) {
      flatArray = flatArray.concat(row.map(function (num) {
        return num.toString();
      }));
    });
    return flatArray;
  },
  fetchMLResults: function fetchMLResults(fieldColorss) {
    // TODO: solve security problem (Is CORS Control unsafe?)
    var APIURL = 'https://a1x87i27wk.execute-api.us-west-2.amazonaws.com/bridgeForAzureMLStage/';
    var self = this;
    var postData = {
      Inputs: {
        input1: {
          ColumnNames: (function () {
            return Array(64).fill().map(function (v, i) {
              return 'Cell' + Math.floor(i / 8) + i % 8;
            });
          })().concat(['Result']),
          Values: fieldColorss.map(function (fieldColors) {
            return self.getAzureMLTypeFieldColors(fieldColors).concat(['0']);
          })
        }
      },
      GlobalParameters: {}
    };
    var postBody = JSON.stringify({
      data: postData
    });
    console.log(postData);
    return fetch(APIURL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': APIKEY
      },
      body: postBody
    }).then(function (response) {
      return response.json();
    }).then(function (obj) {
      return Promise.resolve(obj['Results']['output1']['value']['Values'].map(function (value) {
        return {
          scoredLabel: Number(value[1]),
          scoredProbability: Number(value[2])
        };
      }));
    });
  },
  getPosition: function getPosition(y, x) {
    return {
      y: y,
      x: x
    };
  },
  getPlaceablePositions: function getPlaceablePositions(fieldColors, placedColor) {
    var ans = [];
    for (var y = 0; y < 8; ++y) for (var x = 0; x < 8; ++x) {
      if (this.isPlaceable(fieldColors, y, x, placedColor)) {
        console.log('placeable: ' + y + ', ' + x);
        ans.push(this.getPosition(y, x));
      }
    }
    return ans;
  },
  place: function place(y, x) {
    var player = this.state.turn;
    var placedColor = this.getPlacedColor(player);
    var changedFieldColors = this.getChangedFieldColors(this.state.fieldColors, y, x, placedColor);
    this.setState({
      fieldColors: changedFieldColors
    });
    var self = this;
    // ( bad parts
    this.forceUpdate(function () {
      var gameState = self.getGameState(self.state.fieldColors);
      if (gameState == GAMESTATE.PROGRESS) {
        self.changeTurnTo(player == PLAYER.COMPUTER ? PLAYER.HUMAN : PLAYER.COMPUTER);
      } else {
        console.log('gameset', self.getWinner(self.state.fieldColors));
        var winner = self.getWinner(self.state.fieldColors);
        self.props.onAlert('' + (winner == PLAYER.HUMAN ? 'You WIN!' : winner == PLAYER.COMPUTER ? 'I WIN!' : 'DROW...'), winner != null ? winner : PLAYER.COMPUTER);
        self.sendTrainData(winner);
        self.setState({
          gameState: gameState
        });
      }
    });
  },
  pass: function pass() {
    console.log('pass');
    this.props.onAlert('PASS!', this.state.turn);
    var self = this;
    // ( BAD PART
    this.forceUpdate(function () {
      self.changeTurnTo(this.state.turn == PLAYER.COMPUTER ? PLAYER.HUMAN : PLAYER.COMPUTER);
    });
  },
  handleCellClicked: function handleCellClicked(y, x) {
    if (this.state.turn == PLAYER.HUMAN && this.isPlaceable(this.state.fieldColors, y, x, this.getPlacedColor(PLAYER.HUMAN))) {
      this.place(y, x);
    }
  },
  changeTurnTo: function changeTurnTo(turn) {
    if (this.state.turn == turn) return;
    this.setState({
      turn: turn
    });
    if (turn == PLAYER.HUMAN) {
      this.handleturnChangeToHuman();
    } else {
      this.handleturnChangeToComputer();
    }
  },
  getGameState: function getGameState(fieldColors) {
    var sumOfPlaceablePositions = this.getPlaceablePositions(this.state.fieldColors, CELLCOLOR.BLACK).length + this.getPlaceablePositions(this.state.fieldColors, CELLCOLOR.WHITE).length;
    if (sumOfPlaceablePositions == 0) {
      return GAMESTATE.END;
    } else {
      return GAMESTATE.PROGRESS;
    }
  },
  getWinner: function getWinner(fieldColors) {
    var numbersOfBW = [CELLCOLOR.BLACK, CELLCOLOR.WHITE].map(function (color) {
      return fieldColors.map(function (value) {
        return value.filter(function (n) {
          return n == color;
        }).length;
      }).reduce(function (prev, current) {
        return prev + current;
      });
    });
    console.log(numbersOfBW);
    if (numbersOfBW[0] == numbersOfBW[1]) {
      return null;
    } else {
      return this.getPlayer(numbersOfBW[0] > numbersOfBW[1] ? CELLCOLOR.BLACK : CELLCOLOR.WHITE);
    }
  },
  getPlacedColor: function getPlacedColor(turn) {
    return turn == PLAYER.HUMAN ? CELLCOLOR.WHITE : CELLCOLOR.BLACK;
  },
  getPlayer: function getPlayer(color) {
    return color == CELLCOLOR.WHITE ? PLAYER.HUMAN : PLAYER.COMPUTER;
  },
  handleturnChangeToHuman: function handleturnChangeToHuman() {
    this.computerChoicedAzureMLTypeFieldColors.push(this.getAzureMLTypeFieldColors(this.state.fieldColors));
    console.log(this.getPlaceablePositions(this.state.fieldColors, this.getPlacedColor(PLAYER.HUMAN)));
    if (this.getPlaceablePositions(this.state.fieldColors, this.getPlacedColor(PLAYER.HUMAN)).length == 0) this.pass();
  },
  getConfidenceLevel: function getConfidenceLevel(computerWinProbability) {
    return computerWinProbability < -(3 / 4) ? 1 : computerWinProbability < -(2 / 4) ? 2 : computerWinProbability < -(1 / 4) ? 3 : computerWinProbability < 0 ? 4 : computerWinProbability < 1 / 4 ? 5 : computerWinProbability < 2 / 4 ? 6 : computerWinProbability < 3 / 4 ? 7 : 8;
  },
  handleturnChangeToComputer: function handleturnChangeToComputer() {
    console.log('handleturnChangeToComputer');
    this.props.onUpdateMLConfidenceLevel(0);
    this.humanChoicedAzureMLTypeFieldColors.push(this.getAzureMLTypeFieldColors(this.state.fieldColors));
    var placedColor = this.getPlacedColor(PLAYER.COMPUTER);
    var placeablePositions = this.getPlaceablePositions(this.state.fieldColors, placedColor);
    if (placeablePositions.length == 0) {
      this.pass();
      return;
    }
    var self = this;
    this.fetchMLResults(placeablePositions.map(function (position) {
      return self.getChangedFieldColors(self.state.fieldColors, position.y, position.x, placedColor);
    })).then(function (results) {
      console.log(results);
      var computerWinProbabilities = results.map(function (value) {
        return Number(value.scoredProbability) * (value.scoredLabel == '1' ? 1 : -1);
      });
      // setting new field has max computerWinProbability
      var maxComputerWinProbability = Math.max.apply(null, computerWinProbabilities);
      var computerPlacePosition = placeablePositions[computerWinProbabilities.indexOf(maxComputerWinProbability)];
      console.log(maxComputerWinProbability);
      self.props.onUpdateMLConfidenceLevel(self.getConfidenceLevel(maxComputerWinProbability));
      self.place(computerPlacePosition.y, computerPlacePosition.x);
      // regist changes
      console.log(self.computerChoicedAzureMLTypeFieldColors, self.humanChoicedAzureMLTypeFieldColors);
    });
  },
  sendTrainData: function sendTrainData(winner) {
    console.log('sendTrainData');
    var APIURL = 'https://a1x87i27wk.execute-api.us-west-2.amazonaws.com/bridgeForAzureMLStage/train-data';
    var postBody = this.computerChoicedAzureMLTypeFieldColors.map(function (value) {
      return value.concat([winner == PLAYER.COMPUTER ? '1' : '0']);
    }).concat(this.humanChoicedAzureMLTypeFieldColors.map(function (value) {
      return value.map(function (n) {
        return n == '1' ? '2' : n == '2' ? '1' : '0';
      }).concat([winner == PLAYER.HUMAN ? '1' : '0']);
    }));
    console.log('traindata:', postBody);
    fetch(APIURL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': APIKEY
      },
      body: JSON.stringify(postBody)
    });
  },
  reset: function reset() {
    this.replaceState(this.getInitialState());
  },
  render: function render() {
    var rows = [];
    for (var i = 0; i < 8; ++i) {
      var cols = [];
      for (var j = 0; j < 8; ++j) {
        cols.push(React.createElement(
          'td',
          null,
          React.createElement(Cell, { row: i, col: j, color: this.state.fieldColors[i][j], onCellClick: this.handleCellClicked })
        ));
      }
      rows.push(React.createElement(
        'tr',
        null,
        cols
      ));
      this.rows = rows;
    }
    return React.createElement(
      'div',
      { className: 'gameField' },
      React.createElement(
        'table',
        null,
        rows
      )
    );
  }
});

var documentReadyPromise = new Promise(function (resolve, reject) {
  if (document.readyState == 'complete') resolve();
  document.addEventListener('DOMContentLoaded', function () {
    resolve();
  });
});

var MessageWindow = React.createClass({
  displayName: 'MessageWindow',

  render: function render() {
    var messageLayerElement = React.createElement(
      'div',
      { className: 'message-layer', key: this.props.message },
      React.createElement(
        'div',
        { className: ['message-text-box'].concat(this.props.saidPlayer == PLAYER.HUMAN ? ['said-human'] : ['said-computer']).join(' ') },
        React.createElement(
          'span',
          { className: 'message-face' },
          FACE[this.props.MLConfidenceLevel]
        ),
        React.createElement(
          'span',
          { className: 'message-text' },
          this.props.message
        )
      )
    );
    var contentElement = this.props.hidden ? null : messageLayerElement;
    return React.createElement(
      'div',
      null,
      React.createElement(
        CSSTransitionGroup,
        { transitionName: 'message-layer-transition' },
        contentElement
      )
    );
  }
});

var MLFace = React.createClass({
  displayName: 'MLFace',

  render: function render() {
    return React.createElement(
      'div',
      { className: 'mlface-box' },
      React.createElement(
        'span',
        { className: 'mlface' },
        FACE[this.props.MLConfidenceLevel]
      )
    );
  }
});

var GameContainer = React.createClass({
  displayName: 'GameContainer',

  getInitialState: function getInitialState() {
    return {
      isMessageWindowHidden: true,
      alertMessage: ''
    };
  },
  handleAlert: function handleAlert(message, saidPlayer) {
    this.setState({
      alertMessage: message,
      alertMessageSaidPlayer: saidPlayer,
      isMessageWindowHidden: false,
      MLConfidenceLevel: 0
    });
    var self = this;
    setTimeout(function () {
      self.setState({
        isMessageWindowHidden: true
      });
    });
  },
  handleUpdateMLConfidenceLevel: function handleUpdateMLConfidenceLevel(MLConfidenceLevel) {
    this.setState({
      MLConfidenceLevel: MLConfidenceLevel
    });
  },
  render: function render() {
    return React.createElement(
      'div',
      { className: 'game-container' },
      React.createElement(MLFace, { MLConfidenceLevel: this.state.MLConfidenceLevel }),
      React.createElement(GameField, { onAlert: this.handleAlert, onUpdateMLConfidenceLevel: this.handleUpdateMLConfidenceLevel }),
      React.createElement(MessageWindow, { message: this.state.alertMessage, saidPlayer: this.state.alertMessageSaidPlayer, MLConfidenceLevel: this.state.MLConfidenceLevel, hidden: this.state.isMessageWindowHidden })
    );
  }
});

documentReadyPromise.then(function () {
  React.render(React.createElement(GameContainer, null), document.querySelector('.game'));
});