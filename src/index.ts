import express from 'express'
import socketio from 'socket.io'
import http from 'http';
import path from 'path'

const app = express()
const server = http.createServer(app);
const port = process.env.PORT || 80

const io = socketio(server);

import { roomCodes } from './data';
import Room from './Room';
import { v4 as uuid } from 'uuid';

import Player from './game/IPlayer';

app.use('/', express.static(path.join(__dirname, "..", "public")))

app.set('view engine', 'pug')

// TODO: use a router
app.get('/room/:room', (req, res) => {
  if (!req.params.room.match(/^([A-Z]){4}$/g)) // Check if code isn't exactly 4 capital letters
    return res.status(400).json({
      status: 401,
      message: "Invalid room code."
    })

  if (!roomCodes[req.params.room])             // Check room exists
    return res.status(404).json({
      status: 404,
      message: "Room not found."
    })

  res.status(200).json({
    status: 200,
    message: "Room found."
  })
})

app.post('/room/create', (req, res) => {
  const room = new Room();
  if (roomCodes[room.code]) return;
  roomCodes[room.code] = room;
  res.status(200).json({
    status: 200,
    code: room.code,
  });
})

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/game', (req, res) => {
  res.render('game')
})

// TODO: move this shit elsewhere
// FIXME: stop allowing invalid room code from connecting to that namespace
const workspaces = io.of(/^\/([A-Z]){4}$/);
// TODO: look into namespace middlewares
workspaces.on('connection', (socket: socketio.Socket) => {
  const workspace = socket.nsp;
  const room: Room = roomCodes[workspace.name.slice(1)]
  if (!room) {
    socket.emit('kicked', "Room not found");
    socket.disconnect();
    return;
  };
  console.log(`user connected to ${room.code}`);

  socket.on('self register', (name) => {
    if (!name || !name.match(/^[a-zA-Z0-9! ]*$/) || name.length < 1 || name.length > 10) {
      socket.emit("kicked", "Bad Username.")
      console.log(name);
      socket.disconnect();
      return;
    }
    const playerList = Object.values(room.players);
    // Create this new player
    const player: Player = {
      id: uuid(),
      pos: { x: (Math.random() * 10) - 5, y: (Math.random() * 10 - 5) },
      velocity: { x: 0, y: 0 },
      name,
      dead: false,
      host: playerList.length === 0,
      color: Math.floor(Math.random() * 11),
      lastKill: -1,
      lastUpdate: -1,
    };
    socket.emit('you', player); // send new player themselves (meta)
    socket.broadcast.emit('new player', player); // send new player to all existing players

    for (let pl of playerList) { // send all existing players to new player
      socket.emit('new player', pl);
    }

    socket.on('kill', (id: string) => {
      room.players[id].dead = true;
      workspaces.emit('kill', id);
    })

    socket.on('movement update', (id: string, pos: { x: number, y: number }, vel: { x: number, y: number }) => {
      if (!room.players[id] || room.players[id].dead) return;
      room.players[id].pos = pos;
      room.players[id].velocity = vel;
      // if (player.lastUpdate === -1)
      socket.broadcast.volatile.emit('movement update', id, pos, vel);
    })

    socket.on('disconnect', () => {
      socket.broadcast.emit('player leave', player.id)
      delete room.players[player.id]
    })

    room.players[player.id] = player;
  });
});

// io.on('connection', (socket) => {
//   console.log('general io connection');


//   socket.on('disconnect', () => {
//     console.log('general io disconnected');
//   });
// });

server.listen(port, () => {
  console.log(`Example app listening at http://127.0.0.1:${port}`)
})