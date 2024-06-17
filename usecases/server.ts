import { SocketServer } from '../';


type Session = { id: string };
const socket = new SocketServer<Session>('api-key', 'jwt-secret');

const PORT = process.env.PORT || 3030
// Start the server on port
socket.listen(PORT, () => {
    console.log(`Server Run http://localhost:${PORT}`);
});

// Channels
socket.channel<any>('messages', async (req, res) => {
    console.log({ req });
    const menu = await getMenuFromDatabase();
    setInterval(() => res({ menu, session: req.body }), 2000)
});

socket.channel<{ name: string }>('post/menu', async (req, res) => {
    const item = await addMenuItemToDatabase(req.body);
    res({ item, data: req.body });
}, true);

async function getMenuFromDatabase() {
    return [{ id: 1, name: 'Pizza' }, { id: 2, name: 'Pasta' }];
}

async function addMenuItemToDatabase(data: { name: string }) {
    return { id: 3, name: data.name };
}