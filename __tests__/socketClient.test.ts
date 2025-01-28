import { SocketClient } from "../src/socketClient";
import { io } from 'socket.io-client';

jest.mock('socket.io-client', () => {
    const mSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn(),
        connect: jest.fn(),
        disconnect: jest.fn(),
    };
    return {
        io: jest.fn(() => mSocket),
    };
});

describe('SocketClient', () => {
    let client: SocketClient;
    const mockUrl = 'http://localhost:3000';
    const mockSecurity = { token: 'mockToken' };
    const mockOnError = jest.fn();
    const mockSocket = io() as unknown as jest.Mocked<any>;

    beforeEach(() => {
        jest.clearAllMocks();
        client = new SocketClient(mockUrl, mockSecurity, mockOnError);
    });

    test('should initialize with correct URL and options', () => {
        expect(io).toHaveBeenCalledWith(mockUrl, expect.objectContaining({
            auth: { authorization: 'Bearer mockToken' },
            autoConnect: false,
        }));
        expect(mockSocket.on).toHaveBeenCalledWith('connect_error', mockOnError);
    });

    test('should connect to the WebSocket server', () => {
        client.connect();
        expect(mockSocket.connect).toHaveBeenCalled();
    });

    test('should disconnect from the WebSocket server', () => {
        client.disconnect();
        expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    test('should return connection status', () => {
        mockSocket.connected = true;
        expect(client.connected()).toBe(true);

        mockSocket.connected = false;
        expect(client.connected()).toBe(false);
    });

    test('should join a channel', () => {
        const channelName = 'testChannel';
        const room = 'testRoom';

        client.join(channelName, room);
        expect(mockSocket.emit).toHaveBeenCalledWith(`${channelName}:join`, room);
    });

    test('should leave a channel', () => {
        const channelName = 'testChannel';
        const room = 'testRoom';

        client.leave(channelName, room);
        expect(mockSocket.emit).toHaveBeenCalledWith(`${channelName}:leave`, room);
    });

    test('should emit an event to a channel', () => {
        const eventName = 'testEvent';
        const data = { key: 'value' } as any;
        const token = 'testToken';
        const room = 'testRoom';

        client['emit'](eventName, data, token, room); // Acceso directo al método privado
        expect(mockSocket.emit).toHaveBeenCalledWith(eventName, {
            ...data,
            token,
            room,
        });
    });

    test('should register event listeners for a channel', () => {
        const channel = 'testChannel';
        const opts = {
            room: 'testRoom',
            onSuccess: jest.fn(),
            onError: jest.fn(),
        };

        client['on'](channel, opts); // Acceso directo al método privado
        expect(mockSocket.emit).toHaveBeenCalledWith(`${channel}:join`, opts.room);
        expect(mockSocket.on).toHaveBeenCalledWith(`${channel}:success`, opts.onSuccess);
        expect(mockSocket.on).toHaveBeenCalledWith(`${channel}:error`, opts.onError);
    });

    test('should remove event listeners for a channel', () => {
        const channel = 'testChannel';
        const opts = { room: 'testRoom' };

        client['off'](channel, opts); // Acceso directo al método privado
        expect(mockSocket.off).toHaveBeenCalledWith(`${channel}:join`);
        expect(mockSocket.off).toHaveBeenCalledWith(`${channel}:success`);
        expect(mockSocket.off).toHaveBeenCalledWith(`${channel}:error`);
    });
});