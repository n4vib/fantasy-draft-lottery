const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// ===== League Config (dropdown names) =====
const GM_LIST = ["Smog","Navi","Chad","Mandy","Har","Zab","Gagan","Sanjay","Rax","Rajan","Amrit","Justin"];

// ===== In-Memory State =====
let draftOrder = []; // [{ name, position }]
let availableNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
let turnOrder = [];
let currentTurnIndex = 0;
let activeGM = null;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function startDraft() {
  draftOrder = [];
  availableNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
  turnOrder = shuffle([...GM_LIST]);
  currentTurnIndex = 0;
  activeGM = turnOrder[0] || null;
  io.emit("draftReset", { draftOrder, activeGM, turnOrder });
}

io.on("connection", (socket) => {
  socket.emit("draftUpdate", { draftOrder, activeGM, turnOrder });

  socket.on("join", ({ name }) => {
    if (!GM_LIST.includes(name)) {
      socket.emit("loginError", "Choose a valid GM name.");
      return;
    }
    if (draftOrder.find(p => p.name === name)) {
      socket.emit("loginInfo", "You have already picked. Enjoy the show!");
    }
    socket.emit("loginSuccess", { name, turnOrder, draftOrder, activeGM });
  });

  socket.on("pullBall", ({ name }) => {
    if (name !== activeGM) {
      socket.emit("errorMsg", "Not your turn!");
      return;
    }
    const randIndex = Math.floor(Math.random() * availableNumbers.length);
    const number = availableNumbers.splice(randIndex, 1)[0];
    draftOrder.push({ name, position: number });
    draftOrder.sort((a, b) => a.position - b.position);

    currentTurnIndex++;
    activeGM = turnOrder[currentTurnIndex] || null;

    io.emit("draftUpdate", { draftOrder, activeGM, turnOrder });
  });

  socket.on("resetDraft", () => startDraft());
});

startDraft();

// Serve built React
app.use(express.static(path.join(__dirname, "frontend", "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
