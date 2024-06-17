import 'socket.io';

declare type LemurSocket<T extends any> = Socket<any, any, any, any, T>;
declare type LemurSecurity = { apiKey?: string, token?: string };
declare type LemurRequest<T, S> = {
    session: S | undefined;
    params: Record<string, any>;
    body: T;
};
declare type LemurData<T> = {
    params?: Record<string, any>;
    data: T;
};
declare type LemurNext = (err?: any | undefined) => void;
declare type LemurResponse = (data: any) => void;
declare type LemurEvent<T, S> = (request: LemurRequest<T, S>, response: LemurResponse) => void;
declare type LemurEmit<T> = (data: LemurData<T> | undefined, security?: OpsSecurity) => void;

declare type OnSuccessCallback<T = any> = (data: T) => void;
declare type OnErrorCallback = (error: any) => void;

