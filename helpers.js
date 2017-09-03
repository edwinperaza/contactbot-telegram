const MAX_HOURS_ACTIVE = 4;

//Si una conversacion tiene mas de cuatro horas de creada se asume
//que la conversacion no esta ACTIVA
function conversationIsEnabled(created, updated){
	var isActive = false;
	var strCreated = created.split("T");
	var strUpdated = updated.split("T");
	var dateCreated = strCreated[0];
	var timeCreated = strCreated[1].split(":");
	var dateUpdated = strUpdated[0];
	var timeUpdated = strUpdated[1].split(":");

	var today = new Date();
	var monthToday = today.getUTCMonth() + 1;
	var dateToday ="";
	if (today.getUTCDate() < 10){
		dateToday = today.getUTCFullYear()+"-"+monthToday+"-0"+today.getUTCDate()
	} else {
		dateToday = today.getUTCFullYear()+"-"+monthToday+"-"+today.getUTCDate()
	}
	var timeToday = [ today.getUTCHours(), today.getUTCMinutes() ];
  if (dateCreated == dateToday){
		if ( (timeToday[0] - timeCreated[0]) > MAX_HOURS_ACTIVE ){
			isActive = false;
		}else{
			isActive = true;
		}
	}
	return isActive;
}

function makeRandomID(){
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

//We show this functions to everyone
module.exports.conversationIsEnabled = conversationIsEnabled;
module.exports.makeRandomID = makeRandomID;