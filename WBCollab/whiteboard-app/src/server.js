var app = require('express')();

var server = require('http').createServer(app);
var io = require('socket.io')(server);

io.on('connection', (socket)=> {
    console.log('User Online');

    socket.on('canvas-data', (data)=> {
        socket.broadcast.emit('canvas-data', data);
    })
})

var server_port = process.env.YOUR_PORT || process.env.PORT || 5000;
server.listen(server_port, () => {
    console.log("Started on : "+ server_port);
})