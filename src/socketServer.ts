import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer, ServerOptions } from 'socket.io';
import { ListenOptions } from 'net';
import { TokenManager } from './tokenManager';
// import { ExpiringMap } from './lib/expiring-map';
import { WebPushLemur } from './lib/web-push-lemur';
import { Logger } from './lib/logger';
import type { Subscription } from './dts/push';
import type { LoggerSystem } from './dts/logger';
import type { LemurSocket } from './dts/modules';
import { isLemurCustomSimpleEvent, isLemurCustomWebPushEvent, isLemurSimpleEvent, isLemurSimpleWebPushEvent, isWebPushLemur } from './lib/guard';
import type {
    ServerSettings,
    LemurNext,
    ConnectionOpt,
    LemurData,
    Params,
    LemurEvent,
    LemurRequest,
    Channel,
    ExpirationTime,
    LemurCustomEvents,
    LemurSimpleEvent,
    LemurSimpleWebPushEvent,
    LemurCustomSimpleEvent,
    LemurCustomWebPushEvent,
} from './dts/browser';

/**
 * SocketServer class for handling Socket.IO connections with optional room support.
 * @template Session - Type of the session object associated with each socket.
 */
export class SocketServer<Session extends Record<string, any>> extends TokenManager {
    protected io: SocketIOServer;
    protected socket: LemurSocket<Session> | undefined;

    private authorization?: string;
    private rooms: Map<string, Set<LemurSocket<Session>>>;
    private channels: Map<string, Channel<Session>>;

    private logger: LoggerSystem = new Logger("logger-console");

    constructor(
        private readonly settings?: ServerSettings,
        private readonly httpServer?: HTTPServer
    ) {
        super();
        const optsDefault: Partial<ServerOptions> = {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true
            },
            allowEIO3: true
        };

        let server = this.httpServer;
        if (server == undefined) {
            server = createServer((_: any, res: any) => {
                res.writeHead(404, { 'Content-Type': 'text/htm' });
                res.end('');
            });
        }

        this.rooms = new Map<string, Set<LemurSocket<Session>>>();
        this.channels = new Map();
        this.middleware = this.middleware.bind(this);
        this.connection = this.connection.bind(this);

        this.io = new SocketIOServer(server, this.settings?.options || optsDefault);
        this.listen = server.listen.bind(server);
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

    /**
     * Configures the Socket.IO server to handle WebSocket connections.
     *
     * This method sets up middleware, event listeners, and channel-specific logic for managing 
     * real-time communication. It supports optional callbacks for connection and disconnection events.
     *
     * @param {ConnectionOpt} [opts] - Optional configuration for handling connection events.
     * @param {() => void} [opts.on] - A callback to execute when a new connection is established.
     * @param {() => void} [opts.off] - A callback to execute when a connection is disconnected.
     */
    public connection(opts?: ConnectionOpt) {
        // Attach middleware and listen for 'connection' events
        this.io.use(this.middleware).on('connection', (socket: LemurSocket<Session>) => {
            // Execute optional 'on connection' callback
            this.execute(opts?.on);

            // Store the current socket reference
            this.socket = socket;

            // Iterate through defined channels to configure event listeners
            this.channels.forEach((config, name) => {
                if (config.roomSupport) {
                    // Handle joining and leaving rooms for channels that support it
                    socket.on(`${name}:join`, (room: string) => this.handleRoomJoin(socket, room));
                    socket.on(`${name}:leave`, (room: string) => this.handleRoomLeave(socket, room));
                }

                // Listen for events on the channel and handle them
                socket.on(name, ({ data: body, params }: LemurData<any>) => {
                    this.handleEvent<any>(name, socket, {
                        body,
                        params: params || {} as Params,
                        session: undefined
                    }, config.onEvent, config.tokenRequired, config.pushManager);
                });
            });

            // Listen for 'disconnect' events and execute the optional callback
            socket.on('disconnect', () => this.execute(opts?.off));
        });
    }


    /**
     * Sets the logger system for the current instance.
     * Allows the use of a custom logger for logging messages, errors, warnings, and info.
     *
     * @param {LoggerSystem} [logger] - An optional logger system that implements the LoggerSystem interface.
     * @returns {SocketServer<Session>} - Returns the current instance for method chaining.
     */
    public setLogger(logger?: LoggerSystem): SocketServer<Session> {
        if (logger) this.logger = logger;
        return this;
    }

    /**
     * Retrieves the Socket.IO server instance.
     * This instance is used to manage real-time communications through WebSocket connections.
     *
     * @returns {SocketIOServer} - Returns the current Socket.IO server instance.
     */
    public getIO(): SocketIOServer {
        return this.io;
    }

    /**
     * Retrieves the primary WebSocket connection instance.
     * This instance is used to interact directly with the WebSocket layer for emitting or handling events.
     *
     * @returns {LemurSocket<Session> | undefined} - Returns the current WebSocket connection instance.
     */
    public getSocket(): LemurSocket<Session> | undefined {
        return this.socket;
    }

    /**
    * Configures a channel with various input styles.
    *
    * @param name - The unique name of the channel.
    * @param onEvent - The event handler for the channel.
    * @param pushManager - Whether the channel supports webPush (optional).
    */
    public channel<T extends Record<string, any>>(
        name: string,
        onEvent: LemurSimpleWebPushEvent<T & { subscription: Subscription }, Session>,
        pushManager: WebPushLemur<Subscription>
    ): void;

    /**
    * Configures a channel with various input styles.
    *
    * @param name - The unique name of the channel.
    * @param onEvent - The event handler for the channel.
    * @param tokenRequired - Whether a token is required for the channel (optional).
    * @param pushManager - Whether the channel supports webPush (optional).
    */
    public channel<T extends Record<string, any>>(
        name: string,
        onEvent: LemurSimpleWebPushEvent<T & { subscription: Subscription }, Session>,
        tokenRequired: boolean,
        pushManager: WebPushLemur<Subscription>
    ): void;

    /**
    * Configures a channel with various input styles.
    *
    * @param name - The unique name of the channel.
    * @param onEvent - The event handler for the channel.
    * @param tokenRequired - Whether a token is required for the channel (optional).
    * @param roomSupport - Whether the channel supports rooms (optional).
    */
    public channel<T extends Record<string, any>>(
        name: string,
        onEvent: LemurSimpleEvent<T, Session>,
        tokenRequired?: boolean,
        roomSupport?: boolean,
    ): void;

    /**
    * Configures a channel with various input styles.
    *
    * @param name - The unique name of the channel.
    * @param onEvent - The event handler for the channel.
    * @param tokenRequired - Whether a token is required for the channel (optional).
    * @param roomSupport - Whether the channel supports rooms (optional).
    * @param pushManager - Whether the channel supports webPush (optional).
    */
    public channel<T extends Record<string, any>>(
        name: string,
        onEvent: LemurSimpleWebPushEvent<T & { subscription: Subscription }, Session>,
        tokenRequired: boolean,
        roomSupport: boolean,
        pushManager: WebPushLemur<Subscription>
    ): void;

    /**
     * Initialize handling for a channel with optional room support.
     * @param {string} name - The name of the channel.
     * @param {LemurEvent<T, Session>} onEvent - Callback to handle incoming events.
     */
    public channel<T extends Record<string, any>>(
        name: string,
        onEvent: LemurEvent<T, Session>,
        ...args: Array<any>
    ) {

        let channelName = name;
        let pushManager: WebPushLemur<Subscription> | undefined = undefined;
        const tokenRequired: boolean = typeof args[0] === 'boolean' ? args[0] : false;
        const roomSupport: boolean = typeof args[1] === 'boolean' ? args[1] : this.roomExpirationTime().state;

        if (isWebPushLemur(args[0])) pushManager = args[0];
        if (isWebPushLemur(args[1])) pushManager = args[1];
        if (isWebPushLemur(args[2])) pushManager = args[2];
        if (pushManager) channelName = `${name}:push-notifiation`;

        if (this.channels.has(channelName)) return; // Channel already configured, do not reconfigure
        this.channels.set(channelName, { onEvent, tokenRequired, roomSupport, pushManager });
    }

    /**
    * Configures a channel with various input styles.
    *
    * @param name - The unique name of the channel.
    * @param onEvent - The event handler for the channel.
    * @param pushManager - Whether the channel supports webPush (optional).
    */
    public customChannel<T extends Record<string, any>>(
        name: string,
        onEvent: LemurCustomWebPushEvent<T, Session>,
        pushManager: WebPushLemur<Subscription>
    ): void;

    /**
    * Configures a channel with various input styles.
    *
    * @param name - The unique name of the channel.
    * @param onEvent - The event handler for the channel.
    * @param tokenRequired - Whether a token is required for the channel (optional).
    * @param pushManager - Whether the channel supports webPush (optional).
    */
    public customChannel<T extends Record<string, any>>(
        name: string,
        onEvent: LemurCustomWebPushEvent<T, Session>,
        tokenRequired: boolean,
        pushManager: WebPushLemur<Subscription>
    ): void;

    /**
    * Configures a channel with various input styles.
    *
    * @param name - The unique name of the channel.
    * @param onEvent - The event handler for the channel.
    * @param tokenRequired - Whether a token is required for the channel (optional).
    * @param roomSupport - Whether the channel supports rooms (optional).
    */
    public customChannel<T extends Record<string, any>>(
        name: string,
        onEvent: LemurCustomSimpleEvent<T, Session>,
        tokenRequired?: boolean,
        roomSupport?: boolean,
    ): void;

    /**
    * Configures a channel with various input styles.
    *
    * @param name - The unique name of the channel.
    * @param onEvent - The event handler for the channel.
    * @param tokenRequired - Whether a token is required for the channel (optional).
    * @param roomSupport - Whether the channel supports rooms (optional).
    * @param pushManager - Whether the channel supports webPush (optional).
    */
    public customChannel<T extends Record<string, any>>(
        name: string,
        onEvent: LemurCustomWebPushEvent<T, Session>,
        tokenRequired: boolean,
        roomSupport: boolean,
        pushManager: WebPushLemur<Subscription>
    ): void;

    /**
     * Initialize handling for a channel with optional room support.
     * @param {string} name - The name of the channel.
     * @param {LemurEvent<T, Session>} onEvent - Callback to handle incoming events.
     */
    public customChannel<T extends Record<string, any>>(
        name: string,
        onEvent: LemurCustomEvents<T, Session>,
        ...args: Array<any>
    ) {
        let channelName = name;
        const tokenRequired: boolean = typeof args[0] === 'boolean' ? args[0] : false;
        const roomSupport: boolean = typeof args[1] === 'boolean' ? args[1] : this.roomExpirationTime().state;
        const pushManager: WebPushLemur<Subscription> | undefined = isWebPushLemur(args[0]) ? args[0] : undefined
        if (pushManager) channelName = `${name}:push-notifiation`;

        if (this.channels.has(channelName)) return; // Channel already configured, do not reconfigure
        this.channels.set(channelName, { onEvent, tokenRequired, roomSupport, pushManager });
    }

    private roomExpirationTime(): Omit<ExpirationTime, "state"> & { state: boolean } {
        if (
            this.settings?.roomsEnabled === undefined ||
            typeof this.settings?.roomsEnabled === "boolean"
        ) return { exp: (30 * 60 * 1000), state: this.settings?.roomsEnabled || false };

        return {
            ...this.settings?.roomsEnabled,
            exp: this.settings?.roomsEnabled.exp || (30 * 60 * 1000)
        };
    }

    /**
     * Middleware for authenticating API key and JWT token.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {LemurNext} next - The next function to call.
     */
    private middleware(socket: LemurSocket<Session>, next: LemurNext) {
        const { auth } = socket.handshake;
        const apikey = auth['x-api-key'] as string;
        this.authorization = auth['authorization'] as string;
        if (this.settings?.apikey && !this.validApiKey(apikey)) {
            this.logger.error('Unauthorized access: Invalid API key.', auth);
            return next(new Error('Unauthorized access: Invalid API key.'));
        }
        next();
    }

    /**
     * Handle joining a room within a channel.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {string} room - The name of the room to join.
     */
    private handleRoomJoin(socket: LemurSocket<Session>, room: string) {
        socket.join(room);
        if (!this.rooms.has(room)) {
            this.rooms.set(room, new Set());
        }
        this.rooms.get(room)!.add(socket);
    }

    /**
     * Handle leaving a room within a channel.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {string} room - The name of the room to leave.
     */
    private handleRoomLeave(socket: LemurSocket<Session>, room: string) {
        socket.leave(room);
        if (this.rooms.has(room)) {
            this.rooms.get(room)!.delete(socket);
            if (this.rooms.get(room)!.size === 0) {
                this.rooms.delete(room);
            }
        }
    }

    /**
     * Handle incoming event on a channel.
     * @param {string} channelName - The name of the channel.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {T} data - The data received with the event.
     * @param {LemurEvent<T, Session>} event - Callback to handle the event.
     * @param {boolean} tokenRequired - Whether token authentication is required for the event.
     */
    private handleEvent<T extends Record<string, any>>(
        channelName: string,
        socket: LemurSocket<Session>,
        data: LemurRequest<T, Session>,
        event: LemurEvent<T, Session>,
        tokenRequired: boolean,
        pushManager?: WebPushLemur<Subscription>
    ) {
        const token = this.authorization || data?.params?.authorization || '';
        const room = data?.params?.room;

        if (tokenRequired && this.settings?.secret) {
            const session = this.validToken<Session>(this.settings?.secret, token);
            if (!Object.keys(session).length) {
                return this.error(channelName, room || socket, 'Unauthorized access: No valid session found.');
            }
            socket.session = session;
            data.session = session;
        }

        try {
            const onError = (error: string) => this.error(channelName, room || socket, error)

            if (isLemurCustomSimpleEvent(event) || isLemurCustomWebPushEvent(event)) {
                const events = {
                    room,
                    to: (channel: string, data: any, room: string) => this.success(channel, room, data),
                    emit: (channel: string, data: any) => this.success(channel, socket, data),
                }
                if (isLemurCustomSimpleEvent(event)) return event(data, events, onError);
                return event(data, events, onError, pushManager as any);

            } else if (isLemurSimpleEvent(event) || isLemurSimpleWebPushEvent(event)) {
                const onSuccess = (response: any) => this.success(channelName, room || socket, response);
                if (isLemurSimpleEvent(event)) return event(data, onSuccess, onError);
                return event(data, onSuccess, onError, pushManager as any);
            } else {
                throw new Error("Unknown event type!");
            }

        } catch (error: any) {
            this.error(channelName, room || socket, error?.message || error);
        }
    }


    /**
     * Emit success event to a socket.
     * @param {string} channel - The name of the channel.
     * @param {LemurSocket<Session>| string} response - The socket instance.
     * @param {any} data - The data to emit with the event.
     */
    private success(
        channel: string,
        response: LemurSocket<Session> | string,
        data: any,
    ) {
        if (typeof response == 'string') {
            this.io.to(response).emit(`${channel}:success`, data);
            return;
        }
        response.emit(`${channel}:success`, data);
    }

    /**
     * Emit error event to a socket.
     * @param {string} channel - The name of the channel.
     * @param {LemurSocket<Session> | string} response - The socket instance.
     * @param {string} error - The error message.
     */
    private error(
        channel: string,
        response: LemurSocket<Session> | string,
        error: string,
    ) {
        if (typeof response == 'string') {
            this.io.to(response).emit(`${channel}:error`, { error });
        } else {
            response.emit(`${channel}:error`, { error });
        }
        this.logger.error(`${channel}:error`, error);
    }

    /**
     * Validate API key.
     * @param {string} apikey - The API key to validate.
     * @returns {boolean} True if the API key is valid, otherwise false.
     */
    private validApiKey(apikey: string): boolean {
        return apikey === this.settings?.apikey;
    }

    /**
     * Validate JWT token.
     * @param {string} secret - The secret key for JWT validation.
     * @param {string} authorization - The authorization header containing the token.
     * @returns {Session | undefined} The decoded token payload if validation is successful, otherwise undefined.
     */
    private validToken<Session>(secret: string, authorization: string): Session {
        authorization = authorization.replace(/Bearer/g, '').replace(/ /g, "");
        try {
            return this.extract<Session>(authorization, secret);
        } catch (error: any) {
            return {} as Session;
        }
    }

    private execute(fun?: () => void) {
        if (!fun) return;
        fun();
    };

}