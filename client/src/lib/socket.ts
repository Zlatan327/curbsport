import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "./api"; // Which resolves to http://localhost:4000/api usually

// Create socket connection using the base URL (stripping the /api part if needed)
const serverUrl = API_BASE_URL.replace("/api", "");

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(serverUrl, {
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("🟢 Socket.IO Connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket.IO Disconnected");
    });
  }
  return socket;
}
