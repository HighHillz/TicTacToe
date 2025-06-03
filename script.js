// Player tokens and their properties
class Token {
    static rgb_values = {
        red: "(255,0,0)",
        blue: "(0,0,255)",
        yellow: "(255,255,0)",
        green: "(0,255,0)"
    };
    constructor(colour) {
        this.colour = Token.rgb_values[colour];
        this.class = `${colour}-token`;
    }
    getBgColour() {
        const rgb = this.colour.replace(/[()]/g, "").split(",").map(Number);
        const bg_rgb = rgb.map(i => (i === 255 ? 15 : 0));
        return `rgb(${bg_rgb.join(", ")})`;
    }
    getFontColour() {
        return `rgb${this.colour}`;
    }
    getCardColours() {
        const curr_colour = this.colour.replace(/[()]/g, "").split(",").map(Number);
        const [font, bg1, bg2] = [[], [], []];
        curr_colour.forEach(i => {
            if (i === 255) {
                font.push(255); bg1.push(140); bg2.push(200);
            } else {
                font.push(118); bg1.push(0); bg2.push(0);
            }
        });
        return {
            fontColour: () => `rgb(${font.join(", ")})`,
            bgColour: () => `linear-gradient(135deg,rgb(${bg1.join(", ")}) 40%,rgb(${bg2.join(", ")}) 100%)`
        };
    }
}

// Grid properties
class Grid {
    static tableCount = 0;
    constructor(board, rows, cols) {
        this.board = document.getElementById(board);
        this.rows = rows;
        this.cols = cols;
    }
    createGrid(cell_width, cell_height, table_class = false) {
        this.board.innerHTML = "";
        Grid.tableCount += 1;
        const table = document.createElement("table");
        if (table_class) table.classList.add(table_class);
        for (let i = 0; i < this.rows; i++) {
            const row = document.createElement("tr");
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement("td");
                cell.id = `${Grid.tableCount}-${i}-${j}`;
                cell.classList.add("cell");
                Object.assign(cell.style, { width: `${cell_width}px`, height: `${cell_height}px` });
                row.appendChild(cell);
            }
            table.appendChild(row);
        }
        this.board.appendChild(table);
    }
    static init() {
        Grid.tableCount = 0;
    }
}

// Bot logic
class Bot {
    constructor(name, board_id, board_size, win_length, token) {
        this.name = name;
        this.board_id = board_id;
        this.win_lines = generateWinningLines(board_size, win_length);
        this.token = token;
    }
    getAvailableCells() {
        return [...document.querySelectorAll(`#${this.board_id} .cell`)].filter(cell => !cell.innerHTML);
    }
    getAllCells() {
        return [...document.querySelectorAll(`#${this.board_id} .cell`)];
    }
    play() {
        // To be overridden by subclasses
        throw new Error("play() must be implemented in subclasses.");
    }
}
class RandomBot extends Bot {
    play() {
        const available = this.getAvailableCells();
        const randomIndex = Math.floor(Math.random() * available.length);
        return available[randomIndex];
    }
}

// Common game properties
class Game {
    constructor(playerCount, max_score = Infinity) {
        this.max_score = max_score;
        this.start_turn = 0;
        this.round = 0;
        this.curr_player = "";
        this.winner = "";
        this.playerCount = playerCount;
        this.gameOver = false;
    }
    static setBot(name, board_id) {
        switch(name) {
            case "RandomBot": 
                return new RandomBot(name, board_id);
        }
    }
    updateRound() {
        document.getElementById("round").innerHTML = `Round ${this.round}`;
    }
    resetGame() {
        document.getElementById("proceed").innerHTML = "Start <b>round 1</b>!";
        document.getElementById("round").innerHTML = "";
        document.getElementById("turn").innerHTML = "";
    }
    nextTurn() {
        this.turn = this.turn === this.playerCount ? 1 : this.turn + 1;
    }
    updateTurn(player, colour) {
        const turnElem = document.getElementById("turn");
        turnElem.innerHTML = player;
        turnElem.style.color = colour;
    }
    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }
}

// Classic Tic Tac Toe
class ClassicTicTacToe extends Game {
    #player_data;
    constructor(board) {
        super(2, 10);
        this.#player_data = { //[Name, Type, Token, Score]
            player1: [document.getElementById("field1").value, document.getElementById("field1").player, new Token("red"), 0],
            player2: [document.getElementById("field2").value, document.getElementById("field2").player, new Token("blue"), 0]
        };
        this.board = board;
        this.turn = this.start_turn;
        this.bot_set = {};
        this.setBots();
        this.updateScore();
        document.getElementById("player1_name").innerHTML = this.#player_data.player1[0];
        document.getElementById("player2_name").innerHTML = this.#player_data.player2[0];
    }
    setBots() {
        Object.entries(this.#player_data).forEach(([key, val]) => {
            if (val[1] === "Bot") this.bot_set[key] = Game.setBot(val[0], "board");
        });
    }
    startNewRound() {
        this.round++;
        this.gameOver = false;
        this.start_turn = this.start_turn === this.playerCount ? 1 : this.start_turn + 1;
        this.turn = this.start_turn;
        this.getBoard();
        this.getCurrentPlayer();
        this.updateRound();
        this.playTurn();
    }
    getCurrentPlayer() {
        this.curr_player = `player${this.turn}`;
        this.updateTurn(this.#player_data[this.curr_player][0], this.#player_data[this.curr_player][2].getFontColour());
    }
    getBoard() {
        Grid.init();
        new Grid(this.board, 3, 3).createGrid(100, 100);
    }
    playTurn() {
        if (!this.gameOver) {
            document.body.style.backgroundColor = this.#player_data[this.curr_player][2].getBgColour();
            this.#player_data[this.curr_player][1] === "Player" ? this.player() : this.bot();
        }
    }
    player() {
        const boardElem = document.getElementById(this.board);
        boardElem.onclick = e => {
            const cell = e.target;
            if (cell.classList.contains("cell") && !cell.innerHTML) {
                const token = this.#player_data[this.curr_player][2].class;
                cell.innerHTML = `<i class="${token}"></i>`;
                boardElem.onclick = () => {};
                this.checkGameState();
            }
        };
    }
    bot() {
        setTimeout(() => {
            const cell = this.bot_set[this.curr_player].play();
            const token = this.#player_data[this.curr_player][2].class;
            cell.innerHTML = `<i class="${token}"></i>`;
            this.checkGameState();
        }, Game.getRandomInt(500, 1000));
    }
    checkGameState() {
        const cells = [...document.querySelector(`#${this.board}`).querySelectorAll(".cell")];
        const winning_lines = generateWinningLines(3, 3);
        for (const [a, b, c] of winning_lines) {
            if (cells[a].innerHTML && cells[a].innerHTML === cells[b].innerHTML && cells[a].innerHTML === cells[c].innerHTML) {
                this.gameOver = true;
                const classList = cells[a].querySelector("i").classList;
                if (classList.contains("red-token")) {
                    this.#player_data.player1[3]++;
                    this.winner = this.#player_data.player1[0];
                } else if (classList.contains("blue-token")) {
                    this.#player_data.player2[3]++;
                    this.winner = this.#player_data.player2[0];
                }
                break;
            }
        }
        if (!this.gameOver && cells.every(cell => cell.innerHTML)) {
            this.gameOver = true;
            this.winner = "";
        }
        if (!this.gameOver) {
            this.nextTurn();
            this.getCurrentPlayer();
            this.playTurn();
        } else {
            this.endRound();
        }
    }
    updateScore() {
        document.getElementById("player1_score").innerHTML = this.#player_data.player1[3];
        document.getElementById("player2_score").innerHTML = this.#player_data.player2[3];
    }
    endRound() {
        const proceed = document.getElementById("proceed");
        openPopup("message");
        document.getElementById("stat").innerHTML = this.winner
            ? `<b>${this.winner}</b> wins <b>round ${this.round}</b>!`
            : `Nobody wins <b>round ${this.round}</b> :(`;
        proceed.innerHTML = `Start <b>round ${this.round + 1}</b>!`;
        proceed.style.display = "none";
        setTimeout(() => this.updateScore(), 1000);
        if (this.#player_data.player1[3] === this.max_score || this.#player_data.player2[3] === this.max_score) {
            const winner = this.#player_data.player1[3] === this.max_score ? "player1" : "player2";
            setTimeout(() => this.endGame(winner), 2000);
        } else {
            setTimeout(() => {
                proceed.style.display = "block";
                proceed.onclick = () => {
                    this.startNewRound();
                    closePopup("message");
                };
            }, 2000);
        }
    }
    endGame(winner) {
        closePopup("message");
        openPopup("closing_message");
        const winnerToken = this.#player_data[winner][2].getCardColours();
        document.getElementById("closing_message").style.background = winnerToken.bgColour();
        document.getElementById("closing_stat").style.color = winnerToken.fontColour();
        document.getElementById("closing_stat").innerHTML = `<b>${this.#player_data[winner][0]}</b> wins the game!`;
        setTimeout(() => {
            const homeBtn = document.getElementById("home-btn");
            homeBtn.style.display = "block";
            homeBtn.onclick = () => {
                document.getElementById("extra").style.display = "none";
                document.getElementById("home").style.display = "block";
                document.body.style.background = "#111111";
            };
        }, 1000);
    }
}

// Large Tic Tac Toe (4 players)
class LargeTicTacToe extends Game {
    #player_data;
    constructor(board) {
        super(4, 7);
        this.#player_data = {
            player1: [document.getElementById("field1").value, document.getElementById("field1").player, new Token("red"), 0],
            player2: [document.getElementById("field2").value, document.getElementById("field2").player, new Token("blue"), 0],
            player3: [document.getElementById("field3").value, document.getElementById("field3").player, new Token("yellow"), 0],
            player4: [document.getElementById("field4").value, document.getElementById("field4").player, new Token("green"), 0]
        };
        this.board = board;
        this.turn = this.start_turn;
        this.bot_set = {};
        this.setBots();
        this.updateScore();
        ["player1", "player2", "player3", "player4"].forEach((p, i) => {
            document.getElementById(`${p}_name`).innerHTML = this.#player_data[p][0];
        });
    }
    setBots() {
        Object.entries(this.#player_data).forEach(([key, val]) => {
            if (val[1] === "Bot") this.bot_set[key] = Game.setBot(val[0], "board");
        });
    }
    startNewRound() {
        this.round++;
        this.gameOver = false;
        this.start_turn = this.start_turn === this.playerCount ? 1 : this.start_turn + 1;
        this.turn = this.start_turn;
        this.getBoard();
        this.getCurrentPlayer();
        this.updateRound();
        this.playTurn();
    }
    getCurrentPlayer() {
        this.curr_player = `player${this.turn}`;
        this.updateTurn(this.#player_data[this.curr_player][0], this.#player_data[this.curr_player][2].getFontColour());
    }
    getBoard() {
        Grid.init();
        new Grid(this.board, 6, 6).createGrid(50, 50);
    }
    playTurn() {
        if (!this.gameOver) {
            document.body.style.backgroundColor = this.#player_data[this.curr_player][2].getBgColour();
            this.#player_data[this.curr_player][1] === "Player" ? this.player() : this.bot();
        }
    }
    player() {
        const boardElem = document.getElementById(this.board);
        boardElem.onclick = e => {
            const cell = e.target;
            if (cell.classList.contains("cell") && !cell.innerHTML) {
                const token = this.#player_data[this.curr_player][2].class;
                cell.innerHTML = `<i class="${token}-2"></i>`;
                boardElem.onclick = () => {};
                this.checkGameState();
            }
        };
    }
    bot() {
        setTimeout(() => {
            const cell = this.bot_set[this.curr_player].play();
            const token = this.#player_data[this.curr_player][2].class;
            cell.innerHTML = `<i class="${token}-2"></i>`;
            this.checkGameState();
        }, Game.getRandomInt(500, 1000));
    }
    checkGameState() {
        const cells = [...document.querySelector(`#${this.board}`).querySelectorAll(".cell")];
        const winning_lines = generateWinningLines(6, 4);
        for (const [a, b, c, d] of winning_lines) {
            if (cells[a].innerHTML && cells[a].innerHTML === cells[b].innerHTML && cells[a].innerHTML === cells[c].innerHTML && cells[a].innerHTML === cells[d].innerHTML) {
                this.gameOver = true;
                const classList = cells[a].querySelector("i").classList;
                if (classList.contains("red-token-2")) {
                    this.#player_data.player1[3]++;
                    this.winner = this.#player_data.player1[0];
                } else if (classList.contains("blue-token-2")) {
                    this.#player_data.player2[3]++;
                    this.winner = this.#player_data.player2[0];
                } else if (classList.contains("yellow-token-2")) {
                    this.#player_data.player3[3]++;
                    this.winner = this.#player_data.player3[0];
                } else if (classList.contains("green-token-2")) {
                    this.#player_data.player4[3]++;
                    this.winner = this.#player_data.player4[0];
                }
                break;
            }
        }
        if (!this.gameOver && cells.every(cell => cell.innerHTML)) {
            this.gameOver = true;
            this.winner = "";
        }
        if (!this.gameOver) {
            this.nextTurn();
            this.getCurrentPlayer();
            this.playTurn();
        } else {
            this.endRound();
        }
    }
    updateScore() {
        ["player1", "player2", "player3", "player4"].forEach(p => {
            document.getElementById(`${p}_score`).innerHTML = this.#player_data[p][3];
        });
    }
    endRound() {
        const proceed = document.getElementById("proceed");
        openPopup("message");
        document.getElementById("stat").innerHTML = this.winner
            ? `<b>${this.winner}</b> wins <b>round ${this.round}</b>!`
            : `Nobody wins <b>round ${this.round}</b> :(`;
        proceed.innerHTML = `Start <b>round ${this.round + 1}</b>!`;
        proceed.style.display = "none";
        setTimeout(() => this.updateScore(), 1000);
        const max = this.max_score;
        const pd = this.#player_data;
        if ([pd.player1[3], pd.player2[3], pd.player3[3], pd.player4[3]].includes(max)) {
            const winner = Object.keys(pd).find(k => pd[k][3] === max);
            setTimeout(() => this.endGame(winner), 2000);
        } else {
            setTimeout(() => {
                proceed.style.display = "block";
                proceed.onclick = () => {
                    this.startNewRound();
                    closePopup("message");
                };
            }, 2000);
        }
    }
    endGame(winner) {
        closePopup("message");
        openPopup("closing_message");
        const winnerToken = this.#player_data[winner][2].getCardColours();
        document.getElementById("closing_message").style.background = winnerToken.bgColour();
        document.getElementById("closing_stat").style.color = winnerToken.fontColour();
        document.getElementById("closing_stat").innerHTML = `<b>${this.#player_data[winner][0]}</b> wins the game!`;
        setTimeout(() => {
            const homeBtn = document.getElementById("home-btn");
            homeBtn.style.display = "block";
            homeBtn.onclick = () => {
                document.getElementById("extra").style.display = "none";
                document.getElementById("home").style.display = "block";
                document.body.style.background = "#111111";
            };
        }, 1000);
    }
}

// Utility functions
function generateWinningLines(N, K) {
    const lines = [];
    for (let r = 0; r < N; r++) { // Horizontal lines
        for (let c = 0; c <= N - K; c++) {
            const line = [];
            for (let k = 0; k < K; k++) {
                line.push(r * N + (c + k));
            }
            lines.push(line);
        }
    }
    for (let c = 0; c < N; c++) { // Vertical lines
        for (let r = 0; r <= N - K; r++) {
            const line = [];
            for (let k = 0; k < K; k++) {
                line.push((r + k) * N + c);
            }
            lines.push(line);
        }
    }
    for (let r = 0; r <= N - K; r++) { // Diagonal (\)
        for (let c = 0; c <= N - K; c++) {
            const line = [];
            for (let k = 0; k < K; k++) {
                line.push((r + k) * N + (c + k));
            }
            lines.push(line);
        }
    }
    for (let r = 0; r <= N - K; r++) { // Anti-diagonal (/)
        for (let c = K - 1; c < N; c++) {
            const line = [];
            for (let k = 0; k < K; k++) {
                line.push((r + k) * N + (c - k));
            }
            lines.push(line);
        }
    }
    return lines;
}
function openPopup(popup) {
    document.getElementById(popup).style.display = "block";
    document.getElementById("bg").style.display = "block";
}
function closePopup(popup) {
    document.getElementById(popup).style.display = "none";
    document.getElementById("bg").style.display = "none";
}
function showScores(n) {
    ["red", "blue", "yellow", "green"].forEach((color, i) => {
        document.getElementById(color).style.display = n >= i + 1 ? "block" : "none";
    });
}
function setScoreWidth(n) {
    ["red", "blue", "yellow", "green"].forEach(color => {
        document.getElementById(color).style.width = `${400 / n}px`;
    });
}
function toggleUserBotButtons() {
    document.querySelectorAll("#userNameTable .user-select").forEach(btn => {
        btn.onclick = function () {
            const row = btn.closest("tr");
            const [userBtn, botBtn] = row.querySelectorAll(".user-select");
            const input = row.querySelector("input[type='text']");
            if (btn === userBtn) {
                userBtn.classList.add("selected");
                botBtn.classList.remove("selected");
                input.disabled = false;
                input.value = "";
                input.player = "Player";
            } else {
                botBtn.classList.add("selected");
                userBtn.classList.remove("selected");
                input.disabled = true;
                input.value = "RandomBot";
                input.player = "Bot";
            }
        };
    });
}
function createUserNameFields(n) {
    const table = document.getElementById("userNameTable");
    table.innerHTML = "";
    const tokenColours = ["red", "blue", "yellow", "green"];
    for (let i = 1; i <= n; i++) {
        const row = document.createElement("tr");
        row.innerHTML = `<td><i class="${tokenColours[i - 1]}-token-2"></i></td>
            <td><input type="text" id="field${i}" placeholder="Player ${i}" /></td>
            <td><button type="button" class="user-select selected"><i class="fa-solid fa-user"></i></button>
            <button type="button" class="user-select"><i class="fa-solid fa-robot"></i></button></td>`;
        table.appendChild(row);
        document.getElementById(`field${i}`).player = "Player";
    }
}
function newGameStyles(gameName) {
    document.getElementById("proceed").style.display = "block";
    document.getElementById("proceed").innerHTML = "Start <b>round 1</b>!";
    document.getElementById("stat").innerHTML = `Welcome to <b>${gameName}</b>!`;
    document.getElementById("board").innerHTML = "";
    document.getElementById("round").innerHTML = "";
    document.getElementById("turn").innerHTML = "";
    document.title = gameName;
}

// Event listeners
document.getElementById("2-button").onclick = () => {
    document.getElementById("home").style.display = "none";
    document.getElementById("player-data").style.display = "block";
    document.getElementById("player-data").game = "Classic";
    document.getElementById("game-title").innerHTML = "Classic Tic Tac Toe";
    createUserNameFields(2);
    toggleUserBotButtons();
};
document.getElementById("4-button").onclick = () => {
    document.getElementById("home").style.display = "none";
    document.getElementById("player-data").style.display = "block";
    document.getElementById("player-data").game = "Large";
    document.getElementById("game-title").innerHTML = "Large Tic Tac Toe";
    createUserNameFields(4);
    toggleUserBotButtons();
};
document.getElementById("play-btn").onclick = () => {
    const userNameData = [...document.getElementById("userNameTable").querySelectorAll("input")];
    const playable = userNameData.every(i => i.value);
    if (playable) {
        document.getElementById("extra").style.display = "block";
        document.getElementById("player-data").style.display = "none";
        closePopup("closing_message");
        openPopup("message");
        const gameType = document.getElementById("player-data").game;
        if (gameType === "Classic") {
            newGameStyles("Classic Tic Tac Toe");
            showScores(2);
            setScoreWidth(2);
            const classicGame = new ClassicTicTacToe("board");
            document.getElementById("proceed").onclick = () => {
                closePopup("message");
                classicGame.startNewRound();
            };
        } else if (gameType === "Large") {
            newGameStyles("Large Tic Tac Toe");
            showScores(4);
            setScoreWidth(4);
            const largeGame = new LargeTicTacToe("board");
            document.getElementById("proceed").onclick = () => {
                closePopup("message");
                largeGame.startNewRound();
            };
        }
    } else {
        alert("Player names cannot be empty!");
    }
};