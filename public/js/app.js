/**
 * Created by seanburtenshaw on 14/04/2017.
 */

// Socket and model variables
var socket, userName, message;

// DOM elements variables
var userNameEl,
    messageEl,
    messageListEl,
    userListMenuEl;

// On document ready
$(function() {
    // Set DOM element variables
    userNameEl = $('#user-name');
    messageEl = $('#user-message');
    messageListEl = $('.user-connected ul');
    userListMenuEl = $('.menu.user-list');

    // Add event listeners
    userNameEl.on('keyup', function($event) {
        if ($event.keyCode === 13) {
            checkUserName();
        }
    });

    messageEl.on('keyup', function($event) {
        if ($event.keyCode === 13) {
            checkMessage();
        } else if ($event.keyCode === 8 && messageEl.val().length === 0) {
            userStopTyping();
        } else {
            userTyping();
        }
    });
});

// Event listeners
// Entry point
$('.user-disconnected button').on('click', function() {
    // If username is set, run initSocket and connect user to server
    checkUserName();
});

$('.user-connected .message-input button').on('click', function() {
    checkMessage();
});

$('.header .navigation-btn').on('click', function($event) {
    var btn = ($event.currentTarget.className.indexOf("back") !== -1 ? "back" : "users");
    switch (btn) {
        case "back":
            userBack();
            disconnectUser();
            break;
        case "users":
            toggleUserListMenu();
            break;
    }
});

// Input validation
function checkUserName() {
    userName = userNameEl.val();
    if (userName !== "") {
        initSocket();
    }
}

function checkMessage() {
    message = messageEl.val();
    if (message !== "") {
        sendMessage();
        userStopTyping();
        messageEl.val("");
        message = "";
    }
}

// Socket connection
function initSocket() {
    socket = io();
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
    listenForServerRestart();
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

function listenForServerRestart() {
    socket.on('serverRestart', function() {
        disconnectUser();
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

// Helpers
function setUserConnected(bool) {
    if (bool) {
        $('.user-disconnected').css('display', 'none');
        $('.user-connected').css('display', 'block');
        $('.header').removeClass('disconnected').addClass('connected');
    } else {
        $('.user-disconnected').css('display', 'block');
        $('.user-connected').css('display', 'none');
        $('.header').removeClass('connected').addClass('disconnected');
        $('#users-typing').html("");
        if (userListMenuEl.hasClass('show')) toggleUserListMenu();
        userListMenuEl.find('ul').html("");
        userNameEl.val("");
        userName = "";
    }
}

function generateUsersTypingString(usersTyping) {
    var usersTypingString = "";
    for (var i = 0; i < usersTyping.length; i++) {
        if (i === 0) {
            usersTypingString += usersTyping[i];
        } else if (usersTyping.length === 2) {
            usersTypingString += " and " + usersTyping[i];
        } else {
            if ((i + 1) === usersTyping.length) {
                usersTypingString += " and " + usersTyping[i];
            } else {
                usersTypingString += ", " + usersTyping[i];
            }
        }
        if ((i + 1) === usersTyping.length) {
            if (usersTyping.length === 1) {
                usersTypingString += " is typing...";
            } else {
                usersTypingString += " are typing...";
            }
        }
    }
    return usersTypingString;
}

function appendMessage(msg) {
    messageListEl.append('<li>' + msg + '</li>');
    messageListEl.scrollTop(messageListEl[0].scrollHeight - messageListEl.height());
}

function toggleUserListMenu() {
    if (userListMenuEl.hasClass('show')) {
        userListMenuEl.removeClass('show');
    } else {
        userListMenuEl.addClass('show');
    }
}

function disconnectUser() {
    socket = null;
    setUserConnected(false);
}