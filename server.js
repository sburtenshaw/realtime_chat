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
var admins = [
    "sburtenshaw",
    "ells"
];
var commands = {
    help: function(socketId) {
        emitUserMessage({
            userName: null,
            message: "Help: " + buildHelpString(),
            type: "serverMessage"
        }, socketId);
    },
    restart: function() {
        restartServer();
    },
    kick: function(userName, socketId) {
        emitUserMessage({
            userName: null,
            message: "Kicking user: " + userName,
            type: "serverMessage"
        }, socketId);
        removeUserByUserName(userName);
    },
    kickAll: function(socketId) {
        emitUserMessage({
            userName: null,
            message: "Kicking all users",
            type: "serverMessage"
        }, socketId);
        for (var i = (users.length - 1); i >= 0; i--) {
            if (users[i].socket.id !== socketId) users[i].socket.disconnect();
        }
    },
    clear: function() {
        clearMessages();
        addMessage({
            userName: null,
            message: "Chat cleared",
            type: "serverMessage"
        });
    }
};

// Serve public folder
app.use(express.static('public'));

// IO entry point
io.on('connection', function(socket) {
    console.log("Connection " + socket.id);

    // Push user to users array
    users.push(createNewUser());

    // On disconnect
    socket.on('disconnect', function() {
        console.log("Disconnection " + socket.id);
        for (var i = 0; i < users.length; i++) {
            if (users[i].socket.id === socket.id) {
                doRemoveUser(i);
                break;
            }
        }
    });

    // On back button clicked
    socket.on('back', function() {
        socket.disconnect();
    });

    // Runs straight after IO connection (after user types username, connect user and set username)
    socket.on('userName', function(userName) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].socket.id === socket.id) {
                if (admins.indexOf(userName) !== -1) {
                    userName += "*";
                    users[i].admin = true;
                }
                users[i].userName = userName;
                addMessage({
                    userName: userName,
                    message: " joined",
                    type: "connected"
                });

                // Generate user name list with new user and send to clients
                emitUserNameList();
                break;
            }
        }
    });

    // Listen for new messages
    socket.on('newMessage', function(message) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].socket.id === socket.id) {
                if (users[i].admin && message.substring(0, 1) === "/") {
                    interpretCommand(message, socket.id);
                } else {
                    addMessage({
                        userName: users[i].userName,
                        message: message,
                        type: "message"
                    });
                }
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
            messages: [],
            admin: false
        }
    }

    function setUserTyping(bool) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].socket.id === socket.id) {
                users[i].typing = bool;
                emitUsersTyping();
                break;
            }
        }
    }
});

// Start server and listen on port
startServer();

// Helpers that don't require current user socket
function addMessage(details) {
    for (var i = 0; i < users.length; i++) {
        users[i].messages.push(details);
    }
    emitMessages();
}

function clearMessages() {
    for (var i = 0; i < users.length; i++) {
        users[i].messages = [];
    }
    emitMessages();
}

function emitMessages() {
    for (var i = 0; i < users.length; i++) {
        io.to(users[i].socket.id).emit('messageList', users[i].messages);
    }
}

function emitUserMessage(details, socketId) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].socket.id === socketId) {
            users[i].messages.push(details);
            io.to(socketId).emit('messageList', users[i].messages);
        }
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

function emitUserNameList() {
    var userNameList = [];
    for (var i = 0; i < users.length; i++) {
        userNameList.push(users[i].userName);
    }
    io.emit('userNameList', userNameList);
}

function restartServer() {
    for (var i = (users.length - 1); i >= 0; i--) {
        users[i].socket.disconnect();
        users.splice(i, 1);
    }
    setTimeout(function() {
        http.close();
    }, 50);
    setTimeout(function() {
        startServer();
    }, 100);
}

function startServer() {
    // Listen on set port
    http.listen(port, function() {
        console.log('Server started on port ' + port);
    });
}

function interpretCommand(message, socketId) {
    message = message.substring(1, message.length).split(" ");
    if (message[0] && commands[message[0]]) {
        var command = message[0];
        if (message[1]) {
            var userName = message[1];
            if (testUser(userName)) {
                commands[command](userName, socketId);
            } else {
                emitUserMessage({
                    userName: null,
                    message: "User not found: " + userName,
                    type: "serverMessage"
                }, socketId);
            }
        } else {
            commands[command](socketId);
        }
    } else if (message[0]) {
        emitUserMessage({
            userName: null,
            message: "Invalid command: " + message[0],
            type: "serverMessage"
        }, socketId);
    } else {
        emitUserMessage({
            userName: null,
            message: "Help: " + buildHelpString(),
            type: "serverMessage"
        }, socketId);
    }
}

function buildHelpString() {
    var helpString = "<br/>";
    for (var key in commands) {
        helpString += "/" + key;
        if (commands[key].length) {
            var arguments = commands[key].toString().match(/\(.*?\)/)[0].replace(/[()]/gi,'').replace(/\s/gi,'').split(',');
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] !== "socketId") helpString += " " + arguments[i];
            }
        }
        helpString += "<br/>";
    }
    return helpString;
}

function testUser(userName) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].userName === userName) return true;
    }
    return false;
}

function removeUserByUserName(userName) {
    for (var i = 0; i < users.length; i++) {
        if (users[i].userName === userName) {
            users[i].socket.disconnect();
            break;
        }
    }
}

function doRemoveUser(i) {
    addMessage({
        userName: users[i].userName,
        message: " left",
        type: "disconnected"
    });
    users.splice(i, 1);
    emitUserNameList();
}