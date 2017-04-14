/**
 * Created by seanburtenshaw on 12/04/2017.
 */

// Dependencies
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Vars
var port = 3000;
var users = [];

// Serve public folder
app.use(express.static('public'));

// Listen on set port
http.listen(port, function() {
    console.log('Server started on port ' + port);
});

// IO entry point
io.on('connection', function(socket) {
    console.log("Connection " + socket.id);
    // Push user to users array
    users.push(createNewUser());
    // On disconnect
    socket.on('disconnect', function() {
        console.log("Disconnection " + socket.id);
        removeUser();
    });

    socket.on('back', function() {
        socket.disconnect();
    });

    // Runs straight after IO connection (after user types username, connect user and set username)
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

    // Listen for new messages
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

    // Listen for users typing
    socket.on('userTyping', function() {
        setUserTyping(true);
    });

    // Listen for users stopping typing
    socket.on('userStopTyping', function() {
        setUserTyping(false);
    });

    // Helpers that require current user socket
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

    function removeUser() {
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
    }
});

// Helpers that don't require current user socket
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