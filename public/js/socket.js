/**
 * Created by seanburtenshaw on 19/04/2017.
 */

// Socket connection
function initSocket() {
    socket = io({
        reconnection: false
    });
    socket.on('connect', function() {
        startApp();
    });
    socket.on('disconnect', function() {
        disconnectUser();
    });
}

// Initiate main app
function startApp() {
    setUserName();
    initListeners();
    setUserConnected(true);
}

function initListeners() {
    listenForMessages();
    listenForUsersTyping();
    listenForUserNameList();
}

// Socket listeners
function listenForMessages() {
    socket.on('messageList', function(messages) {
        messageListEl.html("");
        for (var i = 0; i < messages.length; i++) {
            switch (messages[i].type) {
                case 'connected':
                case 'disconnected':
                    appendMessage(messages[i].userName + ' ' + messages[i].message);
                    break;
                case 'message':
                    appendMessage(messages[i].userName + ': ' + messages[i].message);
                    break;
                case 'serverMessage':
                    appendMessage("<i> " + messages[i].message + " </i>");
            }
        }
    });
}

function listenForUsersTyping() {
    socket.on('usersTyping', function(usersTyping) {
        $('#users-typing').html(generateUsersTypingString(usersTyping));
    });
}

function listenForUserNameList() {
    socket.on('userNameList', function(userNameList) {
        userListMenuEl.find('ul').html("");
        for (var i = 0; i < userNameList.length; i++) {
            userListMenuEl.find('ul').append('<li>' + userNameList[i] + '</li>');
        }
    });
}

// Socket emit events
function setUserName() {
    socket.emit('userName', userName);
}

function sendMessage() {
    socket.emit('newMessage', message);
}

function userTyping() {
    socket.emit('userTyping');
}

function userStopTyping() {
    socket.emit('userStopTyping');
}

function userBack() {
    socket.emit('back');
}