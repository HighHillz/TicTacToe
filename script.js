//Player tokens and their properties
class Token {
    static rgb_values = {
        "red": "(255,0,0)", 
        "blue": "(0,0,255)", 
        "yellow": "(255,255,0)", 
        "green": "(0,255,0)"
    };
    constructor(colour) {
        this.colour = Token.rgb_values[colour];
        this.class = colour + "-token";
    }
    getBgColour() {
        const rgb = this.colour.replace(/[()]/g, "").split(",").map(Number);
        let bg_rgb = [];
        for(let i of rgb) {
            if(i == 255) {
                bg_rgb.push(15);
            } else {
                bg_rgb.push(0);
            }
        }
        bg_rgb = `rgb(${bg_rgb[0]}, ${bg_rgb[1]}, ${bg_rgb[2]})`;
        return bg_rgb;
    }
    getFontColour() {
        return `rgb${this.colour}`;
    }
    getCardColours() {
        const curr_colour = this.colour.replace(/[()]/g, "").split(",").map(Number);
        let new_font_colour = [];
        let new_bg_colour_1 = [];
        let new_bg_colour_2 = [];
        for(let i of curr_colour) {
            if(i == 255) {
                new_font_colour.push(255);
                new_bg_colour_1.push(140);
                new_bg_colour_2.push(200);
            } else {
                new_font_colour.push(118);
                new_bg_colour_1.push(0);
                new_bg_colour_2.push(0);
            }
        }
        new_font_colour = `rgb(${new_font_colour[0]}, ${new_font_colour[1]}, ${new_font_colour[2]})`;
        new_bg_colour_1 = `rgb(${new_bg_colour_1[0]}, ${new_bg_colour_1[1]}, ${new_bg_colour_1[2]})`;
        new_bg_colour_2 = `rgb(${new_bg_colour_2[0]}, ${new_bg_colour_2[1]}, ${new_bg_colour_2[2]})`;
        return {
            fontColour: function() {
                return new_font_colour;
            },
            bgColour: function() {
                return `linear-gradient(135deg,${new_bg_colour_1} 40%,${new_bg_colour_2} 100%)`;
            }
        };
    }
}

//Grid properties
class Grid {
    static tableCount;
    constructor(board, rows, cols) {
        this.board = document.getElementById(board);
        this.rows = rows
        this.cols = cols
    }
    createGrid(cell_width, cell_height, table_class = false) {
        this.board.innerHTML = "";
        Grid.tableCount += 1;
        const table = document.createElement("table");
        if(table_class) table.classList.add(table_class);
        for (let i = 0; i < this.rows; i++) {
            const row = document.createElement("tr");
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement("td");
                cell.id = `${Grid.tableCount}-${i}-${j}`;
                cell.classList.add("cell");
                Object.assign(cell.style, {width: `${cell_width}px`, height: `${cell_height}px`});
                row.appendChild(cell);
            }
            table.appendChild(row);
        }
        this.board.appendChild(table);
    }
    init() {
        Grid.tableCount = 0;
    }
}

class Bot {
    constructor(name, board, return_id = false) {
        this.name = name;
        this.board = document.getElementById(board);
        this.return_id = return_id;
    }
    play() {
        if(this.name == "RandomBot") {
            return this.randomBot();
        }
    }
    randomBot() {
        let curr_board;
        const boards = [...this.board.querySelectorAll("div")];
        if(boards.length) {
            for(let i of boards) {
                if(!i.classList.contains("disabled-grid")) {
                    curr_board = document.getElementById(i.id);
                }
            }
        } else {
            curr_board = this.board;
        }

        const emptyCells = [...curr_board.querySelectorAll(".cell")].filter(c => !c.innerHTML);
        if (!emptyCells.length) return;
        if (!this.return_id) return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        return [emptyCells[Math.floor(Math.random() * emptyCells.length)], curr_board]
    }
    static getRandomInt(start, end) {
        return Math.floor(Math.random() * (end - start) + start);
    }
}

//Common game properties
class Game {
    constructor(playerCount, max_score = Infinity) {
        this.max_score = max_score;
        this.start_turn = 0;
        this.round = 0; //Set round and serving player to 0 indicating that the game has not begun.
        this.curr_player = "";
        this.winner = "";
        this.playerCount = playerCount;
        this.gameOver = false;
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
        if(this.turn == this.playerCount) {
            this.turn = 1;
        } else {
            this.turn++
        }
    }
    updateTurn(player, colour) {
        document.getElementById("turn").innerHTML = player;
        document.getElementById("turn").style.color = colour;
    }
    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }
}

class ClassicTicTacToe extends Game {
    #player_data = { //[Name, Type, Token property, Score]
        "player1": [document.getElementById("field1").value, document.getElementById("field1").player, new Token("red"), 0],
        "player2": [document.getElementById("field2").value, document.getElementById("field2").player, new Token("blue"), 0]
    };

    constructor(board) {
        super(2, 10);
        this.board = board;
        this.turn = this.start_turn;
        this.bot_set = {};
        this.setBots();
        this.updateScore();
        document.getElementById("player1_name").innerHTML = this.#player_data["player1"][0];
        document.getElementById("player2_name").innerHTML = this.#player_data["player2"][0];
    }
    setBots() {
        for(let i of Object.keys(this.#player_data)) {
            const curr_obj = this.#player_data[i]
            if(curr_obj[1] == "Bot") {
                this.bot_set[i] = new Bot(curr_obj[0], "board");
            } else {
                continue;
            }
        }
    }
    startNewRound() {
        this.round++;
        this.gameOver = false;
        this.start_turn = this.start_turn == this.playerCount ? 1 : this.start_turn+1;
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
        const grid = new Grid(this.board, 3, 3);
        grid.init();
        grid.createGrid(100, 100);
    }
    playTurn() {
        if(!this.gameOver) {
            document.body.style.backgroundColor = this.#player_data[this.curr_player][2].getBgColour();
            console.log(this.#player_data[this.curr_player][1]);
            this.#player_data[this.curr_player][1] == "Player" ? this.player() : this.bot();
        }
    }
    player() {
        document.getElementById(this.board).onclick = (e) => {
            const cell = e.target;
            if (cell.classList.contains("cell") && !cell.innerHTML) {
                const token = this.#player_data[this.curr_player][2].class;
                cell.innerHTML = `<i class="${token}"></i>`;
                document.getElementById(this.board).onclick = () => {};
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
        const winning_lines = [
            [0,1,2], [3,4,5], [6,7,8], //Horizontal
            [0,3,6], [1,4,7], [2,5,8], //Vertical
            [0,4,8], [2,4,6] //Diagonal
        ];
        for(const [a, b, c] of winning_lines) {
            if (cells[a].innerHTML && cells[a].innerHTML === cells[b].innerHTML && cells[a].innerHTML === cells[c].innerHTML) {
                this.gameOver = true;
                if(cells[a].querySelector("i").classList.contains("red-token")) {
                    this.#player_data["player1"][3]++;
                    this.winner = this.#player_data["player1"][0];
                } else if(cells[a].querySelector("i").classList.contains("blue-token")) {
                    this.#player_data["player2"][3]++;
                    this.winner = this.#player_data["player2"][0];
                }
                break;
            }
        }
        if (!this.gameOver && cells.every(cell => cell.innerHTML)) {
            this.gameOver = true;
            this.winner = ""
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
        document.getElementById("player1_score").innerHTML = this.#player_data["player1"][3];
        document.getElementById("player2_score").innerHTML = this.#player_data["player2"][3];
    }
    endRound() {
        const proceed = document.getElementById("proceed");
        openPopup("message");
        document.getElementById("stat").innerHTML = this.winner ? `<b>${this.winner}</b> wins <b>round ${this.round}</b>!`: `Nobody wins <b>round ${this.round}</b> :(`;
        proceed.innerHTML = `Start <b>round ${this.round+1}</b>!`;
        proceed.style.display = "none";
        setTimeout(() => this.updateScore(), 1000);
        if(this.#player_data["player1"][3] == this.max_score || this.#player_data["player2"][3] == this.max_score) {
            const winner = this.#player_data["player1"][3] == this.max_score ? "player1" : "player2";
            setTimeout(() => this.endGame(winner), 2000);
        } else {
            setTimeout(() => {
                proceed.style.display = "block";
                proceed.onclick = () => {
                    this.startNewRound();
                    closePopup("message");
                }
            }, 2000);
        }
    }
    endGame(winner) {
        closePopup("message");
        openPopup("closing_message");
        document.getElementById("closing_message").style.background = this.#player_data[winner][2].getCardColours().bgColour();
        document.getElementById("closing_stat").style.color = this.#player_data[winner][2].getCardColours().fontColour();
        document.getElementById("closing_stat").innerHTML = `<b>${this.#player_data[winner][0]}</b> wins the game!` 
        setTimeout(() => {
            document.getElementById("home-btn").style.display = "block";
            document.getElementById("home-btn").onclick = () => {
                document.getElementById("extra").style.display = "none";
                document.getElementById("home").style.display = "block";
                document.body.style.background = "#111111";
            }
        }, 1000);

    }
}

class LargeTicTacToe extends Game {
    #player_data = { //[Name, Type, Token property, Score]
        "player1": [document.getElementById("field1").value, document.getElementById("field1").player, new Token("red"), 0],
        "player2": [document.getElementById("field2").value, document.getElementById("field2").player, new Token("blue"), 0],
        "player3": [document.getElementById("field3").value, document.getElementById("field3").player, new Token("yellow"), 0],
        "player4": [document.getElementById("field4").value, document.getElementById("field4").player, new Token("green"), 0]
    };

    constructor(board) {
        super(4, 7);
        this.board = board;
        this.turn = this.start_turn;
        this.bot_set = {};
        this.setBots();
        this.updateScore();
        document.getElementById("player1_name").innerHTML = this.#player_data["player1"][0];
        document.getElementById("player2_name").innerHTML = this.#player_data["player2"][0];
        document.getElementById("player3_name").innerHTML = this.#player_data["player3"][0];
        document.getElementById("player4_name").innerHTML = this.#player_data["player4"][0];
    }
    setBots() {
        for(let i of Object.keys(this.#player_data)) {
            const curr_obj = this.#player_data[i]
            if(curr_obj[1] == "Bot") {
                this.bot_set[i] = new Bot(curr_obj[0], "board");
            } else {
                continue;
            }
        }
    }
    startNewRound() {
        this.round++;
        this.gameOver = false;
        this.start_turn = this.start_turn == this.playerCount ? 1 : this.start_turn+1;
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
        const grid = new Grid(this.board, 6, 6);
        grid.init();
        grid.createGrid(50, 50);
    }
    playTurn() {
        if(!this.gameOver) {
            document.body.style.backgroundColor = this.#player_data[this.curr_player][2].getBgColour();
            this.#player_data[this.curr_player][1] == "Player" ? this.player() : this.bot();
        }
    }
    player() {
        document.getElementById(this.board).onclick = (e) => {
            const cell = e.target;
            if (cell.classList.contains("cell") && !cell.innerHTML) {
                const token = this.#player_data[this.curr_player][2].class;
                cell.innerHTML = `<i class="${token}-2"></i>`;
                document.getElementById(this.board).onclick = () => {};
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
        const winning_lines = [];
        for(let i = 0; i < 6; i++) {
            for(let j = 0; j < 3; j++) {
                const a = 6 * i + j; //Horizontal
                const b = i + 6 * j; //Vertical
                winning_lines.push([a, a+1, a+2, a+3]);
                winning_lines.push([b, b+6, b+12, b+18]);
                if(i < 3) { //Diagonal
                    const c = a + 3;
                    winning_lines.push([a, a+7, a+14, a+21]);
                    winning_lines.push([c, c+5, c+10, c+15]);
                }
            }
        }
        for(const [a, b, c, d] of winning_lines) {
            if (cells[a].innerHTML && cells[a].innerHTML === cells[b].innerHTML && cells[a].innerHTML === cells[c].innerHTML && cells[a].innerHTML === cells[d].innerHTML) {
                this.gameOver = true;
                if(cells[a].querySelector("i").classList.contains("red-token-2")) {
                    this.#player_data["player1"][3]++;
                    this.winner = this.#player_data["player1"][0];
                } else if(cells[a].querySelector("i").classList.contains("blue-token-2")) {
                    this.#player_data["player2"][3]++;
                    this.winner = this.#player_data["player2"][0];
                } else if(cells[a].querySelector("i").classList.contains("yellow-token-2")) {
                    this.#player_data["player3"][3]++;
                    this.winner = this.#player_data["player3"][0];
                } else if(cells[a].querySelector("i").classList.contains("green-token-2")) {
                    this.#player_data["player4"][3]++;
                    this.winner = this.#player_data["player4"][0];
                }
                break;
            }
        }
        if (!this.gameOver && cells.every(cell => cell.innerHTML)) {
            this.gameOver = true;
            this.winner = ""
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
        document.getElementById("player1_score").innerHTML = this.#player_data["player1"][3];
        document.getElementById("player2_score").innerHTML = this.#player_data["player2"][3];
        document.getElementById("player3_score").innerHTML = this.#player_data["player3"][3];
        document.getElementById("player4_score").innerHTML = this.#player_data["player4"][3];
    }
    endRound() {
        const proceed = document.getElementById("proceed");
        openPopup("message");
        document.getElementById("stat").innerHTML = this.winner ? `<b>${this.winner}</b> wins <b>round ${this.round}</b>!`: `Nobody wins <b>round ${this.round}</b> :(`;
        proceed.innerHTML = `Start <b>round ${this.round+1}</b>!`;
        proceed.style.display = "none";
        setTimeout(() => this.updateScore(), 1000);
        if(this.#player_data["player1"][3] == this.max_score || this.#player_data["player2"][3] == this.max_score || this.#player_data["player3"][3] == this.max_score || this.#player_data["player4"][3] == this.max_score) {
            const winner = this.#player_data["player1"][3] == this.max_score ? "player1" : this.#player_data["player2"][3] == this.max_score ? "player2" : this.#player_data["player3"][3] == this.max_score ? "player3" : "player4";
            setTimeout(() => this.endGame(winner), 2000);
        } else {
            setTimeout(() => {
                proceed.style.display = "block";
                proceed.onclick = () => {
                    this.startNewRound();
                    closePopup("message");
                }
            }, 2000);
        }
    }
    endGame(winner) {
        closePopup("message");
        openPopup("closing_message");
        document.getElementById("closing_message").style.background = this.#player_data[winner][2].getCardColours().bgColour();
        document.getElementById("closing_stat").style.color = this.#player_data[winner][2].getCardColours().fontColour();
        document.getElementById("closing_stat").innerHTML = `<b>${this.#player_data[winner][0]}</b> wins the game!` 
        setTimeout(() => {
            document.getElementById("home-btn").style.display = "block";
            document.getElementById("home-btn").onclick = () => {
                document.getElementById("extra").style.display = "none";
                document.getElementById("home").style.display = "block";
                document.body.style.background = "#111111";
            }
        }, 1000);

    }
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
    document.getElementById("red").style.display = n >= 1 ? "block" : "none";
    document.getElementById("blue").style.display = n >= 2 ? "block" : "none";
    document.getElementById("yellow").style.display = n >= 3 ? "block" : "none";
    document.getElementById("green").style.display = n >= 4 ? "block" : "none";
}

function setScoreWidth(n) {
    document.getElementById("red").style.width = document.getElementById("blue").style.width = document.getElementById("yellow").style.width = document.getElementById("green").style.width = `${400/n}px`;
}

function toggleUserBotButtons() {
    document.querySelectorAll("#userNameTable .user-select").forEach(btn => {
        btn.onclick = function() {
            const row = btn.closest("tr");
            const userBtn = row.querySelectorAll(".user-select")[0];
            const botBtn = row.querySelectorAll(".user-select")[1];
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
    for(let i = 1; i <= n; i++) {
        const row = document.createElement("tr");
        row.innerHTML = `<td><i class="${tokenColours[i-1]}-token-2"></i></td>
                    <td><input type="text" id="field${i}" placeholder="Player ${i}" /></td>
                    <td><button type="button" class="user-select selected"><i class="fa-solid fa-user"></i></button><button type="button" class="user-select"><i class="fa-solid fa-robot"></i></button></td>`;
        table.appendChild(row);
        document.getElementById(`field${i}`).player = "Player";
    }
}

function newGameStyles(gameName) {
    document.getElementById("proceed").style.display = "block";
    document.getElementById("proceed").innerHTML = "Start <b>round 1</b>!";
    document.getElementById("stat").innerHTML = "Welcome to <b>"+ gameName +"</b>!";
    document.getElementById("board").innerHTML = "";
    document.getElementById("round").innerHTML = "";
    document.getElementById("turn").innerHTML = "";
    document.title = gameName;
}

document.getElementById("2-button").onclick = function() {
    document.getElementById("home").style.display = "none";
    document.getElementById("player-data").style.display = "block";
    document.getElementById("player-data").game = "Classic";
    document.getElementById("game-title").innerHTML = "Classic Tic Tac Toe";
    createUserNameFields(2);
    toggleUserBotButtons();
}

document.getElementById("4-button").onclick = function() {
    document.getElementById("home").style.display = "none";
    document.getElementById("player-data").style.display = "block";
    document.getElementById("player-data").game = "Large";
    document.getElementById("game-title").innerHTML = "Large Tic Tac Toe";
    createUserNameFields(4);
    toggleUserBotButtons();
}

document.getElementById("play-btn").onclick = function() {
    const userNameData = [...document.getElementById("userNameTable").querySelectorAll("input")];
    let playable = true;
    for(let i of userNameData) {
        if(!i.value) {
            playable = false;
            break;
        }
    }
    if(playable) {
        document.getElementById("extra").style.display = "block";
        document.getElementById("player-data").style.display = "none";
        closePopup("closing_message");
        openPopup("message");
        switch(document.getElementById("player-data").game) {
            case "Classic":
                newGameStyles("Classic Tic Tac Toe");
                showScores(2);
                setScoreWidth(2);
                const classicGame = new ClassicTicTacToe("board")
                document.getElementById("proceed").onclick = function() {
                    closePopup("message");
                    classicGame.startNewRound();
                }
                break;
            case "Large":
                newGameStyles("Large Tic Tac Toe");
                showScores(4);
                setScoreWidth(4);
                const largeGame = new LargeTicTacToe("board")
                document.getElementById("proceed").onclick = function() {
                    closePopup("message");
                    largeGame.startNewRound();
                }
        }
    } else {
        alert("Player names cannot be empty!");
    }
}