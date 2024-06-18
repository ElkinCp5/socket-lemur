import { SocketClient } from "../../../src/socketClient";

const PORT = 3030;
const url = `http://localhost:${PORT}`;
export const socket = new SocketClient(url, {
    apiKey: "api-key",
    autoConnect: false,
});