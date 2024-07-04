import { SocketServer } from '../';


type Session = { id: string };
const PORT = process.env.PORT || 3030
const server = new SocketServer<Session>({
    apikey: 'api-key',
    secret: 'jwt-secret',
    roomsEnabled: true
});


async function get() {
    return data;
}

async function add(product: { name: string }) {
    data.push({ id: data.length + 1, name: product.name })
    return data;
}

const data = [{ id: 1, name: 'Pizza' }, { id: 2, name: 'Pasta' }];

// Channel Defained
server.channel<any>('get/products', async (_, res) => {
    const products = await get();
    res(products)
});

server.channel<{ name: string }>('post/products', async (req, res) => {
    const products = await add(req.body);
    res(products);
});

// Server run on port
server.listen(PORT, () => {
    console.log(`Server Run http://localhost:${PORT}`);
});

// on Connection
server.connection({
    on: () => {
        console.log("onConnection")
    },
    off: () => {
        console.log("onDisconnect")
    }
});

// import http from 'http';
// import { Server } from 'socket.io';

// const server = http.createServer((_, res) => {
//     res.writeHead(404);
//     res.end();
// });

// const io = new Server(server, {
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"]
//     }
// });

// const PORT = process.env.PORT || 3030;

// // Datos de ejemplo
// const data = [{ id: 1, name: 'Pizza' }, { id: 2, name: 'Pasta' }];

// async function get() {
//     return data;
// }

// async function add(product: any) {
//     data.push({ id: data.length + 1, name: product.name });
//     return data;
// }

// io.on('connection', (socket) => {
//     console.log('connection');

//     // Manejar solicitud de añadir producto
//     socket.on('post/products', async (product) => {
//         const products = await add(product);
//         socket.emit('get/products::success', products);
//     });

//     // Manejar solicitud de obtener productos
//     socket.on('get/products', async () => {
//         const products = await get();
//         socket.emit('get/products::success', products);
//     });

//     socket.on('disconnect', () => {
//         console.log('Un cliente se ha desconectado');
//     });
// });

// server.listen(PORT, () => {
//     console.log(`Servidor escuchando en http://localhost:${PORT}`);
// });