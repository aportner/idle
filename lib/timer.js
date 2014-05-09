var nicetime        = require( 'nicetime' );
var utils           = require( './utils' );


function GameTimer( bot, ticrate, saverate )
{
    this.bot            = bot;
    this.ticrate        = this.bot.config.rpg.ticrate;
    this.saverate       = this.bot.config.rpg.saverate;

    var self            = this;

    this.interval       = setInterval( function() { self.tick(); }, this.ticrate );
    this.saveInterval   = setInterval( function() { self.save(); }, this.saverate );
}


GameTimer.prototype.save = function()
{
    console.log( "Timer :: Automatically saving db" );
    this.bot.save().then( function() {
        console.log( "Timer :: DB saved" );
    }, function( err ) {
        console.log( "Timer :: DB error " + err );
    });
}


GameTimer.prototype.tick = function()
{
    var users       = this.bot.users.users;
    var online      = this.bot.users.getOnlineUsers();
    var numOnline   = online.length;

    if ( utils.randInt( this.bot.config.rpg.hograte * 1000 / this.ticrate ) < numOnline )
    {
        this.bot.hog();
    }

    if ( utils.randInt( this.bot.config.rpg.calamityrate * 1000 / this.ticrate ) < numOnline )
    {
        this.bot.calamity();
    }

    if ( utils.randInt( this.bot.config.rpg.godsendrate * 1000 / this.ticrate ) < numOnline )
    {
        this.bot.godsend();
    }

    this.bot.monsters.moveTick();

    for ( var email in users )
    {
        var user    = users[ email ];

        if ( user.isOnline() )
        {
            if ( user.xpTick( this.ticrate ) )
            {
                this.bot.events.levelUp( user );
            }

            user.moveTick();
        }
    }
}


module.exports = exports = GameTimer;