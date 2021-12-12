var app = require('express')();

var server = require('http').createServer(app);
var io = require('socket.io')(server);

var usersTable = {};
var cursorTable = {};
var lastCanvasData = null;

io.on('connection', (socket)=> {
    console.log('User Online');

    socket.on('canvas-data', (data)=> {
        socket.broadcast.emit('canvas-data', data);
        lastCanvasData = data;
    })
    socket.on('clear-canvas', function() {
        socket.broadcast.emit('clear-canvas');
        lastCanvasData = null;
    })
    socket.on('username-submit', (data)=> {
        if(lastCanvasData) socket.emit('canvas-data', lastCanvasData);
        usersTable[socket.id] = data;
        console.log(usersTable);
        io.emit('update-users-table', usersTable);
    })
    socket.on('cursor-data', (data)=> {
        cursorTable[socket.id] = data;
        io.emit('update-cursor-table', cursorTable);
    })
    socket.on('kick-request', (data)=> {
        firstSocketID = Object.keys(usersTable)[0];
        if(socket.id == firstSocketID) { // Compare requester id with the first user in the table
            targetSocket = io.sockets.sockets.get(data);
            targetSocket.emit('kicked', usersTable[socket.id]);
            targetSocket.disconnect();
        }
    })
    socket.on('disconnect', function() {
        console.log(usersTable[socket.id] + ' disconnected');
        delete usersTable[socket.id];
        delete cursorTable[socket.id];
        io.emit('update-users-table', usersTable);
        io.emit('update-cursor-table', cursorTable);
    })
})


var server_port = process.env.YOUR_PORT || process.env.PORT || 5000;
server.listen(server_port, () => {
    console.log("Started on : "+ server_port);
})