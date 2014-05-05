var Q               = require( 'q' );
var nicetime        = require( 'nicetime' );
var Utils           = require( './utils' );

var randInt         = Utils.randInt;
var randElement     = Utils.randElement;


function Events( bot )
{
	this.bot 	= bot;
}


Events.prototype.calamity       = function()
{
    var users       = this.bot.users.getOnlineUsers();
    var numUsers    = users.length;
    var user        = users[ randInt( numUsers ) ];
    var message     = "";

    if ( randInt( 10 ) < 1 )
    {

    }
    else
    {
        var time    = Math.floor( ( 5 + randInt( 8 ) ) / 100 * user.getNextTime() );
        var calam   = randElement( this.bot.config.rpg.calamities );

        message     = "You " + calam + ". This terrible calamity has slowed you " + nicetime( time ) + " from level " + ( user.getLevel() + 2 ) + ".";
        user.addTime( time );
    }

    if ( message )
    {
        user.sendMessage( message );
    }
}


Events.prototype.godsend    = function()
{
    var users       = this.bot.users.getOnlineUsers();
    var numUsers    = users.length;
    var user        = users[ randInt( numUsers ) ];

    var message     = "";

    if ( randInt( 10 ) < 1 )
    {

    }
    else
    {
        var time    = Math.floor( ( 5 + randInt( 8 ) ) / 100 * user.getNextTime() );
        var gs      = randElement( this.bot.config.rpg.godsends );

        message     = "You " + gs + "! This wondrous godsend has accelerated you " + nicetime( time ) + " towards level " + ( user.getLevel() + 2 ) + ".";
        user.addTime( -time );
    }

    if ( message )
    {
        user.sendMessage( message );
    }
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


Events.prototype.levelUp    = function( user )
{
    this.bot.connection.sendMessage( user.getEmail(), "Level up!  You are now level " + ( user.getLevel() + 1 ) + ".  Next level in: " + nicetime( user.getNextTime() ) );
    this.findItem( user );
    this.challengeOpponent( user );
    user.save();
}


Events.prototype.findItem   = function( user )
{
    var items       = this.bot.config.rpg.items;

    var type        = items[ randInt( items.length ) ];
    var level       = 1;
    var oldItem     = user.getItem( type );

    for ( var i = 1; i < user.getLevel() * 1.5; ++i )
    {
        if ( randInt( Math.pow( 1.4, i / 4 ) ) < 1 )
        {
            level = i;
        }
    }

    if ( user.exchangeItem( type, level ) )
    {
        this.bot.connection.sendMessage( user.getEmail(), "You found a level " + level + " " + type + "! Your current " + type + " is only level " + oldItem.level + ", so it seems Luck is with you!" );
    }
    else
    {
        this.bot.connection.sendMessage( user.getEmail(), "You found a level " + level + " " + type + ". Your current " + type + " is level " + oldItem.level + ", so it seems Luck is against you. You toss the " + type + "." );
    }
}


Events.prototype.challengeOpponent 	= function( user )
{
    try {
    if ( user.getLevel() >= this.bot.config.rpg.challenge_opponent_level || randInt( this.bot.config.rpg.challenge_opponent_level_chance ) == 0 )
    {
        var online      = this.bot.users.getOnlineUsers().filter( function( element ) {
            return element != user
        } );

        var numOnline   = online.length;

        if ( numOnline > 0 )
        {
            var opponent    = online[ randInt( numOnline ) ];
            var mySum       = user.getItemSum();
            var oppSum      = opponent.getItemSum();
            var myRoll      = randInt( mySum );
            var oppRoll     = randInt( oppSum );

            if ( myRoll >= oppRoll )
            {
                var gain    = Math.floor( Math.max( 7, opponent.getLevel() / 4 ) * user.getNextTime() / 100 );
                user.addTime( -gain );
                this.bot.connection.sendMessage( user.getEmail(), "You [" + myRoll + "/" + mySum + "] have challeneged " + opponent.getEmail() + " the " +
                    opponent.getClassName() + " [" + oppRoll + "/" + oppSum + "] in combat and won! " + nicetime( gain ) + " is removed from your clock. " +
                    "Next level in " + nicetime( user.getNextTime() ) );
            }
            else
            {
                var gain    = Math.floor( Math.max( 7, opponent.getLevel() / 7 ) * user.getNextTime() / 100 );
                user.addTime( gain );
                this.bot.connection.sendMessage( user.getEmail(), "You [" + myRoll + "/" + mySum + "] have challeneged " + opponent.getEmail() + " the " +
                    opponent.getClassName() + " [" + oppRoll + "/" + oppSum + "] in combat and lost! " + nicetime( gain ) + " is added to your clock. " +
                    "Next level in " + nicetime( user.getNextTime() ) );
            }
        }
    }
    } catch ( err ) { console.log( err ); }
}


module.exports 	= exports 	= Events;