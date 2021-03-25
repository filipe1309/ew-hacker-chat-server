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
    
        const currentUsers = Array.from(users.values())
            .map(({ id, userName }) => ({ userName, id }));

        // Update new connect used with all others users on the room
        this.socketServer.sendMessage(user.socket, constants.events.UPDATE_USERS, currentUsers);
    
        // warn all net a new user connections
        this.broadcast({
            socketId,
            roomId,
            message: { id: socketId, userName: userData.userName },
            event: constants.events.NEW_USER_CONNECTED
        });
    }
    
    broadcast({ socketId, roomId, event, message, includeCurrentSocket = false }) {
        const usersOnRoom = this.#rooms.get(roomId);

        for (const [key, user] of usersOnRoom) {
            if (!includeCurrentSocket && key === socketId) continue;

            this.socketServer.sendMessage(user.socket, event, message);
        }
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

    #logoutUser(id, roomId) {
        this.#users.delete(id);
        const usersOnRoom = this.#rooms.get(roomId);
        usersOnRoom.delete(id);

        this.#rooms.set(roomId, usersOnRoom);
    }

    #onSocketClosed(id) {
        return _ => {
            const { userName, roomId } = this.#users.get(id);
            console.log(userName, 'disconnected', id);

            this.#logoutUser(id, roomId);
            
            this.broadcast({
                roomId,
                message: { id, userName},
                socketId: id,
                event: constants.events.DISCONNECT_USER
            });
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