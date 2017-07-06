/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    
    written by : http://underscorediscovery.ca
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    MIT Licensed.
*/
var ServerGame = require('./server.game');
var ServerCore = require('./server.core');

var Server = new Class(
{
initialize: function()
{
	this.serverGamesArray = new Array();
	this.serverClientsArray = new Array();
	this.game_count = 0;

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

        var other_client =
            (client.serverGame.player_host.userid == client.userid) ?
             client.serverGame.player_client : client.serverGame.player_host;

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
            	if(other_client)
                other_client.send('s.c.' + message_parts[1]);
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
        if(client && client.serverGame && client.serverGame.serverCore) 
	{
        	client.serverGame.serverCore.handle_server_input(client, input_commands, input_time, input_seq);
        }
},

//Define some required functions
createGame: function(client) 
{
	//Create a new game instance
	var serverGame = new ServerGame(client);

        //Store it in the list of game
        this.serverGamesArray[ serverGame.id ] = serverGame;

        //Keep track
        this.game_count++;

        //Create a new game core instance, this actually runs the
        //game code like collisions and such.
        serverGame.serverCore = new ServerCore( serverGame );

	//lets connect serverClients to serverPlayers 
	serverGame.serverCore.assignServerClientsToServerPlayers();

        //Start updating the game loop on the server
        serverGame.serverCore.update( new Date().getTime() );

        //tell the player that they are now the host
        //s=server message, h=you are hosting

        client.send('s.h.'+ String(serverGame.serverCore.local_time).replace('.','-'));
        console.log('server host at  ' + serverGame.serverCore.local_time);
        client.serverGame = serverGame;
        client.hosting = true;
        
        this.log('player ' + client.userid + ' created a game with id ' + client.serverGame.id);

        //return it
        return serverGame;
}, 

//we are requesting to kill a game in progress.
endGame: function(gameid, userid) 
{
	var serverGame = this.serverGamesArray[gameid];

        if(serverGame) 
	{
        	//stop the game updates immediate
            	serverGame.serverCore.stop_update();
                
		//if the game has two players, the one is leaving
            	if(serverGame.player_count > 1) 
		{

                	//send the players the message the game is ending
                	if(userid == serverGame.player_host.userid) 
			{
                        	//the host left, oh snap. Lets try join another game
                    		if(serverGame.player_client) 
				{
                            		//tell them the game is over
                        		serverGame.player_client.send('s.e');
                            		//now look for/create a new game.
                        		this.findGame(serverGame.player_client);
                    		}
                    
                	} 
			else 
			{
                        	//the other player left, we were hosting
                    		if(serverGame.player_host) 
				{
                            		//tell the client the game is ended
                        		serverGame.player_host.send('s.e');
                            		//i am no longer hosting, this game is going down
                        		serverGame.player_host.hosting = false;
                            		//now look for/create a new game.
                        		this.findGame(serverGame.player_host);
                    		}
                	}
		}

            	delete this.serverGamesArray[gameid];
            	this.game_count--;

            	this.log('game removed. there are now ' + this.game_count + ' games' );
       	} 
	else 
	{
        	this.log('that game was not found!');
        }
},

startGame: function(serverGame) 
{
	//right so a game has 2 players and wants to begin
        //the host already knows they are hosting,
        //tell the other client they are joining a game
        //s=server message, j=you are joining, send them the host id
        serverGame.player_client.send('s.j.' + serverGame.player_host.userid);
        serverGame.player_client.serverGame = serverGame;

        //now we tell both that the game is ready to start
        //clients will reset their positions in this case.
        serverGame.player_client.send('s.r.'+ String(serverGame.serverCore.local_time).replace('.','-'));
        serverGame.player_host.send('s.r.'+ String(serverGame.serverCore.local_time).replace('.','-'));
 
       	//set this flag, so that the update loop can run it.
        serverGame.active = true;
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
            	for(var gameid in this.serverGamesArray) 
		{
                	//only care about our own properties.
                	if (!this.serverGamesArray.hasOwnProperty(gameid)) 
			{
				continue;
			}
                    	//get the game we are checking against
                	var serverGame = this.serverGamesArray[gameid];

                    	//If the game is a player short
                	if (serverGame.player_count < 2) 
			{
                        	//someone wants us to join!
                    		joined_a_game = true;
                        	//increase the player count and store
                        	//the player as the client of this game

				//set the still used player_client
                    		serverGame.player_client = client;
				
				//add to serverClientArray	
				serverGame.serverClientArray[1].setClient(client);
				
                    		//assign client to a player	
				serverGame.serverCore.serverPlayerArray[1].setClient(client);

                    		serverGame.player_count++;

                        	//start running the game on the server,
                        	//which will tell them to respawn/start
                    		this.startGame(serverGame);
                	} //if less than 2 players
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

