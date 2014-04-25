var Q           = require( 'q' );


function Users( bot, db )
{
    this.bot        = bot;
    this.db         = db.collection( 'users' );
    this.users      = {}
    this.buddylist  = new Buddylist();
}


Users.prototype.load    = function()
{
    var self        = this;
    var deferred    = Q.defer();

    this.db.find( {} ).toArray( function( err, result ) {
        if ( err )
        {
            deferred.reject( err );
        }
        else
        {
            if ( result )
            {
                var len     = result.length;

                for ( var i = 0; i < len; ++i )
                {
                    var model   = result[ i ];
                    self.users[ model.email ] = new User( self.bot, self ).setModel( model );
                }
            }

            deferred.resolve( true );
        }
    } );

    return deferred.promise;
}


Users.prototype.getUser = function( email )
{
    var deferred    = Q.defer();
    var self        = this;

    if ( this.users[ email ] )
    {
        deferred.resolve( this.users[ email ] );
    }

    this.db.findOne( { email: email }, function( err, item ) {
        if ( !err )
        {
            var user = null;

            if ( item )
            {
                self.users[ email ] = user = new User( self.bot, self ).setModel( item );
            }

            deferred.resolve( user );
        }
        else
        {
            deferred.reject( err );
        }
    } );

    return deferred.promise;
}


Users.prototype.register = function( email, className )
{
    var user;

    console.log( "Registering a user " + email + " with class " + className );

    this.users[ email ] = user = new User( this.bot, this );
    return user.register( email, className );
}


Users.prototype.updatePresence = function( jid, state )
{
    console.log( "USERS :: " + jid + " is " + state );
    this.buddylist.updatePresence( jid, state );
}


Users.prototype.isOnline = function( email )
{
    return this.buddylist.isOnline( email );
}


Users.prototype.save    = function( user )
{
    var deferred    = Q.defer();

    this.db.save( user.getModel(), function( err, result ) {
        if ( err )
        {
            deferred.reject( err )
        }
        else
        {
            deferred.resolve( result );
        }
    } );

    return deferred.promise;
}


function User( bot, users )
{
    this.bot        = bot;
    this.users      = users;
    this.model      = {};
}


User.prototype.register = function( email, className )
{
    var self            = this;
    var deferred        = Q.defer();

    this.model.email        = email;
    this.model.className    = className;
    this.model.level        = 0;
    this.model.nextTime     = this.calculateNextTime();

    this.users.db.insert( this.model, function( err, result ) {
        if ( err )
        {
            deferred.reject( err );
        }
        else
        {
            self.model  = result[ 0 ];
            deferred.resolve( self );
        }
    } );

    return deferred.promise;
}


User.prototype.getClassName = function() { return this.model.className; }
User.prototype.getEmail     = function() { return this.model.email; }
User.prototype.getLevel     = function() { return this.model.level; }
User.prototype.getNextTime  = function() { return this.model.nextTime; }
User.prototype.getModel     = function() { return this.model; }

User.prototype.setModel = function( model )
{
    this.model = model;
    return this;
}


User.prototype.calculateNextTime = function()
{
    var rpg     = this.bot.config.rpg
    return rpg.rpbase * Math.pow( rpg.rpstep, this.model.level );
}


User.prototype.isOnline     = function()
{
    return this.users.isOnline( this.model.email );
}


User.prototype.xpTick       = function( ms )
{
    var sec     = Math.floor( ms * 0.001 );

    this.model.nextTime -= sec;

    // console.log( this.model.email + " :: " + this.model.nextTime )

    if ( this.model.nextTime <= 0 )
    {
        console.log( "LEVEL UP" );
        this.levelUp();
        return true;
    }

    return false;
}


User.prototype.levelUp      = function()
{
    ++this.model.level;
    this.model.nextTime     = this.calculateNextTime();

    this.save();
}


Users.prototype.saveUsers   = function()
{
    
}


User.prototype.save         = function()
{
    this.users.save( this );
}


function Buddylist()
{
    this.jids   = [];
}


Buddylist.prototype.updatePresence = function( jid, state )
{
    var index   = this.jids.indexOf( jid );

    if ( state == "offline" && index >= 0 )
    {
        this.jids.splice( index, 1 );
    }
    else if ( state != "offline" && index == -1 )
    {
        this.jids.push( jid );
    }
}


Buddylist.prototype.isOnline = function( email )
{
    var len     = this.jids.length;

    for ( var i = 0; i < len; ++i )
    {
        if ( email == this.jids[ i ].split( '/' )[ 0 ] )
        {
            return true;
        }
    }

    return false;
}



module.exports.Users    = Users;
module.exports.User     = User;