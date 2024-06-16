import 'socket.io';

// import { IncomingMessage, ServerResponse, createServer, Server as HTTPServer } from 'http';
// import { ListenOptions } from 'net';

// Definir tipos para los eventos
declare interface ResponseEvents {
    success<T extends {}>(response: T): void;
    error<T>(error: T): void;
    pending(status: boolean): void;
}

declare module 'socket.io' {
    interface Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData, T> {
        session?: T;
    }
}