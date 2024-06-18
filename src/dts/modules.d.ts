import 'socket.io';

declare module 'socket.io' {
    interface Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData, T> {
        session?: T;
    }
}
