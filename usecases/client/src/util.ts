import { Socket, io } from "socket.io-client";
import { SocketClient } from "../../../src/socketClient";

const PORT = 3030;
const url = `http://localhost:${PORT}`;

export const socketClient = () => new SocketClient(url, {
    apiKey: "api-key",
    autoConnect: false,
});

export const SocketIO = (token?: string): Socket => io(url, {
    autoConnect: false,
    auth: {
        "x-api-key": "api-key",
        "authorization": token ? `Bearer ${token}` : ""
    }
}).on("connect_error", (e: any) => console.error(`Connect error: ${e}`));