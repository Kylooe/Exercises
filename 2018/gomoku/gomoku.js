var Gomoku = function() {
    var game = {
        actions: {},
    };

    game.RegAct = function(name, callback) {
        this.actions[name] = callback;
    }
    window.addEventListener('click', function(e) {
        e.stopPropagation();
        Object.keys(game.actions).forEach(function(action) {
            if(e.target.className === action) {
                game.actions[action]();
            }
        });
    });

    return game;
}

var Matrix = function() {
    var matrix = {};
    matrix.reset = function() {
        var map = [];
        for (var i = 14; i >= 0; i--) {
            map[i] = [];
        }
        this.map = map;
    };
    matrix.update = function(point) {
        this.map[point.x][point.y] = point.color;
    };

    // 横线赢法
    matrix.horizon = function(point) {
        var count = 1,
            pointer = point.x;

        // 先从左边开始搜寻
        while(pointer-1 >= 0 && this.map[pointer-1][point.y] === point.color) {
            pointer--;
            count++;
        }

        // 当搜寻至棋盘左边界或其左一位不是相同的棋子时开始搜寻右边
        pointer = point.x;
        while(pointer+1 <= 14 && this.map[pointer+1][point.y] === point.color) {
            pointer++;
            count++;
        }

        return count === 5;
    };

    // 竖线赢法
    matrix.vert = function(point) {
        var count = 1,
            pointer = point.y;
        while(pointer+1 <= 14 && this.map[point.x][pointer+1] === point.color) {
            pointer++;
            count++;
        }

        pointer = point.y;
        while(pointer-1 >= 0 && this.map[point.x][pointer-1] === point.color) {
            pointer--;
            count++;
        }
        return count === 5;
    };

    // 斜线赢法
    matrix.oblique = function(point) {
        var count = 1,
            pointerX = point.x,
            pointerY = point.y;
        while(pointerX-1 >= 0 && pointerY-1 >= 0 && this.map[pointerX-1][pointerY-1] === point.color) {
            pointerX--;
            pointerY--;
            count++;
        }
        pointerX = point.x;
        pointerY = point.y;
        while(pointerX+1 <= 14 && pointerY+1 <= 14 && this.map[pointerX+1][pointerY+1] === point.color) {
            pointerX++;
            pointerY++;
            count++;
        }
        return count === 5;
    };

    return matrix;
};

var Board = function() {
    var obj = {
        unit: 30,
        dom: document.querySelector('.chessboard'),
        canvas: document.querySelector('canvas'),
        undone: false,
    };

    var matrix = Matrix();

    var context = obj.canvas.getContext('2d');

    function disable(e) {
        e.stopPropagation();
        e.preventDefault();
    }
    obj.reset = function() {
        this.mode = 'dom';
        this.lastChess = null;

        matrix.reset();

        document.querySelector('.turn').firstChild.nodeValue = '行棋方：';
        this.turn = 'white';
        this.next();
        document.querySelector('.again').className += ' hide';

        this.dom.innerHTML = '';
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBoard();
        this.dom.removeEventListener('click', disable, false);
        this.canvas.removeEventListener('click', disable);
        document.querySelector('.operation').removeEventListener('click', disable);
    };

    // 画canvas棋盘
    obj.drawBoard = function() {
        var end = 10 + 14 * this.unit;
        this.canvas.width = this.canvas.height = end + 1 + 10;
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        context.strokeStyle = '#fff';
        for(var i = 0; i < 15; i++) {
            context.beginPath();
            context.moveTo(10, 10+i*30);  // 画横线
            context.lineTo(end, 10+i*30);
            context.closePath();
            context.stroke();
            context.beginPath();
            context.moveTo(10+i*30, 10);  // 画竖线
            context.lineTo(10+i*30, end);
            context.closePath();
            context.stroke();
        }
    };

    // 切换dom与canvas
    obj.changeMode = function(mode) {
        var show = mode === 'dom' ? this.dom : this.canvas,
            hide = mode === 'dom' ? this.canvas : this.dom;
        if(hide.className.indexOf('hide') === -1) hide.className += ' hide';
        show.className = show.className.replace(/\s*hide/, '');
        this.mode = mode;
    };

    // 落棋方
    obj.next = function() {
        var word = document.querySelector('.turn span');
        if(this.turn === 'black') {
            word.className = this.turn = 'white';
            word.innerText = '白';
        } else {
            word.className = this.turn = 'black';
            word.innerText = '黑';
        }
    };

    // 计算落子位置
    obj.calcPos = function(x, y) {
        var colorCode = this.turn  === 'black' ? 1 : 0;  // 暂定1为黑0为白
        var point = { x: 0, y: 0, color: colorCode };
        Array.prototype.forEach.call(arguments, function(value, i) {
            var offset = Math.round(value / obj.unit);
            if(i) point.y = offset;
            else point.x = offset;
        });
        this.lastChess = point;
        matrix.update(point);  // 更新棋谱
        return point;
    };

    // 渲染DOM棋子
    obj.drawDomChess = function(point) {
        var styleStr = 'top: ' + (point.y*30-10) + 'px; left: ' + (point.x*30-10) + 'px';
        return styleStr;
    };

    // 生成新棋子
    obj.createDOMChess = function(styleStr) {
        this.dom.innerHTML += '<div class="chess ' + this.turn + '" style="' + styleStr + '"></div>';
    };

    // 悔棋后重下
    obj.moveDOMChess = function(styleStr) {
        var lastChess = this.dom.lastChild;
        lastChess.setAttribute('style', styleStr);
        lastChess.className = lastChess.className.replace(' hide', '');
    };

    // canvas棋子
    obj.drawCanvasChess = function(point) {
        context.beginPath();
        context.arc(point.x*30+10, point.y*30+10, 10, 0, 360);
        if(this.turn === 'white') {
            context.fillStyle = '#fff';
            context.fill();
        } else {
            context.fillStyle = '#000';
            context.fill();
            context.stroke();
        }
        context.closePath();
    };

    obj.playChess = function(x, y) {
        var point = this.calcPos(x, y);

        var dom = this.drawDomChess(point);
        if(this.undone) {
            this.moveDOMChess(dom);
            this.undone = false;
        } else this.createDOMChess(dom);
        this.drawCanvasChess(point);

        this.win(point);
    };

    // 悔棋
    obj.undo = function() {
        // dom
        this.dom.lastChild.className += ' hide';  // 隐藏要悔棋的那一步棋子

        // canvas
        var x = this.lastChess.x*30, y = this.lastChess.y*30,
            xCenter = x+10, yCenter = y+10,
            xLeft = this.lastChess.x === 0 ? x+10 : x,
            xRight = this.lastChess.x === 14 ? x+10 : x+20,
            yTop = this.lastChess.y === 0 ? y+10 : y,
            yBottom = this.lastChess.y === 14 ? y+10 : y+20;
        context.fillStyle = '#000';
        context.strokeStyle = '#fff';
        context.fillRect(x, y, 20, 20);
        context.beginPath();
        context.moveTo(xLeft, yCenter);  // 画横线
        context.lineTo(xRight, yCenter);
        context.closePath();
        context.stroke();
        context.beginPath();
        context.moveTo(xCenter, yTop);  // 画竖线
        context.lineTo(xCenter, yBottom);
        context.closePath();
        context.stroke();

        matrix.update({ x: this.lastChess.x, y: this.lastChess.y, colorCode: undefined });  // 暂时先从棋谱中除掉这枚棋子
        this.next();
        this.undone = true;
    };

    // 撤销悔棋
    obj.redo = function() {
        // dom
        var lastChess = this.dom.lastChild;
        lastChess.className = lastChess.className.replace(' hide', '');

        // canvas
        this.drawCanvasChess(this.lastChess);

        matrix.update(this.lastChess);  // 撤销悔棋或重下都再次更新棋谱
        this.next();
        this.undone = false;
    };

    // 是否赢棋
    obj.win = function(point) {
        var isWon = matrix.horizon(point) || matrix.vert(point) || matrix.oblique(point);
        if(isWon) {
            document.querySelector('.turn').firstChild.nodeValue = '胜出方：';
            var again = document.querySelector('.again');
            again.className = again.className.replace(/\s*hide/, '');

            // 禁止点击棋盘与悔棋按钮
            this.dom.addEventListener('click', disable);
            this.canvas.addEventListener('click', disable);
            document.querySelector('.operation').addEventListener('click', disable);

        } else this.next();
    };

    return obj;
}

function main() {
    var game = Gomoku();
    var board = Board();
    board.reset();

    var chessboard = board.dom.parentNode;
    chessboard.addEventListener('click', function(e) {
            var x = e.offsetX,
                y = e.offsetY;
            if(board.mode === 'canvas') {
                x -= 10;
                y -= 10;
            }
            e.target.parentNode === this && board.playChess(x, y);
    });

    game.RegAct('dom', function() {
        board.changeMode('dom');
    });
    game.RegAct('canvas', function() {
        board.changeMode('canvas');
    });
    game.RegAct('undo', function() {
        if(board.lastChess && !board.undone) board.undo();
    });
    game.RegAct('redo', function() {
        if(board.undone) board.redo();
    });

    game.RegAct('again', function() {
        board.reset();
    });

}
main();