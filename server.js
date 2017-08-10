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
        if(client && client.serverCore && client.serverCore) 
	{
        	client.serverCore.handle_server_input(client, input_commands, input_time, input_seq);
        }
},

//Define some required functions
createGame: function(client) 
{
        //Create a new game core instance, this actually runs the
        //game code like collisions and such.
        var serverCore = new ServerCore(this);

	//set the host here for now but eventually it needs to not care who the host is 
	serverCore.serverClientArray[0].setClient(client);
	client.serverClient = serverCore.serverClientArray[0];

	serverCore.clientHost = client;

	//Create a new game instance
        //Store it in the list of game
        this.serverCoreArray[ serverCore.id ] = serverCore;

        //Keep track
        this.game_count++;


	//lets connect serverClients to serverPlayers 
	serverCore.assignServerClientsToServerPlayers();

        //Start updating the game loop on the server
        serverCore.update( new Date().getTime() );

        //tell the player that they are now the host
        //s=server message, h=you are hosting

        client.send('s.h.'+ String(serverCore.local_time).replace('.','-'));
        console.log('server host at  ' + serverCore.local_time);
        client.serverCore = serverCore;
        client.hosting = true;
        
        this.log('player ' + client.userid + ' created a game with id ' + client.serverCore.id);

        //return it
        return serverCore;
}, 

startGame: function(serverCore) 
{
	//right so a game has 2 players and wants to begin
        //the host already knows they are hosting,
        //tell the other client they are joining a game
        //s=server message, j=you are joining, send them the host id
        
	//now we tell both that the game is ready to start
        //clients will reset their positions in this case.
	for (var c = 0; c < serverCore.serverClientArray.length; c++)
	{
		var client = serverCore.serverClientArray[c].client;
		if (client == serverCore.clientHost)
		{
        		client.send('s.r.'+ String(serverCore.local_time).replace('.','-'));
		}
		else
		{
        		client.send('s.j.' + serverCore.clientHost.userid);
        		client.serverCore = serverCore;
        		client.send('s.r.'+ String(serverCore.local_time).replace('.','-'));
		}
	}

       	//set this flag, so that the update loop can run it.
        serverCore.active = true;
},

findGame: function(client) 
{
	this.log('looking for a game. We have : ' + this.game_count);

        //so there are games active,
        //lets see if one needs another player
        if(this.game_count) 
	{
        	var joined_a_game = false;

                //Check the list of games for an open game
            	for(var gameid in this.serverCoreArray) 
		{
                	//only care about our own properties.
                	if (!this.serverCoreArray.hasOwnProperty(gameid)) 
			{
				continue;
			}
                    	//get the game we are checking against
                	var serverCore = this.serverCoreArray[gameid];

                    	//If the game is a player short
                	if (serverCore.player_count < this.MAX_NUMBER_OF_PLAYERS) 
			{
                        	//someone wants us to join!
                    		joined_a_game = true;
                        	//increase the player count and store
                        	//the player as the client of this game

				//add to serverClientArray	
				serverCore.serverClientArray[1].setClient(client);
				
                    		//assign client to a player	
				serverCore.serverPlayerArray[1].setClient(client);

                    		serverCore.player_count++;

                        	//start running the game on the server,
                        	//which will tell them to respawn/start
                    		this.startGame(serverCore);
                	} //if less than MAX PLAYERS
            	} //for all games

                //now if we didn't join a game,
                //we must create one
            	if(!joined_a_game) 
		{
                	this.createGame(client);
            	} 
	} 
	else 
	{ //if there are any games at all
       		//no games? create one!
            	this.createGame(client);
        }
} 
});

module.exports = Server;

