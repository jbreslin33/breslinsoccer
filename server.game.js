var ServerClient = require('./server.client');

var ServerGame = new Class(
{

initialize: function(client)
{
	this.serverClientArray = new Array();

	//host
       	var serverClient = new ServerClient();
	serverClient.setClient(client);
	this.serverClientArray.push(serverClient);
       	client.serverClient = serverClient;

	//other
       	//var serverClient = new ServerClient();
	//this.serverClientArray.push(serverClient);
       	//client.serverClient = serverClient;

       	this.UUID = require('node-uuid'),
	this.id = this.UUID()
	this.player_host = client;
	this.player_client = null;
	this.player_count = 1;
	
}
});
module.exports = ServerGame;

