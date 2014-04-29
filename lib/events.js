var Q 			= require( 'q' );
var nicetime 	= require( 'nicetime' );
var randInt 	= require( './utils' ).randInt;

function Events( bot )
{
	this.bot 	= bot;
}


Events.prototype.hog = function()
{
	var users 		= this.bot.users.getOnlineUsers();
	var numUsers 	= users.length;
	var user 		= users[ randInt( numUsers ) ];
	var win			= randInt( 5 );
	var time 		= Math.floor( ( ( 5 + randInt( 71 ) ) / 100 ) * user.getNextTime() );
	var level 		= user.getLevel() + 2;

	var message 	= null;

	if ( win > 0 )
	{
		message 	= "Verily I say unto thee, the Heavens have burst forth, and the blessed hand of God carried you " + nicetime( time ) + " toward level " + level + ". ";
		user.addTime( -time );
	}
	else
	{
		message 	= "Thereupon He stretched out His little finger among them and consumed you with fire, slowing the heathen " + nicetime( time ) + " from level " + level + ". ";
		user.addTime( time );
    }

    message 		+= "You reach level " + level + " in " + nicetime( user.getNextTime() ) + ".";

    this.bot.connection.sendMessage( user.getEmail(), message );
}


module.exports 	= exports 	= Events;