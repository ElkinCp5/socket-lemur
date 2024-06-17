import { io, Socket as SocketIOClient } from 'socket.io-client';
import { LemurData, LemurEmit, LemurSecurity, OnErrorCallback, OnSuccessCallback } from './dts/types';



export class SocketClient {
    private socket: SocketIOClient;

    /**
     * Creates an instance of SocketClient.
     * @param {string} serverUrl - The URL of the WebSocket server.
     * @param {LemurSecurity} [security] - Optional security options.
     * @param {OnErrorCallback} [onError] - Optional callback to handle errors.
     */
    constructor(serverUrl: string, security?: LemurSecurity, onError?: OnErrorCallback) {
        this.socket = this.init(serverUrl, security, onError);
    }

    /**
     * Initializes the socket connection with the provided server URL and headers.
     * @param {string} serverUrl - The URL of the WebSocket server.
     * @param {LemurSecurity} [security] - Optional security options.
     * @param {OnErrorCallback} [onError] - Optional callback to handle errors.
     * @returns {SocketIOClient} The initialized socket instance.
     */
    private init(serverUrl: string, security?: LemurSecurity, onError?: OnErrorCallback): SocketIOClient {
        const opts: Record<string, any> = { auth: {} };

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
    public channel<T>(channel: string, onError: OnErrorCallback, onSuccess: OnSuccessCallback<T>, room?: string): LemurEmit<T> {
        this.register(channel, onError, onSuccess, room);
        /**
         * Emits an event on the specified channel/room with the provided data and headers.
         * @param {T | undefined} [data] - The data to emit with the event.
         * @param {LemurSecurity | undefined} [security] - Additional headers to send with the event.
         * @returns {void}
         */
        return (data?: LemurData<T>, security?: LemurSecurity): void => {
            this.emitEvent(channel, data, security, room);
        };
    }

    /**
     * Registers a channel and optionally a room with the provided callbacks for error and success events.
     * @param {string} channel - The name of the channel to register.
     * @param {OnErrorCallback} onError - Callback to handle error events.
     * @param {OnSuccessCallback} onSuccess - Callback to handle success events.
     * @param {string} [room] - Optional room name to join within the channel.
     */
    private register<T>(channel: string, onError: OnErrorCallback, onSuccess: OnSuccessCallback<T>, room?: string): void {
        this.socket.on("connect", () => {
            if (room) {
                this.socket.emit('join', room);
            }
            this.socket.on(`${channel}${room ? `:${room}` : ''}:error`, onError);
            this.socket.on(`${channel}${room ? `:${room}` : ''}:success`, onSuccess);
        })
    }

    /**
     * Emits an event on the specified channel/room with the provided data and headers.
     * @param {string} channel - The name of the channel to emit the event on.
     * @param {T} [data] - The data to emit with the event.
     * @param {LemurSecurity} [security] - Additional headers to send with the event.
     * @param {string} [room] - Optional room name to emit the event in.
     */
    private emitEvent<T>(channel: string, data?: T, security?: LemurSecurity, room?: string): void {
        const channelName = `${channel}${room ? `:${room}` : ''}`;
        this.socket.on("connect", () => {
            this.socket.emit(channelName, data, { auth: { ...this.socket.auth, ...security } });
        })
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
