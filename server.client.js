var UUID     = require('node-uuid');

/*
    The server client class

        A simple class to maintain client connections
*/
var ServerClient = new Class(
{
initialize: function() 
{
	this.userid = UUID();
	//this.client = client; 
	//this.client.userid = this.userid; 
	console.log('construct server.client:' + this.userid);
},
setClient: function(client)
{
	this.client        = client;
	this.client.userid = this.userid; 
} 

});
    
module.exports = ServerClient;
