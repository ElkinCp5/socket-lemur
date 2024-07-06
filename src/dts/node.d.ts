import 'socket.io';
import { Socket } from 'socket.io';


declare type LemurSocket<T extends any> = Socket<any, any, any, any, T>;
