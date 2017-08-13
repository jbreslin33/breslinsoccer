/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    
    written by : http://underscorediscovery.ca
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    MIT Licensed.
*/
var ServerCore = require('./server.core');

var Server = new Class(
{
initialize: function()
{
	this.serverCoreArray = new Array();
	this.game_count = 0;
	this.MAX_NUMBER_OF_PLAYERS = 2;

        this.verbose     = true;

        //Since we are sharing code with the browser, we
        //are going to include some values to handle that.

        //A simple wrapper for logging so we can toggle it,
        //and augment it for clarity.
    	this.fake_latency = 0;
    	this.local_time = 0;
    	this._dt = new Date().getTime();
    	this._dte = new Date().getTime();
        //a local queue of messages we delay if faking latency
    	this.messages = [];

	this.createGame();
},

log: function() 
{
	if(this.verbose) 
	{
		console.log.apply(this,arguments);
	}
},

onMessage: function(client,message) 
{
	if(this.fake_latency && message.split('.')[0].substr(0,1) == 'i') 
	{
        	//store all input message
            	this.messages.push({client:client, message:message});
            	setTimeout(function()
		{
                	if(this.messages.length) 
			{
                    		this._onMessage( this.messages[0].client, this.messages[0].message );
                    		this.messages.splice(0,1);
                	}
            	}.bind(this), this.fake_latency);

        } 
	else 
	{
        	this._onMessage(client, message);
        }
},
    
_onMessage: function(client,message) 
{
	//Cut the message up into sub components
        var message_parts = message.split('.');

        //The first is always the type of message
        var message_type = message_parts[0];
        
	if (message_type == 'i') 
	{
        	//Input handler will forward this
            	this.onInput(client, message_parts);
        } 
	else if (message_type == 'p') 
	{
        	client.send('s.p.' + message_parts[1]);
        } 
	else if (message_type == 'c') 
	{    
		//Client changed their color!
               	client.send('s.c.' + message_parts[1]);
        } 
	else if (message_type == 'l') 
	{    //A client is asking for lag simulation
            	this.fake_latency = parseFloat(message_parts[1]);
        }
},

onInput: function(client, parts) 
{
	//The input commands come in like u-l,
        //so we split them up into separate commands,
        //and then update the players
        var input_commands = parts[1].split('-');
        var input_time = parts[2].replace('-','.');
        var input_seq = parts[3];

        //the client should be in a game, so
        //we can tell that game to handle the input
        if(client && client.serverCore) 
	{
        	client.serverCore.handle_server_input(client, input_commands, input_time, input_seq);
        }
},

//Define some required functions
createGame: function(client) 
{
        var serverCore = new ServerCore(this);
        this.game_count++;
        this.serverCoreArray[ serverCore.id ] = serverCore;
        serverCore.update( new Date().getTime() );
        return serverCore;
},

joinGame: function(serverCore,client)
{
	serverCore.serverClientArray[0].setClient(client);
        client.send('s.h.'+ String(serverCore.local_time).replace('.','-'));
        client.serverCore = serverCore;

/*
	for (var c = 0; c < serverCore.serverClientArray.length; c++)
	{
		if (serverCore.serverClientArray[c].client == 0)
		{

		} 
	}
*/
},

startGame: function(serverCore) 
{
	for (var c = 0; c < serverCore.serverClientArray.length; c++)
	{
		var client = serverCore.serverClientArray[c].client;
        	//client.send('s.j.' + serverCore.serverClientArray[c].userid);
        	client.serverCore = serverCore;
        	client.send('s.r.'+ String(serverCore.local_time).replace('.','-'));
	}

        serverCore.active = true;
},

findOpenServerClient: function(client)
{

},

findGame: function(client) 
{

	var serverCore = 0;
	var serverCore = 0;
        if(this.game_count) 
	{
        	var joined_a_game = false;

            	for(var gameid in this.serverCoreArray) 
		{
                	if (!this.serverCoreArray.hasOwnProperty(gameid)) 
			{
				continue;
			}
                	serverCore = this.serverCoreArray[gameid];

                	if (serverCore.player_count < this.MAX_NUMBER_OF_PLAYERS) 
			{
                    		joined_a_game = true;
			
				this.joinGame(serverCore,client);	
				serverCore.serverClientArray[1].setClient(client);
 
                    		serverCore.player_count++;

                    		//this.startGame(serverCore);
                	} 
            	}

            	if(!joined_a_game) 
		{
			this.joinGame(serverCore,client);
            	} 
	} 
	else
	{
		serverCore = this.createGame();
		this.joinGame(serverCore,client);
	}
	return serverCore;
},

checkForFirstClient: function(client)
{

} 
});

module.exports = Server;

