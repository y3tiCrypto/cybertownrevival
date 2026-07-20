import { Server as SocketIOServer } from 'socket.io';
import * as http from 'http';
import * as jwt from 'jsonwebtoken';
import badwords from 'badwords-list';

const USERS = new Map<string, any>();

export class SocketServer {
  private io: SocketIOServer;

  constructor(server: http.Server) {
    this.io = new SocketIOServer(server, {
      pingInterval: 10000,
      pingTimeout: 30000,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.initialize();
  }

  private validJwt(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return false;
    }
  }

  private initialize() {
    this.io.on('connection', (socket) => {
      console.log('a user connected');

      USERS.set(socket.id, {
        pos: [0, 0, 0],
        rot: [0, 1, 0, 0],
      });

      // inform the client about the server's version number
      socket.emit('VERSION', { version: '0.1.0' });

      socket.on('JOIN', (data) => {
        const tokenData: any = this.validJwt(data.token);
        if (tokenData) {
          const { room } = data;

          // Issue #92: Check if user is already connected on another socket
          for (const [existingSocketId, user] of USERS.entries()) {
            if (user.username === tokenData.username && existingSocketId !== socket.id) {
              console.log(`Disconnecting duplicate connection for user ${user.username}`);
              const existingSocket = this.io.sockets.sockets.get(existingSocketId);
              if (existingSocket) {
                existingSocket.emit("kick", "Logged in from another location.");
                existingSocket.disconnect(true);
              }
              USERS.delete(existingSocketId);
            }
          }

          const userSession = USERS.get(socket.id);
          if (userSession) {
            userSession.avatar = tokenData.avatar;
            userSession.room = room;
            userSession.username = tokenData.username;
          }

          // inform other members of the room that someone joined
          socket.to(room).emit('AV:new', {
            id: socket.id,
            avatar: tokenData.avatar,
            username: tokenData.username,
          });

          socket.join(room);

          // provide the new user with data about the current users in the room
          const clientsInRoom = this.io.sockets.adapter.rooms.get(room);
          if (clientsInRoom) {
            for (const clientId of clientsInRoom) {
              if (clientId === socket.id) continue;
              const clientSocket = this.io.sockets.sockets.get(clientId);
              if (clientSocket) {
                const user = USERS.get(clientId);
                if (user) {
                  const { avatar, pos, rot, username } = user;
                  socket.emit('AV:new', {
                    avatar,
                    id: clientId,
                    username,
                  });
                  socket.emit('AV', {
                    id: clientId,
                    pos,
                    rot,
                  });
                }
              }
            }
          }

          console.log(`User '${tokenData.username}' entered room ${room}`);
        } else {
          console.error('invalid token!');
        }
      });

      // handle avatar related calls.
      socket.on('AV', (msg) => {
        msg.id = socket.id;
        const user = USERS.get(socket.id);
        if (user?.room) {
          socket.to(user.room).emit('AV', msg);
        }
        if (user) {
          if (msg.pos) {
            user.pos = msg.pos;
          }
          if (msg.rot) {
            user.rot = msg.rot;
          }
        }
      });

      socket.on('AV:update', (msg) => {
        if (!msg || !msg.avatar) return;
        const user = USERS.get(socket.id);
        if (user) {
          user.avatar = msg.avatar;
          if (user.room) {
            socket.to(user.room).emit('AV:update', {
              id: socket.id,
              avatar: msg.avatar,
            });
          }
        }
      });

      // handle shared events
      socket.on('SE', (msg) => {
        const user = USERS.get(socket.id);
        if (user?.room) {
          this.io.to(user.room).emit('SE', msg);
        }
      });

      socket.on('update-object', (object) => {
        socket.broadcast.emit('update-object', {
          obj_id: object.obj_id,
          place_id: object.place_id,
          member_username: object.member_username,
          buyer_username: object.buyer_username,
        });
      });

      // handle shared objects
      socket.on('SO', (msg) => {
        const user = USERS.get(socket.id);
        if (user?.room) {
          const clientsInRoom = this.io.sockets.adapter.rooms.get(user.room);
          if (clientsInRoom) {
            for (const clientId of clientsInRoom) {
              if (clientId === socket.id) continue;
              const clientSocket = this.io.sockets.sockets.get(clientId);
              if (clientSocket) {
                clientSocket.emit('SO', msg);
              }
            }
          }
        }
      });

      // handle notifications
      socket.on('security-alert', (data) => {
        socket.broadcast.emit('new-security-alert', { data });
      });

      // handle community moderation
      socket.on('moderation', (data) => {
        socket.broadcast.emit('moderation_event', { data });
      });

      // handle chat messages
      socket.on('CHAT', (chatData) => {
        if (!chatData || !chatData.msg || typeof chatData.msg !== 'string') return;
        const user = USERS.get(socket.id);
        if (!user) return;
        const bannedwords = (badwords as any).regex;
        if (chatData.msg.match(bannedwords)) {
          console.log(`${user.username} used a banned word in ${user.room}`);
          return;
        } else {
          if (user.room) {
            this.io.to(user.room).emit('CHAT', {
              username: user.username,
              id: chatData.msg_id,
              msg: chatData.msg,
              role: chatData.role,
              new: true,
              exp: chatData.exp,
            });
          }
        }
      });

      socket.on('unsubscribe', () => {
        const user = USERS.get(socket.id);
        if (user?.room) {
          socket.leave(user.room);
          socket.to(user.room).emit('AV:del', {
            id: socket.id,
            username: user.username,
          });
          console.log(`User '${user.username}' left ${user.room}`);
        }
      });

      // handle disconnection from the socket.
      socket.on('disconnect', () => {
        const user = USERS.get(socket.id);
        if (user) {
          if (user.room) {
            this.io.to(user.room).emit('AV:del', {
              id: socket.id,
              username: user.username,
            });
          }
          USERS.delete(socket.id);
          console.log(`User '${user.username}' disconnected`);
        }
      });
    });
  }
}
