import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer, ServerOptions } from 'socket.io';
import { ListenOptions } from 'net';
import { LemurSocket } from './dts/node';
import { LoggerSystem } from './dts/logger';
import { ServerSettings, LemurNext, ConnectionOpt, LemurData, Params, LemurEvent, LemurRequest, Channel, LemurCustomEvent, LemurStandard, ExpirationTime } from './dts/browser';
import { TokenManager } from './tokenManager';
import { ExpiringMap } from './lib/expiring-map';
import { Logger } from './lib/logger';

/**
 * SocketServer class for handling Socket.IO connections with optional room support.
 * @template Session - Type of the session object associated with each socket.
 */
export class SocketServer<Session extends Record<string, any>> extends TokenManager {
    protected io: SocketIOServer;
    private authorization?: string;
    private rooms: ExpiringMap<Set<LemurSocket<Session>>>;
    private channels: Map<string, Channel<Session>>;


    constructor(
        private readonly settings?: ServerSettings,
        private readonly httpServer?: HTTPServer,
        private readonly logger: LoggerSystem = new Logger("logger-console"),
    ) {
        super();
        const optsDefault: Partial<ServerOptions> = {
            cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
            allowEIO3: true
        };

        let server = this.httpServer;
        if (server == undefined) {
            server = createServer((_: any, res: any) => {
                res.writeHead(404, { 'Content-Type': 'text/htm' });
                res.end('');
            });
        }

        this.rooms = new ExpiringMap<Set<LemurSocket<Session>>>(this.roomExpirationTime().exp);
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
                    }, config.onEvent, config.tokenRequired);
                });
            });

            socket.on('disconnect', () => this.execute(opts?.off));
        });
    }

    /**
     * Initialize handling for a channel with optional room support.
     * @param {string} name - The name of the channel.
     * @param {LemurEvent<T, Session>} onEvent - Callback to handle incoming events.
     * @param {boolean} [tokenRequired=false] - Whether token authentication is required for events on this channel.
     * @param {boolean} [roomSupport=this.roomsEnabled] - Whether room support is enabled for this channel.
     */
    public channel<T extends Record<string, any>>(
        name: string,
        onEvent: LemurStandard<T, Session>,
        tokenRequired: boolean = false,
        roomSupport: boolean = this.roomExpirationTime().state,
    ) {
        if (this.channels.has(name)) {
            return; // Channel already configured, do not reconfigure
        }
        this.channels.set(name, { onEvent, tokenRequired, roomSupport });
    }

    /**
     * Initialize handling for a channel with optional room support.
     * @param {string} name - The name of the channel.
     * @param {LemurEvent<T, Session>} onEvent - Callback to handle incoming events.
     * @param {boolean} [tokenRequired=false] - Whether token authentication is required for events on this channel.
     * @param {boolean} [roomSupport=this.roomsEnabled] - Whether room support is enabled for this channel.
     */
    public customChannel<T extends Record<string, any>>(
        name: string,
        onEvent: LemurCustomEvent<T, Session>,
        tokenRequired: boolean = false,
        roomSupport: boolean = this.roomExpirationTime().state,
    ) {
        if (this.channels.has(name)) {
            return; // Channel already configured, do not reconfigure
        }
        this.channels.set(name, { onEvent, tokenRequired, roomSupport });
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
        tokenRequired: boolean
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

        // Guardia de tipo para verificar si un evento es de tipo `LemurCustomEvent`
        function isLemurCustomEvent<T, S>(event: LemurEvent<T, S>): event is LemurCustomEvent<T, S> {
            return 'socket' in (event as LemurCustomEvent<T, S>);
        }

        try {

            if (isLemurCustomEvent(event)) return event(data, {
                room,
                to: (channel: string, data: any, room: string) => this.success(channel, room, data),
                emit: (channel: string, data: any) => this.success(channel, socket, data),
            }, (error: string) => this.error(channelName, room || socket, error));
            else return event(
                data,
                (response: any) => this.success(channelName, room || socket, response),
                (error: string) => this.error(channelName, room || socket, error)
            );
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