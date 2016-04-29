var restify = require('restify');
var builder = require('botbuilder');

// Get secrets from server environment
var botConnectorOptions = { 
    appId: process.env.BOTFRAMEWORK_APPID, 
    appSecret: process.env.BOTFRAMEWORK_APPSECRET 
};
var Client = require('node-rest-client').Client;
 
var client = new Client();
 

var moment = require('moment');


// Create bot
var bot = new builder.BotConnectorBot({ appId: 'lastcall', appSecret: '5ffdc31a511747bca7cca9b8b4fdee3f' });
bot.add('/', function (session) {
    
    //respond with user's message
    if(session.message.text.indexOf('call') >= 0) {
        session.dialogData.currentTopic = 'call';
    } else if(session.message.text.indexOf('stock') >= 0){
        session.dialogData.currentTopic = 'stock';
    } else if(session.dialogData.currentTopic == '') {
        // just keep the currentTopic
        session.send('I do not understand, please try again.');
    }
    
    if(session.dialogData.currentTopic == 'call') {
            client.get("http://13.82.56.114/getLastCall", function (data, response) {
                // parsed response body as js object 
                // console.log(data);
                // session.send("You said " + session.message.text);
                if(session.message.text.indexOf('who') >= 0) {
                    session.send('The last call is from %s', data[0].callfrom);
                } else if(session.message.text.indexOf('when') >= 0) {
                    var date = moment(data[0].starttime);
                    session.send('The last call is at %s', date.format("dddd, MMMM Do YYYY, h:mm:ss a"));
                } else if(session.message.text.indexOf('duration') >= 0) {
                    session.send('The last call lasts %s seconds', data[0].callduration);
                } else if(session.message.text.indexOf('transcript') >= 0) {
                    session.send('The transcript of the last calls is  %s', data[0].speechtotextandentitydata.text);
                } else if(session.message.text.indexOf('what') >= 0) {
                    session.send('The keywords of the last call are: %s ', data[0].speechtotextandentitydata.entities.keyword);
                } else {
                    session.send('I do not understand, please try again.');
                }
            });
    } else if(session.dialogData.currentTopic == 'stock') {
            if(session.message.text == 'stock') {
                session.send('Which stock are you interested?');
            } else {
                require('node.io').scrape(function() {
                this.get('http://finance.yahoo.com/d/quotes.csv?s='+session.message.text+'&f=sl1', function(err, data) {
                    var lines = data.split('\n');
                    for (var line, i = 0, l = lines.length; i < l; i++) {
                        line = this.parseValues(lines[i]);
                        if(line.indexOf('N/A') >= 0 ) {
                            session.send('I do not understand, please try again.');
                        } else {
                            session.send(line[1]);
                        }
                        
                        break;
                        // console.log(line); //['XOM, '4:00pm - <b>83.25`</b>`', '2.11', '13.42']

                        //Do something with your data..
                    }
                });  
            });
            }

            // client.get("http://finance.yahoo.com/d/quotes.csv?s=msft&f=sl1", function (data, response) { //"+session.message.text.substr(":")+"
            //  session.send('The price is : %s ', data);
            //     // parsed response body as js object 
            //     // console.log(data);
            //     // session.send("You said " + session.message.text);
            //     if(session.message.text.indexOf('who') >= 0) {
            //         session.send('The last call is from %s', data[0].callfrom);
            //     } else if(session.message.text.indexOf('when') >= 0) {
            //         var date = moment(data[0].starttime);
            //         session.send('The last call is at %s', date.format("dddd, MMMM Do YYYY, h:mm:ss a"));
            //     } else if(session.message.text.indexOf('duration') >= 0) {
            //         session.send('The last call lasts %s seconds', data[0].callduration);
            //     } else if(session.message.text.indexOf('transcript') >= 0) {
            //         session.send('The transcript of the last calls is  %s', data[0].speechtotextandentitydata.text);
            //     } else if(session.message.text.indexOf('what') >= 0) {
            //         session.send('The keywords of the last call are: %s ', data[0].speechtotextandentitydata.entities.keyword);
            //     }
            // });
    } else {
        session.send('I do not understand, please try again.');
        
    }
    

});

// Setup Restify Server
var server = restify.createServer();

// Handle Bot Framework messages
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());

// Serve a static web page
server.get(/.*/, restify.serveStatic({
	'directory': '.',
	'default': 'index.html'
}));
  
server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});
