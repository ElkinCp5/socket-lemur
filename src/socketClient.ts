import { io, ManagerOptions, Socket as SocketIOClient, SocketOptions } from 'socket.io-client';
import { LemurData, LemurEmit, LemurSecurity, OnErrorCallback, OnSuccessCallback } from './dts/types';



export class SocketClient {
    private socket: SocketIOClient;

    /**
     * Creates an instance of SocketClient.
     * @param {string} serverUrl - The URL of the WebSocket server.
     * @param {LemurSecurity} [security] - Optional security options.
     * @param {OnErrorCallback} [onError] - Optional callback to handle errors.
     */
    constructor(
        private readonly serverUrl: string,
        private readonly security?: LemurSecurity,
        onError?: OnErrorCallback
    ) {
        this.socket = this.init(this.serverUrl, this.security, onError);
    }

    /**
     * Initializes the socket connection with the provided server URL and headers.
     * @param {string} serverUrl - The URL of the WebSocket server.
     * @param {LemurSecurity} [security] - Optional security options.
     * @param {OnErrorCallback} [onError] - Optional callback to handle errors.
     * @returns {SocketIOClient} The initialized socket instance.
     */
    private init(serverUrl: string, security?: Partial<LemurSecurity & ManagerOptions & SocketOptions>, onError?: OnErrorCallback): SocketIOClient {
        const opts: Record<string, any> = { auth: {}, autoConnect: false };

        if (security) {
            for (const [key, value] of Object.entries(security)) {
                switch (key) {
                    case 'token':
                        opts.auth['authorization'] = `Bearer ${value}`;
                        break;
                    case 'apiKey':
                        opts.auth['x-api-key'] = value;
                        break;
                    default:
                        opts[key] = value;
                        break;
                }
            }
        }

        return io(serverUrl, opts).on("connect_error", (e: any) => onError || console.error(`Connect error: ${e}`));
    }

    /**
     * Connect to a channel and optionally a room, and set up callbacks for error and success events.
     * @param {string} channel - The name of the channel to connect to.
     * @param {OnErrorCallback} onError - Callback to handle error events.
     * @param {OnSuccessCallback} onSuccess - Callback to handle success events.
     * @param {string} [room] - Optional room name to join within the channel.
     * @returns {LemurEmit} A function to emit events on the connected channel/room with optional custom headers.
     */
    public channel<T>(channel: string, onSuccess: OnSuccessCallback<T>, onError?: OnErrorCallback, room?: string): LemurEmit<T> {
        this.register(channel, onSuccess, onError, room);
        /**
         * Emits an event on the specified channel/room with the provided data and headers.
         * @param {T | undefined} [data] - The data to emit with the event.
         * @param {string | undefined} [token] - Additional headers to send with the event.
         * @returns {void}
         */
        return (data?: LemurData<T>, token?: string): void => {
            this.emitEvent(channel, data, token, room);
        };
    }

    /**
     * Registers a channel and optionally a room with the provided callbacks for error and success events.
     * @param {string} channel - The name of the channel to register.
     * @param {OnErrorCallback} onError - Callback to handle error events.
     * @param {OnSuccessCallback} onSuccess - Callback to handle success events.
     * @param {string} [room] - Optional room name to join within the channel.
     */
    private register<T>(channel: string, onSuccess: OnSuccessCallback<T>, onError?: OnErrorCallback, room?: string): void {
        if (room) {
            this.socket.emit('join', room);
        }
        this.socket.on(`${channel}${room ? `:${room}` : ''}:error`, onError || console.error)
        this.socket.on(`${channel}${room ? `:${room}` : ''}:success`, onSuccess);
    }

    /**
     * Emits an event on the specified channel/room with the provided data and headers.
     * @param {string} name - The name of the channel to emit the event on.
     * @param {T} [data] - The data to emit with the event.
     * @param {string} [token] - Additional headers to send with the event.
     * @param {string} [room] - Optional room name to emit the event in.
     */
    private emitEvent<T>(name: string, data?: T, token?: string, room?: string): void {
        const channel = `${name}${room ? `:${room}` : ''}`;
        if (token) (data as any).authorization = `Bearer ${token}`
        this.socket.emit(channel, data);
    }

    /**
     * Disconnect from the WebSocket server.
     */
    public disconnect(): void {
        this.socket.disconnect();
    }

    /**
     * Reconnect to the WebSocket server.
     */
    public reconnect(): void {
        this.socket.connect();
    }

    /**
     * Join a channel without setting up callbacks.
     * @param {string} channel - The name of the channel to join.
     */
    public joinChannel(channel: string): void {
        this.socket.emit('join', channel);
    }

    /**
     * Leave a channel.
     * @param {string} channel - The name of the channel to leave.
     */
    public leaveChannel(channel: string): void {
        this.socket.emit('leave', channel);
    }

    /**
     * Join a specific room within a channel.
     * @param {string} channel - The name of the channel to join.
     * @param {string} room - The name of the room to join.
     */
    public joinRoom(channel: string, room: string): void {
        this.socket.emit('join', `${channel}:${room}`);
    }

    /**
     * Leave a specific room within a channel.
     * @param {string} channel - The name of the channel to leave.
     * @param {string} room - The name of the room to leave.
     */
    public leaveRoom(channel: string, room: string): void {
        this.socket.emit('leave', `${channel}:${room}`);
    }
}
