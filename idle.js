var Engine      = require( 'tingodb' )();
var nicetime    = require( 'nicetime' );
var Connection  = require( './lib/connection' );
var Commands    = require( './lib/commands' );
var Users       = require( './lib/users' );
var GameTimer   = require( './lib/timer' );
var config      = require( './config.json' );

function Idle()
{
    var self        = this;
    this.config     = config;
    this.db         = new Engine.Db( config.db, {} );

    this.users      = new Users.Users( this, this.db );
    this.users.load().then( function() {
        self.onUsersLoad();
    }, function( err ) {
        console.log( "Error loading users: " + err );
    });
}


Idle.prototype.onUsersLoad  = function()
{
    this.commands   = new Commands( this );

    this.initCommands();

    this.connection = new Connection( this );
    this.connection.connect();
}


Idle.prototype.initCommands = function()
{
    this.commands.addCommand( "register", "handleRegister", "Registers an account" );
    this.commands.addCommand( "info", "handleInfo", "Prints out the info of your account" );
}


Idle.prototype.online   = function()
{
    this.gameTimer  = new GameTimer( this, this.config.rpg.ticrate, this.config.rpg.saverate );
}


Idle.prototype.save     = function()
{
    this.users.saveUsers();
}


Idle.prototype.handleRegister = function( jid, args, user, email )
{
    var self    = this;

    if ( user == null )
    {
        if ( args.length < 2 )
        {
            this.connection.sendMessage( jid, "Syntax: register <class name>" );
        }
        else
        {
            var className = args.slice( 1 ).join( " " );

            this.users.register( email, className ).then( function( newUser ) {
                self.connection.sendMessage( jid, "Registered a new account with the class: " + newUser.getClassName() + ".  You are level " + ( newUser.getLevel() + 1 ) + ".  Next level in: " + nicetime( newUser.getNextTime() ) );
            }, function( err ) {
                self.connection.sendMessage( jid, "Error registering a new account" );
            });
        }
    }
    else
    {
        this.connection.sendMessage( jid, "Your account is already registered" );
    }
}


Idle.prototype.handleInfo   = function( jid, args, user, email )
{
    if ( user )
    {
        var info    = "";
        info        += "Level: " + ( user.getLevel() + 1 ) + "\n";

        var nextTime    = user.getNextTime();
        info        += "Next level in: " + nicetime( nextTime ) + " (" + nextTime + " seconds)";


        this.connection.sendMessage( jid, info )
    }
}


Idle.prototype.handleMessage = function( jid, message )
{
    console.log( jid + " :: " + message );

    this.commands.handle( jid, message );
};


Idle.prototype.updatePresence = function( jid, state, statusText )
{
    this.users.updatePresence( jid, state );
}


var idle        = new Idle();
