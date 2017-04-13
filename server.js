/**
 * Created by seanburtenshaw on 12/04/2017.
 */

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = 3000;

var users = [];
var messages = [];

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('New connection: ' + socket.id);
    socket.on('disconnect', function() {
        console.log('User disconnected: ' + socket.id);
        for (var i = 0; i < users.length; i++) {
            if (users[i].socketId === socket.id) {
                users.splice(i, 1);
                break;
            }
        }
    });

    users.push(createNewUser(socket.id));

    socket.on('userName', function(name) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].socketId === socket.id) {
                users[i].userName = name;
                var message = name + " joined";
                messages.push(message);
                broadcastEmitMessage(socket, message);
            }
        }
    });

    socket.on('newMessage', function(msg) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].socketId === socket.id) {
                users[i].messages.push(msg);
                var message = users[i].userName + ": " + msg;
                messages.push(message);
                broadcastEmitMessage(socket, message);
            }
        }
    });
});

function findUser(socketId) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].socketId === socketId) {
            return users[i];
        }
    }
}

function createNewUser(socketId) {
    return {
        socketId: socketId,
        userName: "",
        messages: []
    }
}

function broadcastEmitMessage(socket, msg) {
    socket.broadcast.emit('newMessage', msg);
}

function emitMessage(msg) {
    io.emit('newMessage', msg);
}

http.listen(port, function() {
    console.log('Server started on port ' + port);
});