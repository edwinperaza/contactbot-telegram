/**
 * Send a text message to telegram chat based on the bot and recipientId
 */
function sendTextMessage(bot, recipientId, messageText) {
  var options = {
    parse_mode: 'HTML',
				disable_notification: true,
				reply_to_message_id: 'OK'
			}
  bot.sendMessage( recipientId, messageText, options).then(function () {
			    // reply sent!
			});
}

/**
 * Send a text message with menu to telegram chat based on the bot and
 * recipientId. We need to set if the keyboard will be resized and
 * notification show
 */
function sendMenuMessage(bot, recipientId, payload, messageText, isKeyboardResized, isNotificationDisabled) {
  var keyboard = {
    "keyboard": payload.menu,
    "resize_keyboard": isKeyboardResized,
    "one_time_keyboard": payload.oneEntry
  };
  var options = {
    disable_notification: isNotificationDisabled,
    reply_to_message_id: 'OK',
    reply_markup: keyboard
  };
  bot.sendMessage( recipientId, messageText, options).then(function () {
       // reply sent!
   });
}

/**
 * Send a text message with manual menu to telegram chat based on the bot and
 * recipientId. We need to set if the keyboard will be resized, show just one
 * time and notification behaivor
 */
function sendMenuManualMessage(bot, recipientId, message, menu, isKeyboardResized, isNotificationDisabled, isOneTimeKeyboard) {
  var keyboard = {
    "keyboard": menu,
    "resize_keyboard": isKeyboardResized,
    "one_time_keyboard": isOneTimeKeyboard}
  bot.sendMessage( recipientId, message, {
    disable_notification: isNotificationDisabled,
    reply_to_message_id: 'OK',
    reply_markup: keyboard
   }).then(function () {
       // reply sent!
   });
}

/**
 * Send a documment message to telegram chat based on the bot and URL
 * We need to set if the notification will be show
 */
function sendDocumentMessage(bot, recipientId, message,  url, isNotificationDisabled) {
  var options = {
    caption: message,
		disable_notification: isNotificationDisabled,
		reply_to_message_id: 'OK'
	}
  bot.sendDocument(recipientId, url, options).then(function () {
			    // reply sent!
	});
}

/**
 * Send a Image message to telegram chat based on the bot and URL
 * We need to set if the notification will be show
 */
function sendImageMessage(bot, recipientId, message,  url, isNotificationDisabled) {
  var options = {
    caption: message,
				disable_notification: isNotificationDisabled,
				reply_to_message_id: 'OK'
			}
  bot.sendPhoto( recipientId, url, options).then(function () {
			    // reply sent!
			});
}
/**
 * Send a Video message to telegram chat based on the bot and URL
 * We need to set if the notification will be show
 * Optional: duration, width, height, reply_markup
 */
function sendVideoMessage(bot, recipientId, message,  url, isNotificationDisabled) {
  var options = {
    caption: message,
		disable_notification: isNotificationDisabled,
		reply_to_message_id: 'OK'
	}
  bot.sendVideo( recipientId, url, options).then(function () {
			    // reply sent!
			});
}

/**
 * Send a Location message to telegram chat based on the bot, latitude and
 * Longitude, We need to set if the notification will be show
 * Optional: reply_markup
 */
function sendLocationMessage(bot, recipientId, latitude,  longitude, isNotificationDisabled) {
  var options = {
		disable_notification: isNotificationDisabled,
		reply_to_message_id: 'OK'
	}
  bot.sendLocation( recipientId, latitude, longitude, options).then(function () {
			    // reply sent!
			});
}

module.exports.sendTextMessage = sendTextMessage;
module.exports.sendMenuMessage = sendMenuMessage;
module.exports.sendMenuManualMessage = sendMenuManualMessage;
module.exports.sendDocumentMessage = sendDocumentMessage;
module.exports.sendImageMessage = sendImageMessage;
module.exports.sendVideoMessage = sendVideoMessage;
module.exports.sendLocationMessage = sendLocationMessage;

/**
 * Send a venue message to telegram chat based on the bot, latitude and
 * Longitude, We need to set if the notification will be show
 * Optional: reply_markup, foursquare_id
 * FUNCTION NOT IMPLEMENTED YET
 *
 * function sendVenueMessage(bot, recipientId, latitude,  longitude, title, address, isNotificationDisabled) {
 *    var options = {
 *    disable_notification: isNotificationDisabled,
 *    reply_to_message_id: 'OK'
 *    }
 *    bot.sendVenue(recipientId, latitude, longitude, title, address, options).then(function () {
 *      // reply sent!
 *      });
 *    }
 */

/**
 * Send a venue message to telegram chat based on the bot, latitude and
 * Longitude, We need to set if the notification will be show
 * Optional: reply_markup
 * FUNCTION NOT IMPLEMENTED YET
 *  function sendContactMessage(bot, recipientId, phonenumber, first_name, last_name, isNotificationDisabled) {
 *    var options = {
 *      last_name: last_name,
 *      disable_notification: isNotificationDisabled,
 *      reply_to_message_id: 'OK'
 *    }
 *    bot.sendContact(recipientId, phonenumber, first_name, options).then(function () {
 *      // reply sent!
 *    });
 *  }
 *  module.exports.sendVenueMessage = sendVenueMessage;
 *  module.exports.sendContactMessage = sendContactMessage;
 */