var Bot = require('node-telegram-bot-api');
var request = require('request');
var config = require('config');
var helpers = require('./helpers');
var telegram = require('./telegram');
var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var dateFormat = require('dateformat');
const queryString = require('querystring');

//const CHANNEL_NAME = 'Telegram';
//const CHANNEL_NAME = 'Telegram-Genesys';
const CHANNEL_NAME = 'Telegram-Chatigo';
const MESSAGE_TYPE_IMAGE = 'image';
const MESSAGE_TYPE_TEXT = 'text';
const MESSAGE_TYPE_DOCUMENT = 'document';
  
//Constante para WATSON
/**const SERVER_WATSON_URL = (config.get('watsonURL')) ?
    config.get('watsonURL') :
    'http://localhost:3000/api/message';**/

//Constantes para Backend
const SERVER_BACKEND_URL = (config.get('backendURL')) ?
    config.get('backendURL') :
    'http://localhost:8001';

const AUTHENTICATION_BACKEND = (config.get('authenticationBackend')) ?
    config.get('authenticationBackend') :
    'andre:Aa123456';

const MAX_REQUEST_RETRY = 10;

//Variables para watson
var watsonValues = {
    conversation_id: '',
    client_id: ''
};

var watsonMessage = '';

var userArray = {
    user: [{
        conversation_id: '',
        client_id: ''
    }]
};

var menuOptions = {};

/*OBTAINS THE CHANNEL VALUES FROM THE BACKEND */
var channel = {
    "id": -1,
    "name": CHANNEL_NAME,
    "status": true
};

const Tgfancy = require("tgfancy");
const bot = new Tgfancy(config.get('token'), {
    // all options to 'tgfancy' MUST be placed under the 
    // 'tgfancy' key, as shown below 
    polling: true,
    tgfancy: {
        orderedSending: true,
    },
});

var senderID;
var result;
var messageUrl;
var bodyResponse;
/*
 ***********************************************************************
 *Metodos relacionados a manejar los usuarios en backend\
 *1.- addUserProfile
 *2.- getUserProfile
 ***********************************************************************
 */

/*
 *Permite crear un usuario en el backend, se envia en el body la informacion del
 *usuario, la misma es obtenida en este momento de los valores recibidos a travÃ©s
 *de Telegram
 *
 *En caso de ser creado satisfactoriamente el usuario se procesa la conversacion
 */
function addUserProfile(msg) {
    senderID = msg.chat.id;
    console.log("addUserProfile %s", senderID);
    var clientBackend = {}
    var userInfo = {
        "firstname": msg.chat.first_name,
        "lastname": msg.chat.last_name,
        "email": "",
        "phonenumber": "",
        "channel_name": CHANNEL_NAME,
        "channel_code": msg.chat.id
    }

    request.post({
        uri: SERVER_BACKEND_URL + '/clients/',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + new Buffer(AUTHENTICATION_BACKEND).toString('base64')
        },
        body: queryString.stringify(userInfo)
    }, function(error, response, body) {
        if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
            console.log("addUserProfile response: " + senderID + " register successfully.");
            clientBackend = JSON.parse(body);
            processConversation(msg, clientBackend);
        } else if (!error && (response.statusCode == 400)) {
            console.log("addUserProfile response: statusCode 400, " + senderID +
                " could not be register.");
        } else {
            console.log("addUserProfile response: statusCode != 200,201 and 400." + " error response: %s", JSON.stringify(response));
        }
    });
}

/*
 *Metodo permite obtener el perfil de usuario desde el backend
 * 1. VERIFICAR SI EL USUARIO EXISTE O NO EN EL BACKEND
 * 2. SI EXISTE, VEERIFICAR SI TIENE UNA CONVERSATION ACTIVA
 *   2.1 EN CASO DE TENER, SE PROSIGUE CON LA CONVERSACION
 *   2.2 EN CASO DE NO TENER, SE CREA UNA CONVERSACION EN WATSON
 * 3. SI NO EXISTE, SE CREA EN EL BACKEND Y SE CREA NUEVA CONVERSACION EN WATSON
 */
function getUserProfile(msg) {
    senderID = msg.chat.id;
    console.log("getUserProfile -> Client: " + senderID + " has sent a message");
    var user = null;
    var data = {
        "channel_name": CHANNEL_NAME,
        "channel_code": senderID
    }

    var clientBackend = {}
    var requestQuantity = 0;
    requestToManageUser(data, msg, clientBackend, requestQuantity);
}

function requestToManageUser(data, msg, clientBackend, requestQuantity) {
    requestQuantity++;
    if (requestQuantity <= MAX_REQUEST_RETRY) {
        request.post({
            uri: SERVER_BACKEND_URL + '/clientchannels/',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + new Buffer(AUTHENTICATION_BACKEND).toString('base64')
            },
            body: queryString.stringify(data)
        }, function(error, response, body) {
            if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
                var aux = JSON.parse(body);
                clientBackend = aux.client;
                console.log("getUserProfile -> Client: " + senderID + " was registered.");
                console.log("getUserProfile -> Client: " + senderID + " body: " + JSON.stringify(clientBackend));
                processConversation(msg, clientBackend);
            } else if (!error && (response.statusCode == 204)) {
                console.log("getUserProfile RESPONSE " + senderID + " was not registered.");
                addUserProfile(msg);
            } else {
                console.log("getUserProfile Error in response" + JSON.stringify(error));
                requestToManageUser(data, msg, clientBackend, requestQuantity);
            }
        });
    } else {
        telegram.sendTextMessage(bot, senderID, "Oops!!! Tenemos un problema, por favor intenta mas tarde!!!");
    }
}

/*
 *****************************************************************************
 * processConversation method receive message from Telegram channel a info about message and body Response from contact-bot
 * and return json value with response to the client
 * messageData:  Info about client, it is used to get SenderId
 * body: Response from backed, it could has menu options and other values.
 *****************************************************************************
 */
function processConversation(msg, clientBackend) {
    console.log("processConversation ClientBackend %s", JSON.stringify(clientBackend));


    if (!msg.hasOwnProperty('text')) {
        if (msg.hasOwnProperty('photo')) {
            var photoInfo = msg.photo[msg.photo.length - 1];
            console.log("processConversation photo id:" + photoInfo.file_id);
            var url = 'https://api.telegram.org/bot' + config.get('token') + '/getFile?file_id=' + photoInfo.file_id
            request.get({
                uri: url,
            }, function(error, response, body) {
                if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
                    result = JSON.parse(body).result;
                    messageUrl = 'https://api.telegram.org/file/bot' + config.get('token') + '/' + result.file_path;
                    console.log("processConversation telegram file URL: " + messageUrl);
                    var userInfo = {
                        "message": messageUrl,
                        "channel": CHANNEL_NAME,
                        "client": msg.chat.id,
                        "type": MESSAGE_TYPE_IMAGE
                    }
                    requestProcessConversation(userInfo);
                }
            });
        } else if (msg.hasOwnProperty('document')) {
            var documentInfo = msg.document;
            var type = "";
            //We check if user send and image or a document
            if ((documentInfo.mime_type == 'image/jpeg') || (documentInfo.mime_type == 'image/png')) {
                type = MESSAGE_TYPE_IMAGE;
            } else {
                type = MESSAGE_TYPE_DOCUMENT;
            }
            console.log("processConversation document id:" + documentInfo.file_id);
            var url = 'https://api.telegram.org/bot' + config.get('token') + '/getFile?file_id=' + documentInfo.file_id
            request.get({
                uri: url,
            }, function(error, response, body) {
                if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
                    result = JSON.parse(body).result;
                    messageUrl = 'https://api.telegram.org/file/bot' + config.get('token') + '/' + result.file_path;
                    console.log("processConversation telegram file URL: " + messageUrl);
                    var userInfo = {
                        "message": messageUrl,
                        "channel": CHANNEL_NAME,
                        "client": msg.chat.id,
                        "type": type
                    }
                    console.log("processConversation telegram userInfo: " + userInfo.type);
                    requestProcessConversation(userInfo);
                }
            });
        } else if (msg.hasOwnProperty('location')) {
            console.log("processConversation ClientBackend msg.location %s", msg.location.latitude);
            var userInfo = {
                "message": msg.location.latitude.toString(),
                "channel": CHANNEL_NAME,
                "client": msg.chat.id,
                "type": "location"
            }
        console.log("processConversation userInfo %s", JSON.stringify(userInfo));
        requestProcessConversation(userInfo);



        }
    } else {
        console.log("processConversation ClientBackend msg.text %s", msg.text);
        var userInfo = {
            "message": msg.text,
            "channel": CHANNEL_NAME,
            "client": msg.chat.id,
            "type": MESSAGE_TYPE_TEXT
        }
        console.log("processConversation userInfo %s", JSON.stringify(userInfo));
        requestProcessConversation(userInfo);

    }
}

function requestProcessConversation(userInfo) {
    request.post({
        uri: SERVER_BACKEND_URL + '/conversations/process/',
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'Authorization': 'Basic ' + new Buffer(AUTHENTICATION_BACKEND).toString('base64')
        },
        body: JSON.stringify(userInfo)
    }, function(error, response, body) {
        if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
            bodyResponse = JSON.parse(body);
            console.log("processConversation post response: -> conversation_id " + bodyResponse.conversation_id);
            console.log("processConversation post response: -> ouput.text " + bodyResponse.output.text);
            console.log("processConversation post response: -> bodyResponse " + JSON.stringify(bodyResponse))
           
            if ((bodyResponse.output.text[0] != null) && (bodyResponse.output.text[0] != '[')) {
                var payload = classifyResponse(userInfo, bodyResponse);
                for (var position = 0; position < payload.watsonMessage.length; position++) {
                    sendGroupOfMessages(userInfo, payload, position);
                } 
            } else {
                console.log("El mensaje recibido es [, por eso no se debe enviar al chat");
            }
        } else if (!error && (response.statusCode == 400 || response.statusCode == 204)) {
            console.log("ERROR processConversation post response: There is not a Current Conversation");
        } else {
            console.log("ERROR NO HANDLER processConversation post response: Current Conversation could not be loaded %s", JSON.stringify(response));
        }
    });
}

/*
 *****************************************************************************
 * sendGroupOfMessages method receive message from Contact Bot to be sent like a response to
 * a specific user.
 * userInfo:  Info about client, it is used to get SenderId
 * payload: Response with format to be sent via Telegram
 * position: Number of message to be sent
 *****************************************************************************
 */
function sendGroupOfMessages(userInfo, payload, position) {

    if (position != (payload.watsonMessage.length-1)) {
        telegram.sendTextMessage(bot, userInfo.client, payload.watsonMessage[position]);
    } else {
        if (payload.hasMenu) {
            telegram.sendMenuMessage(bot, userInfo.client, payload, payload.watsonMessage[position], true, false);
            //telegram.sendTextMessage(bot, userInfo.client, payload.watsonMessage[i]);
        } else {
            telegram.sendTextMessage(bot, userInfo.client, payload.watsonMessage[position]);
        }
    }
}

/*
 *****************************************************************************
 * This method receive a info about message and body Response from contact-bot
 * and return json value with response to the client
 * messageData:  Info about client, it is used to get SenderId
 * body: Response from backed, it could has menu options and other values.
 *****************************************************************************
 */
function classifyResponse(messageData, body) {
    
    var senderID = messageData.client;
    console.log("classifyResponse -> Client: " + senderID);
    var response = body.output;
    var watsonMessage = response.text;
    console.log("classifyResponse -> Message: " + watsonMessage);
    console.log("classifyResponse -> Type: INIT" + JSON.stringify(response));
    var type = JSON.stringify(response.type);
    var jsonResponse = {};
    var hasMenu = false;
    var oneEntry = true;
    var menu = []; //[["a"],["b"]]
    var intent = {};
    if (type != null) {
        if (type.localeCompare("\"INIT\"") == 0) {
            console.log("classifyResponse -> Type: INIT");
            var options = response.options;
            for (var option in options) {
                menu.push([response.options[option].text]);
                hasMenu = true;
                console.log("classifyResponse -> INIT Menu Options: " + response.options[option].text);
            }
        } else if (type == "\"MENU\"") {
            console.log("classifyResponse -> Type: MENU");
            var options = response.options;
            for (var option in options) {
                console.log(response.options[option].text);
                menu.push([response.options[option].text]);
                hasMenu = true;
                console.log("classifyResponse -> MENU Menu Options: " + response.options[option].text);
            }
        } else if (type == "\"ERROR\"") {
            console.log("classifyResponse -> Type: ERROR");
            var options = response.options;
            for (var option in options) {
                console.log(response.options[option].text);
                menu.push([response.options[option].text]);
                hasMenu = true;
                console.log("classifyResponse -> ERROR Menu Options: " + response.options[option].text);
            }
        } else if (type == "\"INFO\"") {
            console.log("classifyResponse -> Type: INFO");
            //watsonMessage += "";
        }
    } else {
        // watsonMessage = " ";
    }
    jsonResponse = {
        "watsonMessage": watsonMessage,
        "hasMenu": hasMenu,
        "menu": menu,
        "oneEntry": oneEntry
    }

    return jsonResponse;
}

/*
 ***********************************************************************
 *Metodos relacionados a enviar tipos de respuestas para los usuarios
 *en Telegram, incluye metodo ON donde se reciben los texto que el usuario
 *envia.
 *1.- on
 *2.- sendTextMessage
 *3.- sendMenuMessage
 ***********************************************************************
 */
bot.on('message', function(msg) {
    if (msg['voice']) {
        //return onVoiceMessage(msg);
    } else {
        console.log("Telegram ON: Mensaje recibido: ", msg);
        getUserProfile(msg);
    }
});

request.get({
    uri: SERVER_BACKEND_URL + '/channels/find/' + CHANNEL_NAME,
    headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + new Buffer(AUTHENTICATION_BACKEND).toString('base64')
    }
}, function(error, response, body) {
    if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
        channel = JSON.parse(body);
        console.log("Channel has been loaded successfully.");
    } else if (!error && (response.statusCode == 400)) {
        console.log("Channel has not been register.");
    } else {
        console.log("Channel could not be loaded %s", JSON.stringify(response));
    }
});

/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */

var app = express();

// Bootstrap application settings
app.set('port', process.env.PORT || 4000);
app.use(express.static('public')); // load UI from public folder
app.use(bodyParser.json());

app.post('/channel/message', function(req, res) {
    //req = Object that contains HTTP request
    //req.body = HTTP Body of the request (JSON)

    console.log("Webhook /channel/message START");
    var data = req.body;
	
	console.log("Webhook Receive a Message", data.senderID, data.message);
	
	if (data.formated != null && data.formated != undefined && data.formated == true){
		var userInfo = {
            "message": "",
            "channel": CHANNEL_NAME,
            "client": data.senderID,
            "type": MESSAGE_TYPE_TEXT
        }
		
		if ((data.message.output.text[0] != null) && (data.message.output.text[0] != '[')) {
			var payload = classifyResponse(userInfo, data.message);
			for (var position = 0; position < payload.watsonMessage.length; position++) {
				sendGroupOfMessages(userInfo, payload, position);
			} 
		} else {
			console.log("El mensaje recibido es [, por eso no se debe enviar al chat");
		}
	}else{		
		telegram.sendTextMessage(bot, data.senderID, data.message);    
	}
	
    res.status(200).send('return message');
    console.log("Webhook /channel/message END");
});

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function() {
    console.log('Telegram app is running on port', app.get('port'));
});

module.exports = app;