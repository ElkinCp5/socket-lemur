import { ManagerOptions, SocketOptions } from 'socket.io-client';

declare interface LemurSecurity extends Partial<& ManagerOptions & SocketOptions> {
    apiKey?: string,
    token?: string
};
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
    onSuccess: OnSuccessCallback<T>,
    onError?: OnErrorCallback,
    room?: string
}
declare type LemurNext = (err?: any | undefined) => void;
declare type LemurResponse = (data: any) => void;
declare type LemurCatch = (data: any) => void;
declare type LemurEvent<T, S> = (request: LemurRequest<T, S>, response: LemurResponse, error: LemurCatch) => void;
declare interface LemurEmit<T> {
    on: (data?: LemurData<T>, token?: string) => void
    off: () => void
}
declare type OnSuccessCallback<T = any> = (data: T) => void
declare type OnErrorCallback = (error: any) => void

declare interface ServerSettings {
    apikey?: string,
    secret?: string,
    options?: Partial<ServerOptions>
    roomsEnabled?: boolean
}

declare interface Channel<T> {
    onEvent: LemurEvent<any, T>,
    tokenRequire: boolean,
    roomSupport: boolean
}

declare interface ConnectionOpt {
    on?: () => void
    off?: () => void
}
