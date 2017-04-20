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
    userName = stripHTML(userNameEl.val());
    if (userName !== "") {
        initSocket();
    }
}

function checkMessage() {
    message = stripHTML(messageEl.val());
    if (message !== "") {
        sendMessage();
        userStopTyping();
        messageEl.val("");
        message = "";
    }
}