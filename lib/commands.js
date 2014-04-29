function Commands( bot ) {
    this.commands       = {};
    this.bot            = bot;
}


Commands.prototype.addCommand = function( cmd, handler, description )
{
    this.commands[ cmd ]    = new CommandInfo( cmd, handler, description );
}


Commands.prototype.handle = function( jid, message )
{
    var self    = this;
    var email   = this.getEmailFromJID( jid );
    var args    = this.getArgs( message );

    if ( args && args.length > 0 )
    {
        var cmd = args[ 0 ].toLowerCase();

        if ( cmd == "help" )
        {
            this.handleHelp( jid, message, args );
            return true;
        }

        if ( this.commands[ cmd ] != null )
        {
            this.bot.users.getUser( email ).then( function( user ) {
                var command = self.commands[ cmd ];

                self.bot[ command.handler ]( jid, args, user, email );
            }, function( err ) {
                console.log( "DB ERR: " + err );
            } );

            return true;
        }
        else
        {
            this.bot.connection.sendMessage( jid, "Unknown command: " + cmd + ".  Try typing help for more info." );
        }
    }

    return false;
}


Commands.prototype.handleHelp       = function( jid, message, args )
{
    if ( args.length == 1 )
    {
        var txt         = "";

        for ( var i in this.commands )
        {
            var info    = this.commands[ i ];

            if ( info.description != null )
            {
                txt         += info.cmd + " -- " + info.description + "\n";
            }
        }

        this.bot.connection.sendMessage( jid, txt );
    }
    else
    {
        var cmd         = args[ 1 ].toLowerCase();
        var info        = this.commands[ cmd ];

        if ( info && info.description != null )
        {
            this.bot.connection.sendMessage( jid, info.cmd + " -- " + info.description );
        }
        else
        {
            this.bot.connection.sendMessage( jid, "No such command: " + args[ 0 ] );
        }
    }
}


Commands.prototype.getEmailFromJID = function( jid )
{
    return jid.split( '/' )[ 0 ];
}


Commands.prototype.getArgs = function( message )
{
    var regExp = /(".*?"|'.*?'|\S+)/gm;

    return message != null ? message.match( regExp ) : null;
}


function CommandInfo( cmd, handler, description )
{
    this.cmd            = cmd;
    this.handler        = handler;
    this.description    = description;
}


module.exports = exports = Commands;