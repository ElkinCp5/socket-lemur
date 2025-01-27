import { io, Socket as SocketIOClient } from 'socket.io-client';
import type { LemurData, LemurOpts, LemurSecurity, OnErrorCallback } from './dts/browser';
import type { LoggerSystem } from './dts/logger';
import { Logger } from './lib/logger';

export interface EventsMap {
    [event: string]: (...args: any[]) => void;
}

export type ServiceWorkerTypes = {
    path: string,
    vapidPublicKey: string,
    options?: RegistrationOptions
} | {
    registration: ServiceWorkerRegistration
    vapidPublicKey: string,
} | PushSubscription

export type ServiceWorkerChannel<T> = {
    name: string,
    opts: LemurOpts<T>
}

export type ServiceWorkerLemur<T> = {
    serviceWorker: ServiceWorkerTypes,
    channel: ServiceWorkerChannel<T>
}

export type ChannelLemur<T> = {
    emit: (data?: LemurData<T>, token?: string) => void;
    off: () => void;
    on: () => void;
}

export class SocketClient {
    protected socket: SocketIOClient<EventsMap, EventsMap>;
    // Settings libreries
    private logger: LoggerSystem = new Logger("logger-console");

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

        this.socket = io(
            this.url,
            this.setOpt(this.security)
        ).on("connect_error", onError);
    }


    /**
     * Manages the setup and functionality of a Service Worker and Push API for a given channel.
     * This method registers a Service Worker, subscribes to push notifications if required,
     * and provides a set of functions for emitting, listening, and removing events associated with the channel.
     *
     * @template T - The type of data used in the Lemur channel.
     * @param {Object} param - The configuration object.
     * @param {ServiceWorkerLemur<T>} param.serviceWorker - Configuration for the Service Worker and Push API.
     * @param {ServiceWorkerChannel<T>} param.channel - Configuration for the Lemur channel.
     * @returns {Promise<ChannelLemur<T> | undefined>} - Returns an object with
     * event handling methods (`emit`, `off`, `on`) if successful, or `undefined` if an error occurs or the setup fails.
     */
    public async serviceWorker<T>({ serviceWorker, channel }: ServiceWorkerLemur<T>): Promise<ChannelLemur<T> | undefined> {
        // Check if the browser supports Service Workers and the Push API
        if (!('serviceWorker' in navigator && 'PushManager' in window)) {
            this.logger.warn('Browser does not support Service Workers or Push API.');
            return undefined;
        }

        try {
            let registration: ServiceWorkerRegistration | undefined;
            let subscription: PushSubscription | undefined;

            // Handle different types of serviceWorker configurations
            if ('path' in serviceWorker && 'options' in serviceWorker) {
                // Register a new Service Worker if `path` and `options` are provided
                registration = await navigator.serviceWorker.register(serviceWorker.path, serviceWorker.options);
            } else if ('registration' in serviceWorker && 'vapidPublicKey' in serviceWorker) {
                // Use an existing Service Worker registration
                registration = serviceWorker.registration as ServiceWorkerRegistration;
            } else if ('endpoint' in serviceWorker) {
                // Use an existing PushSubscription
                subscription = serviceWorker as PushSubscription;
            } else {
                this.logger.warn('Invalid ServiceWorkerLemur configuration');
                return undefined;
            }

            // Wait until the Service Worker is fully ready
            await navigator.serviceWorker.ready;

            // Attempt to subscribe to push notifications if `vapidPublicKey` is provided
            if ('path' in serviceWorker && serviceWorker.vapidPublicKey && registration) {
                subscription = await this.subscribePush(registration, serviceWorker.vapidPublicKey);
            }

            // Validate subscription
            if (!subscription) {
                this.logger.warn('Invalid PushSubscription configuration');
                return undefined;
            }

            const { name, opts } = channel;
            const eventName = `${name}:push-notifiation`;

            // Return event handling methods for the channel
            return {
                /**
                 * Emits an event to the channel with optional data and token.
                 *
                 * @param {LemurData<T>} [data] - The data to be sent with the event.
                 * @param {string} [token] - An optional token for authentication.
                 */
                emit: (data?: LemurData<T>, token?: string): void => {
                    return this.emit(eventName, { ...data, data: { ...data?.data, subscription } }, token, opts.room);
                },
                /**
                 * Removes the event listeners for the channel.
                 */
                off: () => this.off(eventName, opts),
                /**
                 * Registers event listeners for the channel.
                 */
                on: () => this.on(eventName, opts)
            };
        } catch (error) {
            // Log the error and return undefined
            await this.logger.error('Error registering Service Worker or subscribing to push notifications:', error);
            return undefined;
        }
    }


    /**
     * Suscribirse a notificaciones push con la clave VAPID proporcionada
     *
     * @template T - The type of data that the channel handles.
     * @param {ServiceWorkerRegistration} registration - The name of the channel.
     * @param {string} vapidPublicKey - The options for the channel, including success and error callbacks, and an optional room.
     *
     * @returns {Promise<PushSubscription | undefined>} An object with `on` and `off` methods to manage the channel.
    */
    private async subscribePush(registration: ServiceWorkerRegistration, vapidPublicKey: string): Promise<PushSubscription | undefined> {
        try {
            return await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
            });
        } catch (error) {
            await this.logger.error('Error subscribing to Push Notifications:', error);
            return undefined;
        }
    }

    /**
     * Sets the logger system for the current instance.
     * Allows the use of a custom logger for logging messages, errors, warnings, and info.
     *
     * @param {LoggerSystem} [logger] - An optional logger system that implements the LoggerSystem interface.
     * @returns {SocketClient} - Returns the current instance for method chaining.
     */
    public setLogger(logger?: LoggerSystem): SocketClient {
        if (logger) this.logger = logger;
        return this;
    }

    /**
     * Retrieves the primary WebSocket connection instance.
     * This instance is used to interact directly with the WebSocket layer for emitting or handling events.
     *
     * @returns {SocketIOClient} - Returns the current WebSocket connection instance.
     */
    public getSocket(): SocketIOClient {
        return this.socket;
    }

    /**
    * Creates a new channel for communication.
    *
    * @template T - The type of data that the channel handles.
    * @param {string} name - The name of the channel.
    * @param {LemurOpts<T>} opts - The options for the channel, including success and error callbacks, and an optional room.
    *
    * @returns {ChannelLemur<T>} An object with `on` and `off` methods to manage the channel.
    */
    public channel<T>(name: string, opts: LemurOpts<T>): ChannelLemur<T> {
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
            off: () => this.off(name, opts),
            /**
             * Event listeners for the channel.
             */
            on: () => this.on(name, opts)
        };
    }

    /**
     * Connected from the WebSocket server.
     *
     * @returns {boolean}
     */
    public connected(): boolean {
        return this.socket.connected;
    }

    /**
     * Connect from the WebSocket server.
     *
     * @returns {void}
     */
    public connect(): void {
        this.socket.connect();
    }

    /**
     * Disconnect from the WebSocket server.
     *
     * @returns {void}
     */
    public disconnect(): void {
        this.socket.disconnect();
    }

    /**
     * Join a channel without setting up callbacks.
     * @param {string} name - The name of the channel to join.
     * @param {string} room - The room of the channel to join.
     * @returns {void}
     */
    public join(name: string, room?: string): void {
        this.socket.emit(`${name}:join`, room);
    }

    /**
     * Leave a channel.
     * @param {string} name - The name of the channel to leave.
     * @param {string} room - The room of the channel to leave.
     * @returns {void}
    */
    public leave(name: string, room?: string): void {
        this.socket.emit(`${name}:leave`, room);
    }


    /**
     * Setting of security.
     * @param {Partial<LemurSecurity>} security - The name of the channel to leave.
     * @returns {Record<string, any>}
    */
    public setOpt(security?: Partial<LemurSecurity>): Record<string, any> {
        const opts: Record<string, any> = { auth: {}, autoConnect: false };

        if (security) {

            if (typeof security.transformOptions === 'function') {
                try {
                    const transformedOptions = security.transformOptions(opts.auth);
                    if (typeof transformedOptions !== 'object') {
                        throw new Error('transformOptions must return a valid object');
                    }
                    Object.assign(opts.auth, transformedOptions);
                } catch (error) {
                    this.logger.error('Error in transformOptions:', error);
                }
            }

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
     * Registers event listeners for the specified channel.
     *
     * @template T - The type of data that the channel handles.
     * @param {string} channel - The name of the channel.
     * @param {LemurOpts<T>} opts - The options for the channel, including success and error callbacks, and an optional room.
     */
    private on<T>(channel: string, opts: LemurOpts<T>): void {
        if (opts?.room) this.socket.emit(`${channel}:join`, opts.room);
        if (opts?.successChannel) {
            this.socket.on(`${opts?.successChannel}:success`, opts.onSuccess);
        } else {
            this.socket.on(`${channel}:success`, opts.onSuccess);
        }
        this.socket.on(`${channel}:error`, opts?.onError || console.error);
    }

    /**
     * Removes the event listeners for the specified channel.
     *
     * @param {string} channel - The name of the channel.
     * @param {LemurOpts<any>} opts - The options for the channel, including success and error callbacks, and an optional room.
     */
    private off(channel: string, opts: Omit<LemurOpts<any>, 'onSuccess' | 'onError'>): void {
        if (opts?.room) this.socket.off(`${channel}:join`);
        if (opts?.successChannel) {
            this.socket.off(`${opts?.successChannel}:success`);
        } else {
            this.socket.off(`${channel}:success`);
        }
        this.socket.off(`${channel}:error`);
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

    /**
     * Convert a VAPID key in Base64 to Uint8Array
     *
     * @returns {Uint8Array}
     */
    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
    }

}
