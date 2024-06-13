# socket-manager
The socket-manager library simplifies WebSocket connections for real-time communication in chat applications and online games. The SocketServer class integrates JWT authentication and API key validation. The SocketClient class facilitates server communication and event handling, offering a robust solution.

# SocketServer
`SocketServer` is a utility class for managing WebSocket connections using Socket.IO, with integrated JWT authentication and API key validation.

### Installation
Ensure you have Node.js and npm installed. Then install the required packages:

    `npm install socket-manager`

### Usage
Initialize the `SocketServer` instance and define custom event handlers for your application.

```javascript
const { SocketServer } = require('socket-manager');
const Product = require('./models/Product');

// Initialize SocketServer
const socketServer = new SocketServer('your-api-key', 'your-jwt-secret');

// Connect to WebSocket and define event handlers
socketServer.connection()(
    'createProduct',
    async (data, session, onSuccess) => {
        try {
            const product = new Product(data);
            await product.save();
            onSuccess(product);
        } catch (error) {
            console.error('Error creating product:', error);
            throw new Error('Product creation failed');
        }
    },
    true // Requires JWT authentication
);

// More event definitions can be added here
```
### Constructor
#### `new SocketServer(apikey?, secret?, settings?)`
Creates a new instance of `SocketServer`.

- `apikey` (optional): API key for validating requests.
- `secret` (optional): Secret key for JWT token validation.
- `settings` (optional): Socket.IO server settings.

### Methods
#### connection()
Establishes connection handling and defines event listeners for Socket.IO.

- Returns a function `(eventName, onEvent, tokenRequire)` to register event handlers.
#### Parameters:
- `eventName`: Name of the event to handle.
- `onEvent`: Callback function to handle the event.
- `tokenRequire` (optional): Boolean indicating if JWT authentication is required.

# SocketClient
`SocketClient` class facilitates WebSocket communication with a server using Socket.IO.

### Usage
Initialize `SocketClient` to connect to a WebSocket server and handle events.

```javascript
const { SocketClient } = require('socket-manager');

// Initialize SocketClient with api_key
const client = new SocketClient('http://localhost:3000', 'your_api_key');
// Initialize SocketClient with api_key and token
const client = new SocketClient('http://localhost:3000', 'your_api_key', 'your_auth_token');

// Connect to a WebSocket channel and define event handlers
const emitEvent = client.connect(
    'eventName',
    (error) => { console.error('Event error:', error); },
    (data) => { console.log('Event success:', data); }
);

// Example: Emit event with data and custom headers
emitEvent({ message: 'Hello, WebSocket!' }, { 'Custom-Header': 'value' });

// Example: Emit event with data and Auth headers
emitEvent({ message: 'Hello, WebSocket!' }, { 'Authorization': 'Bearer your_auth_token' });

```
### Constructor
#### `new SocketClient(serverUrl, apiKey, authToken?)`
Creates an instance of `SocketClient` to connect to a WebSocket server.

- `serverUrl` (string): The URL of the WebSocket server.
- `apiKey` (string): The API key to be sent in the 'X-API-KEY' header.
- `authToken` (optional string): The JWT token to be sent in the 'Authorization' header.

### Methods
#### connect(channel, onError, onSuccess)()
Connects to a WebSocket channel and sets up callbacks for error and success events.

- `channel` (string): The name of the channel to connect to.
- `onError` (function): Callback function to handle error events.
- `onSuccess` (function): Callback function to handle success events.
Returns a function to emit events on the connected channel with optional custom headers.

# Contribution

### Note: All changes should be submitted to the `develop` branch.

1. Fork the repository:
 [Click here to create fork](https://github.com/lemur-ink/socket-manager/fork)
2. Create a new branch:
```bash
   git checkout -b feature/new-feature
```
3. Make your changes and commit them:
```bash
   git commit -am 'Your comment here'
```
4. Push your changes to the branch:
```bash
   git push origin feature/new-feature
```
5. Open a Pull Request on GitHub, describe the proposed changes, and submit it.

### Note: All changes should be submitted to the `develop` branch.
