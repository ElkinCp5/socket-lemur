import 'socket.io';
import { Socket } from 'socket.io';

declare module 'socket.io' {
    interface Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData, T> {
        session?: T;
    }
}

declare type LemurSocket<T extends any> = Socket<any, any, any, any, T>;