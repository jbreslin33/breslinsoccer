/*
    The server client class

        A simple class to maintain client connections
*/
var ServerClient = new Class(
{
initialize: function(client) 
{
	this.client = client; 
	console.log('construct server.client:' + this.client.userid);
} 
});
    
module.exports = ServerClient;
