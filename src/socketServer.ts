import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer, ServerOptions } from 'socket.io';
import { ListenOptions } from 'net';
import { TokenManager } from './tokenManager';
import { LemurSocket } from './dts/node';
import { ServerSettings, LemurNext, ConnectionOpt, LemurData, Params, LemurEvent, LemurRequest, Channel } from './dts/browser';

/**
 * SocketServer class for handling Socket.IO connections with optional room support.
 * @template Session - Type of the session object associated with each socket.
 */
export class SocketServer<Session> extends TokenManager {
    protected io: SocketIOServer;
    private authorization?: string;
    private rooms: Map<string, Set<LemurSocket<Session>>>; // Map to store active rooms
    private channels: Map<string, Channel<Session>>;


    constructor(
        private readonly settings?: ServerSettings
    ) {
        super();
        const optsDefault: Partial<ServerOptions> = {
            cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
            allowEIO3: true
        };
        const httpServer = createServer((_: any, res: any) => {
            res.writeHead(404, { 'Content-Type': 'text/htm' });
            res.end('');
        });

        this.rooms = new Map();
        this.channels = new Map();
        this.middleware = this.middleware.bind(this);
        this.connection = this.connection.bind(this);

        this.io = new SocketIOServer(httpServer, this.settings?.options || optsDefault);
        this.listen = httpServer.listen.bind(httpServer);
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
     * Middleware for authenticating API key and JWT token.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {LemurNext} next - The next function to call.
     */
    private middleware(socket: LemurSocket<Session>, next: LemurNext) {
        const { auth } = socket.handshake;
        const apikey = auth['x-api-key'] as string;
        this.authorization = auth['authorization'] as string;
        if (this.settings?.apikey && !this.validApiKey(apikey)) {
            console.error('Unauthorized access', { auth });
            return next(new Error('Unauthorized access: Invalid API key.'));
        }
        next();
    }

    public connection(opts?: ConnectionOpt) {
        this.io.use(this.middleware).on('connection', (socket: LemurSocket<Session>) => {
            this.execute(opts?.on);

            this.channels.forEach((config, name) => {
                if (config.roomSupport) {
                    socket.on(`${name}:join`, (room: string) => this.handleRoomJoin(socket, room));
                    socket.on(`${name}:leave`, (room: string) => this.handleRoomLeave(socket, room));
                }

                socket.on(name, ({ data: body, params }: LemurData<any>) => {
                    this.handleEvent<any>(name, socket, {
                        body,
                        params: params || {} as Params,
                        session: undefined
                    }, config.onEvent, config.tokenRequire);
                });
            });

            socket.on('disconnect', () => this.execute(opts?.off));
        });
    }

    /**
     * Initialize handling for a channel with optional room support.
     * @param {string} name - The name of the channel.
     * @param {LemurEvent<T, Session>} onEvent - Callback to handle incoming events.
     * @param {boolean} [tokenRequire=false] - Whether token authentication is required for events on this channel.
     * @param {boolean} [roomSupport=this.roomsEnabled] - Whether room support is enabled for this channel.
     */
    public channel<T extends any = {}>(
        name: string,
        onEvent: LemurEvent<T, Session>,
        tokenRequire: boolean = false,
        roomSupport: boolean = this.settings?.roomsEnabled || false
    ) {
        if (this.channels.has(name)) {
            return; // Channel already configured, do not reconfigure
        }
        this.channels.set(name, { onEvent, tokenRequire, roomSupport });
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
        console.log(`Socket joined room ${room}`);
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
        console.log(`Socket left room ${room}`);
    }

    /**
     * Handle incoming event on a channel.
     * @param {string} name - The name of the channel.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {T} data - The data received with the event.
     * @param {LemurEvent<T, Session>} event - Callback to handle the event.
     * @param {boolean} tokenRequire - Whether token authentication is required for the event.
     */
    private handleEvent<T>(
        name: string,
        socket: LemurSocket<Session>,
        data: LemurRequest<T, Session>,
        event: LemurEvent<T, Session>,
        tokenRequire: boolean
    ) {
        const token = this.authorization || data?.params?.authorization || '';
        const room = data?.params?.room;

        if (tokenRequire && this.settings?.secret) {
            const session = this.validToken<Session>(this.settings?.secret, token);
            if (!session) {
                return this.error(name, socket, 'Unauthorized access: No valid session found.', room);
            }
            socket.session = session;
            data.session = session;
        }

        try {
            event(
                data,
                (res: any) => this.success(name, socket, res, room),
                (error: any) => this.error(name, socket, error, room)
            );
        } catch (error: any) {
            this.error(name, socket, error?.message || error, room);
        }
    }

    /**
     * Emit success event to a socket.
     * @param {string} channel - The name of the channel.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {any} data - The data to emit with the event.
     */
    private success(
        channel: string,
        socket: LemurSocket<Session>,
        data: any,
        room: string | undefined
    ) {
        if (room) {
            this.io.to(room).emit(`${channel}:success`, data);
            return;
        }
        socket.emit(`${channel}:success`, data);
    }

    /**
     * Emit error event to a socket.
     * @param {string} channel - The name of the channel.
     * @param {LemurSocket<Session>} socket - The socket instance.
     * @param {string} error - The error message.
     */
    private error(
        channel: string,
        socket: LemurSocket<Session>,
        error: any,
        room: string | undefined
    ) {
        if (room) {
            this.io.to(room).emit(`${channel}:error`, { error });
        } else {
            socket.emit(`${channel}:error`, { error });
        }
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
    private validToken<Session>(secret: string, authorization: string): Session | undefined {
        authorization = authorization.replace(/Bearer/g, '').replace(/ /g, "");
        try {
            return this.extract<Session>(authorization, secret);
        } catch (error: any) {
            console.error('Token failed:', error?.message);
            return undefined;
        }
    }

    private execute(fun?: () => void) {
        if (!fun) return;
        fun();
    };

}