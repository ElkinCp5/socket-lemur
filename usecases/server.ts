import { SocketServer } from '../';


type Session = { id: string };
const socket = new SocketServer<Session>('api-key', 'jwt-secret');

const PORT = process.env.PORT || 3030
// Start the server on port
socket.listen(PORT, () => {
    console.log(`Server Run http://localhost:${PORT}`);
});

async function get() {
    return data;
}

async function add(product: { name: string }) {
    data.push({ id: data.length + 1, name: product.name })
    return data;
}

const data = [{ id: 1, name: 'Pizza' }, { id: 2, name: 'Pasta' }];

socket.channel<any>('get/products', async (_, res) => {
    const products = await get();
    res(products)
});

socket.channel<{ name: string }>('post/products', async (req, res) => {
    const products = await add(req.body);
    res(products);
}, true);
