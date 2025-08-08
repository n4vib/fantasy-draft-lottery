import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      socket.emit("loginInf
