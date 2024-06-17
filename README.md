# SocketServer

`SocketServer` is a utility class for managing WebSocket channels using Socket.IO, with integrated JWT authentication and API key validation.

### Installation

Ensure you have Node.js and npm installed. Then install the required packages:

    `npm install socket-lemur`

### UsageUsage

Initialize the `SocketServer` instance and define custom event handlers for your application.

```javascript
const { SocketServer } = require("socket-lemur");
const Product = require("./models/Product");

// Initialize SocketServer
const socketServer = new SocketServer("your-api-key", "your-jwt-secret");

// Start the server on port
const PORT = process.env.PORT || 4000;
socketServer.listen(PORT, () => {
  console.log(`Socket run on port http://localhost:${PORT}`);
});

// Channels
socketServer.channel(
  "get/products",
  async (data, session, onSuccess) => {
    try {
      // Run service
      const product = new Product(data);
      await product.save();
      // Response
      onSuccess(product);
    } catch (error) {
      console.error("Error creating product:", error);
      throw new Error("Product creation failed");
    }
  },
  true // Requires JWT authentication
);

// More event definitions can be added here
```

### Constructor

#### `new SocketServer<S>(apikey?, secret?, settings?, roomsEnabled?)`

Creates a new instance of `SocketServer`.

```javascript
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
- `settings` (optional): Socket.IO server settings `default`.
- `roomsEnabled` (optional): Whether to enable room support `false`.

### MethodsMethods

#### channel<T>(name, onEvent, tokenRequire, roomSupport)

Establishes channel handling and defines event listeners for Socket.IO.

#### Parameters:

Initialize handling for a channel with optional room support.

- `name`: {string} - The name of the channel.
- `onEvent`: {OnEvent<T, S>} - Callback to handle incoming events.
- `tokenRequire`: {boolean} - Whether token authentication is required for events on this channel `false`.
- `roomSupport`: {boolean} - Whether room support is enabled for this channel `this.roomsEnabled`.

# SocketClient

`SocketClient` class facilitates WebSocket communication with a server using Socket.IO.

### Usage

Initialize `SocketClient` to connect to a WebSocket server and handle events.

```javascript
const { SocketClient } = require("socket-lemur");

const url = "http://localhost:3000";

// Initialize SocketClient with api_key
const socketClient = new SocketClient(url, { apiKey: "api-key" });
// Initialize SocketClient with api_key and token
const socketClient = new SocketClient(url, {
  apiKey: "api-key",
  token: "token",
});

// Connect to a WebSocket channel and define event handlers
const emitEvent = socketClient.channel(
  "get/products",
  (error) => console.error("Event error:", error),
  (data) => console.log("Event success:", data)
);

// Example: Emit event
emitEvent();

// Example: Emit event with data
emitEvent({ message: "Hello, WebSocket!" });

// Example: Emit event with data and Auth headers
emitEvent({ message: "Hello, WebSocket!" }, { token: "your_auth_token" });
```

### Constructor

#### `new SocketClient(serverUrl, apiKey, authToken?)`

Creates an instance of `SocketClient` to connect to a WebSocket server.

- `serverUrl`: {string} - The URL of the WebSocket server.
- `security`: {OpsSecurity} - Optional security options `{apiKey, token}`.
- `onError`: {OnErrorCallback} - Optional callback to handle errors.

### Methods

#### channel<T>(channel, onError, onSuccess, room): EmitEvent

Connects to a WebSocket channel and sets up callbacks for error and success events.

- `channel`: {string} - The name of the channel to connect to.
- `onError`: {OnErrorCallback} - Callback to handle error events.
- `onSuccess`: {OnSuccessCallback} - Callback to handle success events.
- `room`: {string} - Optional room name to join within the channel.
- `return` {EmitEvent} A function to emit events on the connected channel/room with optional custom headers.

#### EmitEvent(data, security)()

Emits an event on the specified channel/room with the provided data and headers.

- `data` {T | undefined} - The data to emit with the event.
- `security` {OpsSecurity | undefined} - Additional headers to send with the event `{token}`.
