var ServerPlayer = require('./server.player');
var World = require('./world');
var Pitch = require('./pitch');

/* The ServerCore class */

var ServerCore = new Class(
{
initialize: function(serverGame)
{
	//Store the instance, if any
        this.serverGame = serverGame;

        //Store a flag if we are the server
        this.server = this.serverGame !== undefined;

	this.world = new World(720,480);

       	//We create a player set, passing them
        //the game that is running them, as well

	this.serverPlayerArray = new Array();
	
	//create serverPlayers
	for (var p = 0; p < 2; p++)
	{
		var serverPlayer = new ServerPlayer(this);
		this.serverPlayerArray.push(serverPlayer); 
	}

        this.serverPlayerArray[0].pos = {x:20,y:20};
        this.serverPlayerArray[1].pos = {x:500,y:200};

        //The speed at which the clients move.
        this.playerspeed = 120;

        //Set up some physics integration values
        this._pdt = 0.0001;                 //The physics update delta time
        this._pdte = new Date().getTime();  //The physics update last delta time

        //A local timer for precision on server and client
        this.local_time = 0.016;            //The local timer
        this._dt = new Date().getTime();    //The local timer delta
        this._dte = new Date().getTime();   //The local timer last frame time

        //Start a physics loop, this is separate to the rendering
        //as this happens at a fixed frequency
        this.create_physics_simulation();

        //Start a fast paced timer for measuring time easier
        this.create_timer();

        this.server_time = 0;
        this.laststate = {};

},

assignServerClientsToServerPlayers: function()
{
	for (var p = 0; p < this.serverGame.serverClientArray.length; p++)
	{
		if (this.serverPlayerArray[p].client == 0)
		{
			this.serverPlayerArray[p].setClient(this.serverGame.serverClientArray[p].client);
		}
	}
},

/*
    Helper functions for the game code

        Here we have some common maths and game related code to make working with 2d vectors easy,
        as well as some helpers for rounding numbers to fixed point.

*/

//copies a 2d vector like object from one to another
pos: function(a) 
{ 
	return {x:a.x,y:a.y}; 
},

//Add a 2d vector with another one and return the resulting vector
v_add: function(a,b) 
{ 
	return { x:(a.x+b.x).fixed(), y:(a.y+b.y).fixed() }; 
},

//Subtract a 2d vector with another one and return the resulting vector
//For the server, we need to cancel the setTimeout that the polyfill creates
stop_update: function() 
{  
	window.cancelAnimationFrame( this.updateid );  
},

//Main update loop
update: function(t) 
{
	//Work out the delta time
    	this.dt = this.lastframetime ? ( (t - this.lastframetime)/1000.0).fixed() : 0.016;

        //Store the last frame time
    	this.lastframetime = t;

        //Update the game specifics
        this.server_update();

        //schedule the next update
    	this.updateid = window.requestAnimationFrame( this.update.bind(this), this.viewport );

}, 

/*
    Shared between server and client.
    In this example, `item` is always of type ServerPlayer.
*/

check_collision: function( item ) 
{
	//Left wall.
    	if(item.pos.x <= item.pos_limits.x_min) 
	{
       		item.pos.x = item.pos_limits.x_min;
    	}

        //Right wall
    	if(item.pos.x >= item.pos_limits.x_max ) 
	{
       		item.pos.x = item.pos_limits.x_max;
    	}
    
        //Roof wall.
    	if(item.pos.y <= item.pos_limits.y_min) 
	{
        	item.pos.y = item.pos_limits.y_min;
    	}

        //Floor wall
    	if(item.pos.y >= item.pos_limits.y_max ) 
	{
        	item.pos.y = item.pos_limits.y_max;
    	}

        //Fixed point helps be more deterministic
    	item.pos.x = item.pos.x.fixed(4);
    	item.pos.y = item.pos.y.fixed(4);
}, 

process_input:  function( player ) 
{
	//It's possible to have recieved multiple inputs by now,
    	//so we process each one
    	var x_dir = 0;
    	var y_dir = 0;
    	var ic = player.inputs.length;
    	if(ic) 	
	{
        	for(var j = 0; j < ic; ++j) 
		{
                	//don't process ones we already have simulated locally
			if (player.inputs[j].seq <= player.last_input_seq) 
			{
				continue;
			}

            		var input = player.inputs[j].inputs;
            		var c = input.length;
            		for(var i = 0; i < c; ++i) 
			{
                		var key = input[i];
                		if(key == 'l') 
				{
                    			x_dir -= 1;
                		}
                		if(key == 'r') 
				{
                    			x_dir += 1;
                		}
                		if(key == 'd') 
				{
                    			y_dir += 1;
                		}
                		if(key == 'u') 
				{
                    			y_dir -= 1;
                		}
            		} //for all input values
        	} //for each input command
    	} //if we have inputs

        //we have a direction vector now, so apply the same physics as the client
    	var resulting_vector = this.physics_movement_vector_from_direction(x_dir,y_dir);
    	if(player.inputs.length) 
	{
        	//we can now clear the array since these have been processed
        	player.last_input_time = player.inputs[ic-1].time;
        	player.last_input_seq = player.inputs[ic-1].seq;
    	}

        //give it back
    	return resulting_vector;
},

physics_movement_vector_from_direction: function(x,y) 
{
        //Must be fixed step, at physics sync speed.
    return {
        x : (x * (this.playerspeed * 0.015)).fixed(3),
        y : (y * (this.playerspeed * 0.015)).fixed(3)
    };
}, 
/*
game_core.prototype.physics_movement_vector_from_direction = function(x,y) {

        //Must be fixed step, at physics sync speed.
    return {
        x : (x * (this.playerspeed * 0.015)).fixed(3),
        y : (y * (this.playerspeed * 0.015)).fixed(3)
    };

}; //game_core.physics_movement_vector_from_direction
*/

update_physics:  function() 
{
    	if(this.server) 
	{
        	this.server_update_physics();
    	} 
	else 
	{
        	this.client_update_physics();
    	}

}, 

/*

 Server side functions
 
    These functions below are specific to the server side only,
    and usually start with server_* to make things clearer.

*/

//Updated at 15ms , simulates the world state
server_update_physics: function() 
{
	//Handle player one
    	this.serverPlayerArray[0].old_state.pos = this.pos( this.serverPlayerArray[0].pos );
    	var new_dir = this.process_input(this.serverPlayerArray[0]);
    	this.serverPlayerArray[0].pos = this.v_add( this.serverPlayerArray[0].old_state.pos, new_dir );

        //Handle player two
    	this.serverPlayerArray[1].old_state.pos = this.pos( this.serverPlayerArray[1].pos );
    	var other_new_dir = this.process_input(this.serverPlayerArray[1]);
    	this.serverPlayerArray[1].pos = this.v_add( this.serverPlayerArray[1].old_state.pos, other_new_dir);

        //Keep the physics position in the world
    	this.check_collision( this.serverPlayerArray[0] );
    	this.check_collision( this.serverPlayerArray[1] );

    	this.serverPlayerArray[0].inputs = []; //we have cleared the input buffer, so remove this
    	this.serverPlayerArray[1].inputs = []; //we have cleared the input buffer, so remove this

}, 

    	//Makes sure things run smoothly and notifies clients of changes
    	//on the server side
server_update: function()
{
        //Update the state of our local clock to match the timer
    	this.server_time = this.local_time;

        //Make a snapshot of the current state, for updating the clients
    	this.laststate = 
	{
        	hp  : this.serverPlayerArray[0].pos,                //'host position', the game creators position
        	cp  : this.serverPlayerArray[1].pos,               //'client position', the person that joined, their position
        	his : this.serverPlayerArray[0].last_input_seq,     //'host input sequence', the last input we processed for the host
        	cis : this.serverPlayerArray[1].last_input_seq,    //'client input sequence', the last input we processed for the client
        	t   : this.server_time                      // our current local time on the server
    	};

        //Send the snapshot to the 'host' player
    	if(this.serverPlayerArray[0].client) 
	{
        	this.serverPlayerArray[0].client.emit( 'onserverupdate', this.laststate );
    	}

        //Send the snapshot to the 'client' player
    	if(this.serverPlayerArray[1].client) 
	{
        	this.serverPlayerArray[1].client.emit( 'onserverupdate', this.laststate );
    	}
}, 

handle_server_input: function(client, input, input_time, input_seq) 
{
        //Fetch which client this refers to out of the two
    	var player_client =
        (client.userid == this.serverPlayerArray[0].client.userid) ?
            this.serverPlayerArray[0] : this.serverPlayerArray[1];

        //Store the input on the player instance for processing in the physics loop
   	player_client.inputs.push({inputs:input, time:input_time, seq:input_seq});
}, 

create_timer: function()
{
	setInterval(function()
	{
        	this._dt = new Date().getTime() - this._dte;
        	this._dte = new Date().getTime();
        	this.local_time += this._dt/1000.0;
    	}.bind(this), 4);
},

create_physics_simulation: function() 
{
	setInterval(function()
	{
        	this._pdt = (new Date().getTime() - this._pdte)/1000.0;
        	this._pdte = new Date().getTime();
        	this.update_physics();
    	}.bind(this), 15);
} 

});

// (4.22208334636).fixed(n) will return fixed point value to n places, default n = 3
Number.prototype.fixed = function(n) { n = n || 3; return parseFloat(this.toFixed(n)); };

module.exports = ServerCore;
