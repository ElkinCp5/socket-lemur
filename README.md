# SocketServer

`SocketServer` is a utility class for managing WebSocket channels using Socket.IO, with integrated JWT authentication and API key validation.

### Installation

Ensure you have Node.js and npm installed. Then install the required packages:

    `npm install socket-lemur`

### Usage

Initialize the `SocketServer` instance and define custom event handlers for your application.

```typescript
const { SocketServer } = require("socket-lemur");

// Port Definition
const PORT = process.env.PORT || 4000;

// SocketServer Definition
const server = new SocketServer<{ id: string }>({
  apikey: "api-key",
  secret: "jwt-secret",
  roomsEnabled: true,
});

const data = [
  { id: 1, name: "Pizza" },
  { id: 2, name: "Pasta" },
];

// Actions Definition
async function get() {
  return data;
}

async function add(product: { name: string }) {
  data.push({ id: data.length + 1, name: product.name });
  return data;
}

// Channels Definition
server.channel<any[]>("get/products", async function (_, res) {
  const products = await get();
  res(products);
});

server.channel<{ name: string }>(
  "post/products",
  async function (req, res) {
    const products = await add(req.body);
    res(products);
  },
  true
);

// Server run on port
server.listen(PORT, function () {
  console.log(`Server Run http://localhost:${PORT}`);
});

// On connection
server.connection({
  on: function () {
    console.log("onConnection");
  },
  off: function () {
    console.log("onDisconnect");
  },
});

// More event definitions can be added here
```

### Constructor

#### `new SocketServer<S>(settings?)`

Creates a new instance of `SocketServer`.

```typescript
const default: Partial<ServerOptions> = {
    cors: {
        origin: "*", // Configure CORS as needed
        methods: ["GET", "POST"],
        credentials: true,
    },
    allowEIO3: true
};
```

- `apikey` (optional): API key for validating requests.
- `secret` (optional): Secret key for JWT token validation.
- `options` (optional): Socket.IO server settings `default`.
- `roomsEnabled` (optional): Whether to enable room support `false`.

### Methods

#### channel<T>(name, onEvent, tokenRequire, roomSupport)

Establishes channel handling and defines event listeners for Socket.IO.

#### Parameters:

Initialize handling for a channel with optional room support.

- `name`: {string} - The name of the channel.
- `onEvent`: {onEvent} - Callback to handle incoming events.
- `tokenRequire`: {boolean} - Whether token authentication is required for events on this channel `false`.
- `roomSupport`: {boolean} - Whether room support is enabled for this channel `this.roomsEnabled`.

### listen:

This method receives the same parameters or configuration from an http server.

- `port`: {number}.
- `hostname`: {string}.
- `backlog`: {number}.
- `listeningListener`: {function}.

### connection:

The server's connection method receives an object with two properties on and off, on detects when a client connects and off when that client disconnects.

- `on`: {function} connection callback function.
- `off`: {function} disconnection callback function.

# SocketClient

`SocketClient` class facilitates WebSocket communication with a server using Socket.IO.

### Usage

Initialize `SocketClient` to connect to a WebSocket server and handle events.

```typescript
const { SocketClient } = require("socket-lemur");

const PORT = 3030;
const url = `http://localhost:${PORT}`;

// Initialize SocketClient with api_key
const socket = new SocketClient(url, {
  apiKey: "api-key",
});
// Initialize SocketClient with api_key and token
const socket = new SocketClient(url, {
  apiKey: "api-key",
  token: "token",
});

function error(error) {
  console.error("Event error:", error);
}
function success(data) {
  console.error("Event success:", data);
}
// Connect to a WebSocket channel and define event handlers
const postProduct = socket.channel<any>("post/products", {
  onSuccess: success,
  onError: error,
  room: "post",
});

const geProducts = socket.channel<any[]>("get/products", {
  onSuccess: success,
  onError: error,
});

geProducts.on(); // Adds the listener function to the end of the listeners array for the event named eventName.
geProducts.off(); // Removes the specified listener from the listener array for the event named eventName.
geProducts.emit();
postProduct.emit(
  {
    data: { name: "coffe" },
    params: { room: "post" },
  },
  "tokent"
);
```

### Constructor

#### `new SocketClient(serverUrl, apiKey, authToken?)`

Creates an instance of `SocketClient` to connect to a WebSocket server.

```typescript
interface Security {
  apiKey?: string;
  token?: string;
}
```

- `serverUrl`: {string} - The URL of the WebSocket server.
- `security`: {Security} - Optional security options `{apiKey, token}`.
- `onError`: {OnErrorCallback} - Optional callback to handle errors.

### Methods

#### channel<T>(name, opts: LemurOpts<T>): EmitEvent

Connects to a WebSocket channel and sets up callbacks for error and success events.

```typescript
declare type LemurOpts<T> = {
  onSuccess: OnSuccessCallback<T>;
  onError?: OnErrorCallback;
  room?: string;
};
```

- `name`: {string} - The name of the channel to connect to.
- `opts`: {LemurOpts} - The options for the channel, including success and error callbacks, and an optional room.

#### The channel method returns an object with multiple actions

- `emit`: {(data?, token?) => void} - Emits an event to the channel with optional data and token.
- `off`: {() =>void} - Removes the event listeners for the channel.
- `on`: {() =>void} - Event listeners for the channel.
