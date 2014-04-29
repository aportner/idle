var Engine      = require( 'tingodb' )();
var nicetime    = require( 'nicetime' );
var Connection  = require( './lib/connection' );
var Commands    = require( './lib/commands' );
var Users       = require( './lib/users' );
var GameTimer   = require( './lib/timer' );
var Events      = require( './lib/events' );
var config      = require( './config.json' );


var ACL_OWNER   = 500;


function Idle()
{
    var self        = this;
    this.config     = config;
    this.db         = new Engine.Db( config.db, {} );
    this.events     = new Events( this );

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
    this.commands.addCommand( "save", "handleSave" );
    this.commands.addCommand( "auth", "handleAuth" );
    this.commands.addCommand( "vcard", "handleVCard" );
    this.commands.addCommand( "hog", "handleHOG" );
}


Idle.prototype.online   = function()
{
    this.gameTimer  = new GameTimer( this );
}


Idle.prototype.handleSave   = function( jid, args, user, email )
{
    var self        = this;

    if ( user.getACL() >= this.config.permissions.save )
    {
        this.save().then( function() {
            self.connection.sendMessage( jid, "Database saved." );
        }, function( err ) {
            self.connection.sendMessage( jid, "Error saving database: " + err );
        } );
    }
}


Idle.prototype.handleAuth   = function( jid, args, user, email )
{
    var self    = this;

    if ( user != null && args.length > 1 && args[ 1 ] == this.config.admin_password )
    {
        user.setACL( ACL_OWNER );
        this.connection.sendMessage( jid, "Your ACL is now " + ACL_OWNER );
    }
}


Idle.prototype.handleHOG    = function( jid, args, user, email )
{
    if ( user != null && user.getACL() >= this.config.permissions.hog )
    {
        console.log( "Idle :: " + email + " triggered a Hand of God" );
        this.hog();
    }
}


Idle.prototype.hog          = function() { this.events.hog(); }


Idle.prototype.save     = function()
{
    return this.users.saveUsers();
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
        var info    = "-- " + email + " --\n";
        info        += "Class: " + user.getClassName() + "\n";
        info        += "Level: " + ( user.getLevel() + 1 ) + "\n";

        var nextTime    = user.getNextTime();
        info        += "Next level in: " + nicetime( nextTime ) + " (" + nextTime + " seconds)\n";

        var acl     = user.getACL();
        if ( acl )
        {
            info    += "ACL: " + acl + "\n";
        }


        this.connection.sendMessage( jid, info )
    }
}


Idle.prototype.handleVCard  = function( jid, args, user, email )
{
    this.connection.getVCard( jid );
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
