import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer, ServerOptions } from 'socket.io';
import { TokenManager } from './tokenManager';
import { ListenOptions } from 'net';
import { LemurSocket, LemurRequest, LemurNext, LemurEvent } from './dts/types';

const optsDefault: Partial<ServerOptions> = {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
    },
    allowEIO3: true
};

/**
 * SocketServer class for handling Socket.IO connections with optional room support.
 * @template Session - Type of the session object associated with each socket.
 */
export class SocketServer<Session> extends TokenManager {
    protected ioServer: SocketIOServer;
    protected httpServer: HTTPServer;
    private apikey?: string;
    private secret?: string;
    private authorization?: string;
    private roomsEnabled: boolean; // Flag to indicate if rooms are enabled
    private rooms: Map<string, Set<LemurSocket<Session>>>; // Map to store active rooms

    /**
     * Creates an instance of SocketServer.
     * @param {string} [apikey] - The API key for validating requests.
     * @param {string} [secret] - The secret key for JWT token validation.
     * @param {Partial<ServerOptions>} [settings={}] - Settings for Socket.IO server.
     * @param {boolean} [roomsEnabled=false] - Whether to enable room support.
     */
    constructor(apikey?: string, secret?: string, settings: Partial<ServerOptions> = optsDefault, roomsEnabled: boolean = false) {
        super();
        this.apikey = apikey;
        this.secret = secret;
        this.roomsEnabled = roomsEnabled;
        this.rooms = new Map();
        this.httpServer = createServer((_: any, res: any) => {
            res.writeHead(404, { 'Content-Type': 'text/htm' });
            res.end('');
        });
        this.ioServer = new SocketIOServer(this.httpServer, settings);
        this.middleware = this.middleware.bind(this);
        // this.listen = this.listen.bind(this);
        this.ioServer.use(this.middleware);
        this.listen = this.httpServer.listen.bind(this.httpServer);
    }

    // listen(...atrs: any[]) {
    //     return this.httpServer.listen(...atrs);
    // }

    /**
     * Middleware for authenticating API key and JWT token.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {LemurNext} next - The next function to call.
     */
    private middleware(socket: LemurSocket<Session>, next: LemurNext) {
        const { auth } = socket.handshake;
        const apikey = auth['x-api-key'] as string;
        this.authorization = auth['authorization'] as string;
        if (this.apikey && !this.validApiKey(apikey)) {
            console.error('Unauthorized access', { auth });
            return next(new Error('Unauthorized access: Invalid API key.'));
        }
        next();
    }

    /**
     * Initialize handling for a channel with optional room support.
     * @param {string} name - The name of the channel.
     * @param {LemurEvent<T, Session>} onEvent - Callback to handle incoming events.
     * @param {boolean} [tokenRequire=false] - Whether token authentication is required for events on this channel.
     * @param {boolean} [roomSupport=this.roomsEnabled] - Whether room support is enabled for this channel.
     */
    public channel<T>(name: string, onEvent: LemurEvent<T, Session>, tokenRequire: boolean = false, roomSupport: boolean = this.roomsEnabled) {
        this.ioServer.on('connection', (socket: LemurSocket<Session>) => {
            if (roomSupport) {
                socket.on('join', (room: string) => this.handleRoomJoin(socket, name, room));
                socket.on('leave', (room: string) => this.handleRoomLeave(socket, name, room));
            }

            socket.on(name, (request: any) => {
                if (request?.authorization) socket.handshake.auth.authorization = request.authorization
                const data: LemurRequest<T, Session> = {
                    body: request?.data,
                    params: request?.params || {} as Record<string, any>,
                    session: undefined
                };
                this.handleEvent<T>(name, socket, data, onEvent, tokenRequire)
            });
            socket.on('disconnect', () => this.handleDisconnect(socket, name));
        });
    }

    /**
     * Handle joining a room within a channel.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {string} channel - The name of the channel.
     * @param {string} room - The name of the room to join.
     */
    private handleRoomJoin(socket: LemurSocket<Session>, channel: string, room: string) {
        const roomName = `${channel}:${room}`;
        socket.join(roomName);
        if (!this.rooms.has(roomName)) {
            this.rooms.set(roomName, new Set());
        }
        this.rooms.get(roomName)!.add(socket);
        console.log(`Socket joined room ${roomName}`);
    }

    /**
     * Handle leaving a room within a channel.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {string} channel - The name of the channel.
     * @param {string} room - The name of the room to leave.
     */
    private handleRoomLeave(socket: LemurSocket<Session>, channel: string, room: string) {
        const roomName = `${channel}:${room}`;
        socket.leave(roomName);
        if (this.rooms.has(roomName)) {
            this.rooms.get(roomName)!.delete(socket);
            if (this.rooms.get(roomName)!.size === 0) {
                this.rooms.delete(roomName);
            }
        }
        console.log(`Socket left room ${roomName}`);
    }

    /**
     * Handle incoming event on a channel.
     * @param {string} name - The name of the channel.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {T} data - The data received with the event.
     * @param {LemurEvent<T, Session>} onEvent - Callback to handle the event.
     * @param {boolean} tokenRequire - Whether token authentication is required for the event.
     */
    private handleEvent<T>(name: string, socket: LemurSocket<Session>, data: LemurRequest<T, Session>, onEvent: LemurEvent<T, Session>, tokenRequire: boolean) {
        const token = this.authorization || socket.handshake.auth?.authorization || '';

        if (tokenRequire && this.secret) {
            const session = this.validToken<Session>(this.secret, token);
            if (!session) {
                return this.emitError(name, socket, 'Unauthorized access: No valid session found.');
            }
            socket.session = session;
            data.session = session;
        }

        try {
            onEvent(data, (response) => this.emitSuccess(name, socket, response));
        } catch (error: any) {
            this.emitError(name, socket, error.message);
        }
    }

    /**
     * Handle disconnection from a channel.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {string} channel - The name of the channel.
     */
    private handleDisconnect(socket: LemurSocket<Session>, channel: string) {
        console.log(`Client disconnected from channel ${channel}`);
        // Additional cleanup logic can be added here if needed
        socket.emit('disconnected', true);
    }

    /**
     * Emit success event to a socket.
     * @param {string} channel - The name of the channel.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {any} data - The data to emit with the event.
     */
    private emitSuccess(channel: string, socket: LemurSocket<Session>, data: any) {
        socket.emit(`${channel}:success`, data);
    }

    /**
     * Emit error event to a socket.
     * @param {string} channel - The name of the channel.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {string} error - The error message.
     */
    private emitError(channel: string, socket: LemurSocket<Session>, error: string) {
        socket.emit(`${channel}:error`, { error });
    }

    /**
     * Validate API key.
     * @param {string} apikey - The API key to validate.
     * @returns {boolean} True if the API key is valid, otherwise false.
     */
    private validApiKey(apikey: string): boolean {
        return apikey === this.apikey;
    }

    /**
     * Validate JWT token.
     * @param {string} secret - The secret key for JWT validation.
     * @param {string} authorization - The authorization header containing the token.
     * @returns {Session | undefined} The decoded token payload if validation is successful, otherwise undefined.
     */
    private validToken<Session>(secret: string, authorization: string): Session | undefined {
        authorization = authorization.replace(/Bearer/g, '').replace(/ /g, "");
        try {
            return this.extract<Session>(authorization, secret);
        } catch (error: any) {
            console.error('Token failed:', error?.message);
            return undefined;
        }
    }

    /**
     * Listen for incoming connections on the server.
     * @type {Function}
     */
    public listen: {
        (port?: number, hostname?: string, backlog?: number, listeningListener?: () => void): HTTPServer;
        (port?: number, hostname?: string, backlog?: number): HTTPServer;
        (port?: number, hostname?: string, listeningListener?: () => void): HTTPServer;
        (port?: number, backlog?: number, listeningListener?: () => void): HTTPServer;
        (port?: number, backlog?: number): HTTPServer;
        (port?: number, listeningListener?: () => void): HTTPServer;
        (path: string, backlog?: number, listeningListener?: () => void): HTTPServer;
        (path: string, listeningListener?: () => void): HTTPServer;
        (options: ListenOptions, listeningListener?: () => void): HTTPServer;
        (handle: any, backlog?: number, listeningListener?: () => void): HTTPServer;
        (handle: any, listeningListener?: () => void): HTTPServer;
    };
}