import { constants } from "./constants.js";

export default class Controller {
    #users = new Map();
    #rooms = new Map();
    socketServer;

    constructor({ socketServer }) {
        this.socketServer = socketServer;
    }

    onNewConnection(socket) {
        const { id } = socket;
        console.log('connection stablished with', id);
        const userData = { id, socket };
        this.#updateGlobalUserData(id, userData);

        socket.on('data', this.#onSocketData(id));
        socket.on('error', this.#onSocketClosed(id));
        socket.on('end', this.#onSocketClosed(id));
    }

    async joinRoom(socketId, data) {
        const userData = data;
        console.log(`${userData.userName} joined! ${socketId}`);
        const user = this.#updateGlobalUserData(socketId, userData);
        
        const { roomId } = userData;
        const users = this.#joinUserOnRoom(roomId, user);
    
        const currentsUser = Array.from(users.values())
            .map(({ id, userName }) => ({ userName, id }));

        // Update new connect used with all others users on the room
        this.socketServer.sendMessage(user.socket, constants.events.UPDATE_USERS, currentsUser);
    
    }
    
    #joinUserOnRoom(roomId, user) {
        const usersOnRoom = this.#rooms.get(roomId) ?? new Map();
        usersOnRoom.set(user.id, user);
        this.#rooms.set(roomId, usersOnRoom);
    
        return usersOnRoom;
    }

    #onSocketData(id) {
        return data => {
            try {
                const { event, message } = JSON.parse(data);
                this[event](id, message);
            } catch (e) {
                console.error('wrong event format!', data.toString());
            }
        }
    }

    #onSocketClosed(id) {
        return data => {
            console.log('onSocketClosed', id);
        }
    }

    #updateGlobalUserData(socketId, userData) {
        const users = this.#users;
        const user = users.get(socketId) ?? {};

        const updateUserData = {
            ...user,
            ...userData
        };

        users.set(socketId, updateUserData);

        return users.get(socketId);
    }
}