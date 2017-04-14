/**
 * Created by seanburtenshaw on 12/04/2017.
 */

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var port = 3000;

var users = [];

app.use(express.static('public'));

io.on('connection', function(socket) {
    console.log("Connection " + socket.id);
    socket.on('disconnect', function() {
        console.log("Disconnection " + socket.id);
        for (var i = 0; i < users.length; i++) {
            if (users[i].socket.id === socket.id) {
                addMessage({
                    userName: users[i].userName,
                    message: " left",
                    type: "disconnected"
                });
                users.splice(i, 1);
                break;
            }
        }
    });

    socket.on('userName', function(name) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].socket.id === socket.id) {
                users[i].userName = name;
                addMessage({
                    userName: name,
                    message: " joined",
                    type: "connected"
                });
                break;
            }
        }
    });

    socket.on('newMessage', function(msg) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].socket.id === socket.id) {
                addMessage({
                    userName: users[i].userName,
                    message: msg,
                    type: "message"
                });
                break;
            }
        }
    });

    socket.on('userTyping', function() {
        setUserTyping(true);
    });

    socket.on('userStopTyping', function() {
        setUserTyping(false);
    });

    function createNewUser() {
        return {
            socket: socket,
            userName: "",
            messages: []
        }
    }

    function setUserTyping(bool) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].socket.id === socket.id) {
                users[i].typing = bool;
                emitUsersTyping();
            }
        }
    }

    users.push(createNewUser());
});

function addMessage(details) {
    for (var i = 0; i < users.length; i++) {
        users[i].messages.push(details);
    }
    emitMessages();
}

function emitMessages() {
    for (var i = 0; i < users.length; i++) {
        io.to(users[i].socket.id).emit('messageList', users[i].messages);
    }
}

function emitUsersTyping() {
    for (var i = 0; i < users.length; i++) {
        var typing = [];
        for (var j = 0; j < users.length; j++) {
            if (users[j].typing && users[i].socket.id !== users[j].socket.id) typing.push(users[j].userName);
        }
        io.to(users[i].socket.id).emit('usersTyping', typing);
    }
}

http.listen(port, function() {
    console.log('Server started on port ' + port);
});