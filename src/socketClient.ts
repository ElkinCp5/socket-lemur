import { io, ManagerOptions, Socket as SocketIOClient, SocketOptions } from 'socket.io-client';
import { LemurData, LemurOpts, LemurSecurity, OnErrorCallback } from './dts/browser';

export interface EventsMap {
    [event: string]: (...args: any[]) => void;
}

export class SocketClient {
    protected socket: SocketIOClient<EventsMap, EventsMap>;

    /**
     * Creates an instance of SocketClient.
     * @param {string} url - The URL of the WebSocket server.
     * @param {LemurSecurity} [security] - Optional security options.
     * @param {OnErrorCallback} [onError] - Optional callback to handle errors.
     */
    constructor(
        private readonly url: string,
        private readonly security?: LemurSecurity,
        onError: OnErrorCallback = (error: any) => console.error(`Connect error: ${error}`)
    ) {
        this.connected = this.connected.bind(this);
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.channel = this.channel.bind(this);
        this.emit = this.emit.bind(this);
        this.off = this.off.bind(this);
        this.on = this.on.bind(this);

        this.socket = io(this.url, this.setOpt(this.security))
            .on("connect_error", onError);
    }

    private setOpt(security?: Partial<LemurSecurity & ManagerOptions & SocketOptions>) {
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
        return opts;
    }

    /**
    * Creates a new channel for communication.
    *
    * @template T - The type of data that the channel handles.
    * @param {string} name - The name of the channel.
    * @param {LemurOpts<T>} opts - The options for the channel, including success and error callbacks, and an optional room.
    * @returns An object with `on` and `off` methods to manage the channel.
    */
    public channel<T>(name: string, opts: LemurOpts<T>) {
        return {
            /**
             * Emits an event to the channel with optional data and token.
             *
             * @param {LemurData<T>} [data] - The data to be sent with the event.
             * @param {string} [token] - An optional token for authentication.
             */
            emit: (data?: LemurData<T>, token?: string): void => this.emit(name, data, token, opts.room),
            /**
             * Removes the event listeners for the channel.
             */
            off: () => this.off(name, opts.room),
            /**
             * Event listeners for the channel.
             */
            on: () => this.on(name, opts)
        };
    }

    /**
     * Connected from the WebSocket server.
     */
    public connected(): boolean {
        return this.socket.connected;
    }

    /**
     * Connect from the WebSocket server.
     */
    public connect() {
        return this.socket.connect();
    }

    /**
     * Disconnect from the WebSocket server.
     */
    public disconnect() {
        return this.socket.disconnect();
    }

    /**
     * Join a channel without setting up callbacks.
     * @param {string} name - The name of the channel to join.
     * @param {string} room - The room of the channel to join.
     */
    public join(name: string, room?: string): void {
        this.socket.emit(`${name}:join`, room);
    }

    /**
     * Leave a channel.
     * @param {string} name - The name of the channel to leave.
     * @param {string} room - The room of the channel to leave.
    */
    public leave(name: string, room?: string): void {
        this.socket.emit(`${name}:leave`, room);
    }

    /**
     * Registers event listeners for the specified channel.
     *
     * @template T - The type of data that the channel handles.
     * @param {string} channel - The name of the channel.
     * @param {LemurOpts<T>} opts - The options for the channel, including success and error callbacks, and an optional room.
     */
    private on<T>(channel: string, opts: LemurOpts<T>): void {
        if (opts?.room) this.socket.emit(`${channel}:join`, opts.room);
        this.socket.on(`${channel}:error`, opts?.onError || console.error);
        this.socket.on(`${channel}:success`, opts.onSuccess);
    }

    /**
     * Removes the event listeners for the specified channel.
     *
     * @param {string} channel - The name of the channel.
     * @param {string} [room] - The name of the room to leave, if applicable.
     */
    private off(channel: string, room?: string): void {
        if (room) this.socket.off(`${channel}:join`);
        this.socket.off(`${channel}:error`);
        this.socket.off(`${channel}:success`);
    }

    /**
     * Emits an event to the specified channel with optional data and token.
     *
     * @template T - The type of data that the channel handles.
     * @param {string} name - The name of the channel.
     * @param {LemurData<T>} [data] - The data to be sent with the event.
     * @param {string} [token] - An optional token for authentication.
     * @param {string} [room] - The name of the room to emit the event to, if applicable.
     */
    private emit<T>(name: string, data?: LemurData<T>, token?: string, room?: string): void {
        const state = {
            params: data?.params || {},
            data: data?.data || {} as any
        };
        if (token) state.params.authorization = `Bearer ${token}`;
        if (room) state.params.room = room;
        this.socket.emit(name, state);
    }

}
