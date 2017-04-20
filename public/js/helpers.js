/**
 * Created by seanburtenshaw on 19/04/2017.
 */

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
        // usersTyping[i] = string (user name of a user)
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

function stripHTML(text) {
    return $($.parseHTML(text)).text();
}