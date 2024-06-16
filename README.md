# SocketServer

`SocketServer` is a utility class for managing WebSocket connections using Socket.IO, with integrated JWT authentication and API key validation.

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

### ConstructorConstructor

#### `new SocketServer(apikey?, secret?, settings?)`

Creates a new instance of `SocketServer`.

- `apikey` (optional): API key for validating requests.
- `secret` (optional): Secret key for JWT token validation.
- `settings` (optional): Socket.IO server settings <ServerOptions>.

### MethodsMethods

#### connection()

Establishes connection handling and defines event listeners for Socket.IO.

- Returns a function `(eventName, onEvent, tokenRequire)` to register event handlers.

#### Parameters:

- `eventName`: Name of the event to handle.
- `onEvent`: Callback function to handle the event.
- `tokenRequire` (optional): Boolean indicating if JWT authentication is required.

# SocketClient

`SocketClient` class facilitates WebSocket communication with a server using Socket.IO.

### UsageUsage

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

// Example: Emit event with data and custom headers
emitEvent({ message: "Hello, WebSocket!" });

// Example: Emit event with data and Auth headers
emitEvent({ message: "Hello, WebSocket!" }, { token: "your_auth_token" });
```

### Constructor

#### `new SocketClient(serverUrl, apiKey, authToken?)`

Creates an instance of `SocketClient` to connect to a WebSocket server.

- `serverUrl` (string): The URL of the WebSocket server.
- `security` (optional object): The API key and The JWT token `{apiKey, token}`

### Methods

#### connect(channel, onError, onSuccess)()

Connects to a WebSocket channel and sets up callbacks for error and success events.

- `channel` (string): The name of the channel to connect to.
- `onError` (function): Callback function to handle error events.
- `onSuccess` (function): Callback function to handle success events.
  Returns a function to emit events on the connected channel with optional custom headers.
