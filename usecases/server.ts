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

server.customChannel<{ name: string }>('post/products', async (req, { emit, to }, error) => {
    try {
        if (!req.body.name) throw new Error("field name is required!.");
        const products = await add(req.body);
        emit('', products);
    } catch (err: any) {
        error(err?.message)
    }
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