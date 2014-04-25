var nicetime 		= require( 'nicetime' );


function GameTimer( bot, ticrate, saverate )
{
	this.bot 		= bot;
	this.ticrate 	= ticrate;
	this.saverate 	= saverate;

	var self 		= this;

	this.interval 	= setInterval( function() { self.tick(); }, this.ticrate );
	this.saveInterval 	= setInterval( function() { self.save(); }, this.saverate );
}


GameTimer.prototype.save = function()
{
	this.bot.save();
}


GameTimer.prototype.tick = function()
{
	var users 		= this.bot.users.users;

	for ( var email in users )
	{
		var user 	= users[ email ];

		if ( user.isOnline() )
		{
			if ( user.xpTick( this.ticrate ) )
			{
				this.bot.connection.sendMessage( user.getEmail(), "Level up!  You are now level " + ( user.getLevel() + 1 ) + ".  Next level in: " + nicetime( user.getNextTime() ) );
			}
		}
	}
}


module.exports = exports = GameTimer;