import { io } from "socket.io-client";
// In production (Render), backend and frontend share the same origin:
export const socket = io();
// For local dev: comment the above and use this instead:
// export const socket = io("http://localhost:4000");
