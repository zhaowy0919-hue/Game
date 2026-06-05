// =======================
// 基础配置
// =======================
const API_BASE = "https://subject-unknowing-devious.ngrok-free.dev"
const CELL_SIZE = 40;

const UNKNOWN = 4;  // 不可见
const FLOOR = 1;     // 地面
const WALL = 0;      // 墙 / 障碍物
const PLAYER = 2;    // 玩家
const EXIT = 3;      // 出口

let sessionId = null;
let localMap = null;
let gameStarted = false;
let gameFinished = false;


// =======================
// 获取页面元素
// =======================

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const finishScreen = document.getElementById("finish-screen");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

const statusText = document.getElementById("status-text");
const finishText = document.getElementById("finish-text");

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");


// =======================
// 开始游戏
// =======================

startBtn.addEventListener("click", async function () {
    await startGame();
});

restartBtn.addEventListener("click", function () {
    location.reload();
});


async function startGame() {
    try {
        const response = await fetch("${API_BASE}/api/start_game", {
            method: "POST"
        });

        const data = await response.json();

        sessionId = data.session_id;
        localMap = data.local_map;

        gameStarted = true;
        gameFinished = false;

        startScreen.classList.add("hidden");
        finishScreen.classList.add("hidden");
        gameScreen.classList.remove("hidden");

        drawLocalMap(localMap);

        statusText.innerText = "游戏进行中";

    } catch (error) {
        console.error("开始游戏失败：", error);
        alert("开始游戏失败，请检查后端是否已经启动。");
    }
}


// =======================
// 监听键盘
// =======================

document.addEventListener("keydown", async function (event) {
    if (!gameStarted || gameFinished) {
        return;
    }

    let direction = null;

    if (event.key === "w" || event.key === "W" || event.key === "ArrowUp") {
        direction = "North";
    } else if (event.key === "s" || event.key === "S" || event.key === "ArrowDown") {
        direction = "South";
    } else if (event.key === "a" || event.key === "A" || event.key === "ArrowLeft") {
        direction = "West";
    } else if (event.key === "d" || event.key === "D" || event.key === "ArrowRight") {
        direction = "East";
    }

    if (direction !== null) {
        await sendMove(direction);
    }
});


// =======================
// 向后端发送移动请求
// =======================

async function sendMove(direction) {
    try {
        const response = await fetch("${API_BASE}/api/move", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                session_id: sessionId,
                direction: direction
            })
        });

        const data = await response.json();

        localMap = data.local_map;

        drawLocalMap(localMap);

        if (data.arrived) {
            finishGame();
        }

    } catch (error) {
        console.error("移动请求失败：", error);
        alert("移动失败，请检查后端连接。");
    }
}


// =======================
// 绘制局部地图
// =======================

function drawLocalMap(map) {
    if (!map || map.length === 0) {
        return;
    }

    const rows = map.length;
    const cols = map[0].length;

    canvas.width = cols * CELL_SIZE;
    canvas.height = rows * CELL_SIZE;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = map[r][c];

            const x = c * CELL_SIZE;
            const y = r * CELL_SIZE;

            drawCell(cell, x, y);
        }
    }
}


// =======================
// 绘制单个格子
// =======================

function drawCell(cell, x, y) {
    if (cell === UNKNOWN) {
        ctx.fillStyle = "#111111";
    } else if (cell === FLOOR) {
        ctx.fillStyle = "#eeeeee";
    } else if (cell === WALL) {
        ctx.fillStyle = "#333333";
    } else if (cell === EXIT) {
        ctx.fillStyle = "#4caf50";
    } else if (cell === PLAYER) {
        ctx.fillStyle = "#eeeeee";
    } else {
        ctx.fillStyle = "#111111";
    }

    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    // 网格线
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

    // 玩家单独画成圆
    if (cell === PLAYER) {
        ctx.beginPath();
        ctx.arc(
            x + CELL_SIZE / 2,
            y + CELL_SIZE / 2,
            CELL_SIZE / 3,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = "#4f8cff";
        ctx.fill();
    }
}


// =======================
// 游戏完成
// =======================

function finishGame() {
    gameFinished = true;

    gameScreen.classList.add("hidden");
    finishScreen.classList.remove("hidden");

    finishText.innerText = "你已经成功找到出口。本次游戏轨迹已保存。";
}