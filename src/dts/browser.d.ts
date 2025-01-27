import { BroadcastOperator, ServerOptions } from 'socket.io';
import { ManagerOptions, SocketOptions } from 'socket.io-client';
import { WebPushLemur } from '../lib/web-push-lemur';
import { Subscription } from './push';

declare interface LemurSecurity extends Partial<ManagerOptions & Omit<SocketOptions, 'auth'>> {
    apiKey?: string;
    token?: string;
    auth?: Record<string, any>;
    transformOptions?: (auth: Record<string, any>) => Record<string, any>; // Nueva propiedad
}

declare type Params = Record<string, any> & { room?: string, authorization?: string }
declare type LemurRequest<T, S> = {
    session: S | undefined;
    params: Params;
    body: T;
}

declare type LemurData<T> = {
    params?: Params;
    data: T;
}

declare type LemurOpts<T> = {
    onSuccess: OnSuccessCallback<T>
    onError?: OnErrorCallback
    successChannel?: string
    room?: string
}

declare type LemurNext = (err?: any | undefined) => void;
declare type LemurResponse = (data: any) => void;
declare type LemurCatch = (data: string) => void;

declare type LemurSocketOptions = {
    room?: string,
    to(name: string, data: any, room: string | Array<string>): void,
    emit(channel: string, data: any): void
};

declare type LemurCustomEvent<T, S> = (
    request: LemurRequest<T, S>,
    socket: LemurSocketOptions,
    error: LemurCatch,
    webPush?: WebPushLemur<Subscription>
) => void;

declare type LemurSimpleEvent<T, S> = (
    request: LemurRequest<T, S>,
    onSuccess: LemurResponse,
    onError: LemurCatch,
    webPush?: WebPushLemur<Subscription>
) => void;

declare type LemurEvent<T, S> = LemurCustomEvent<T, S> | LemurSimpleEvent<T, S>


declare interface LemurEmit<T> {
    on: (data?: LemurData<T>, token?: string) => void
    off: () => void
}

declare type OnSuccessCallback<T = any> = (data: T) => void
declare type OnErrorCallback = (error: any) => void

declare interface ExpirationTime {
    state: true,
    exp: number // The expiration time in milliseconds.
}

declare interface ServerSettings {
    apikey?: string,
    secret?: string,
    options?: Partial<ServerOptions>
    roomsEnabled?: boolean | ExpirationTime
}

declare interface Channel<T> {
    onEvent: LemurEvent<any, T>,
    tokenRequired: boolean,
    roomSupport: boolean,
    pushManager?: WebPushLemur<Subscription>
}

declare interface ConnectionOpt {
    on?: () => void
    off?: () => void
}