import SocketServer from "./socket.js";
import Event from "events";
import { constants } from './constants.js';

const eventEmitter = new Event();

// Test Web Socket Connection - Client Side
// async function testServer() {
//     const options = {
//         port: 9898,
//         host: 'localhost',
//         headers: {
//             Connection: 'Upgrade',
//             Upgrade: 'websocket'
//         }
//     };

//     const http = await import('http');
//     const req = http.request(options);
//     req.end();

//     req.on('upgrade', (res, socket) => {
//         socket.on('data', data => {
//             console.log('client received', data.toString());
//         });

//         setInterval(() =>{
//             socket.write('Hello!');
//         }, 500)
//     })
// }

const port = process.env.PORT || 9898;
const socketServer = new SocketServer({ port });
const server = await socketServer.initialize(eventEmitter);
console.log('socker server is running at', server.address().port);

// Test Web Socket Connection - Server Side
// eventEmitter.on(constants.events.NEW_USER_CONNECTED, (socket) => {
//     console.log('new connection!', socket.id);
//     socket.on('data', data => {
//         console.log('server received', data.toString());
//         socket.write('World!');
//     });
// })

// await testServer();