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
const server = new SocketServer("your-api-key", "your-jwt-secret");

// Start the server on port
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket run on port http://localhost:${PORT}`);
});

// Channels
server.channel(
  "products",
  async (req, res) => {
    try {
      // Run service
      const product = new Product(req.body);
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
- `onEvent`: {onEvent} - Callback to handle incoming events.
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
const socket = new SocketClient(url, { apiKey: "api-key" });
// Initialize SocketClient with api_key and token
const socket = new SocketClient(url, {
  apiKey: "api-key",
  token: "token",
});

const error = (error) => console.error("Event error:", error);
const success = (data) => console.error("Event success:", data);
// Connect to a WebSocket channel and define event handlers
const emit = socket.channel("products", error, success);

// Example: Emit event
emit();

// Example: Emit event with data
emit({
  data: { message: "Hello, WebSocket!" },
});

// Example: Emit event with data, params and Auth headers
emit(
  {
    data: { message: "Hello, WebSocket!" },
    params: {
      id: "userid",
      name: "smit",
    },
  },
  { token: "your_auth_token" }
);
```

### Constructor

#### `new SocketClient(serverUrl, apiKey, authToken?)`

Creates an instance of `SocketClient` to connect to a WebSocket server.

```typescript
interface Security {
  apiKey?: string;
  token?: T;
}
```

- `serverUrl`: {string} - The URL of the WebSocket server.
- `security`: {Security} - Optional security options `{apiKey, token}`.
- `onError`: {OnErrorCallback} - Optional callback to handle errors.

### Methods

#### channel<T>(channel, onError, onSuccess, room): EmitEvent

Connects to a WebSocket channel and sets up callbacks for error and success events.

- `channel`: {string} - The name of the channel to connect to.
- `onError`: {OnErrorCallback} - Callback to handle error events.
- `onSuccess`: {OnSuccessCallback} - Callback to handle success events.
- `room`: {string} - Optional room name to join within the channel.
- `return` {Emit} A function to emit events on the connected channel/room with optional custom headers.

#### Emit(data, security)()

Emits an event on the specified channel/room with the provided data and headers.

```typescript
interface Data {
  params?: Record<string, any>;
  data: T;
}
```

- `data` {Data | undefined} - The data to emit with the event.
- `security` {Security | undefined} - Additional headers to send with the event `{token}`.
