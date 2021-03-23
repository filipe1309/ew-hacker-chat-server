import SocketServer from "./socket.js";
import Event from "events";

const eventEmitter = new Event();
const port = process.env.PORT || 9898;
const socketServer = new SocketServer({ port });
const server = await socketServer.initialize(eventEmitter);
console.log('socker server is running at', server.address().port);