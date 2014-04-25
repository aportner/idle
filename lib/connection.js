var xmpp        = require('node-xmpp');


var STATUS = {
    AWAY:       "away",
    DND:        "dnd",
    XA:         "xa",
    ONLINE:     "online",
    OFFLINE:    "offline"
};


function Connection( bot )
{
    this.bot = bot;

}


Connection.prototype.connect = function()
{
    var self    = this;
    var config  = this.bot.config;

    this.client = new xmpp.Client( {
        jid: config.username,
        password: config.password
    } );

    // this.client.socket.setTimeout( 0 );
    // this.client.socket.setKeepAlive( true, 10000 );

    this.client.on('online', function() {
        console.log("XMPP :: online");

        self.setStatusMessage('Available');
        self.requestGoogleRoster();
        self.bot.online();
    });

    this.client.on( 'stanza', function( stanza ) { self.handleStanza( stanza ); } );
}


Connection.prototype.setStatusMessage = function( status )
{
    var presence    = new xmpp.Element('presence', { } )
        .c( 'show' ).t( 'chat' ).up()
        .c( 'status' ).t( status );

    this.client.send( presence );
}


Connection.prototype.requestGoogleRoster = function()
{
    var self    = this;
    var roster  = new xmpp.Element( 'iq' , { from: self.client.jid, type: 'get', id: 'google-roster' } )
        .c('query', { xmlns: 'jabber:iq:roster', 'xmlns:gr': 'google:roster', 'gr:ext': '2' } );

    this.client.send( roster );
}


Connection.prototype.handleStanza = function( stanza )
{
    if( stanza.is( 'presence' ) )
    {
        if ( stanza.attrs.type === 'subscribe' )
        {
            this.acceptSubscriptionRequests( stanza );
        }
        else if( stanza.attrs.type == 'unsubscribe' )
        {
            // do nothing
        }
        else
        {
            this.updatePresence( stanza );
        }
    }
    else if ( stanza.is( 'message' ) )
    {
        this.handleMessage( stanza );
    }
}


Connection.prototype.updatePresence = function( stanza )
{
    var statusText  = stanza.getChildText('status');
    var state       = stanza.getChild('show') ? stanza.getChild('show').getText() : STATUS.ONLINE;
    state           = state == 'chat' ? STATUS.ONLINE : state;
    state           = stanza.attrs.type == 'unavailable' ? STATUS.OFFLINE : state;

    this.bot.updatePresence( stanza.attrs.from, state, statusText );
}


Connection.prototype.handleMessage = function( stanza )
{
    var body = stanza.getChildText( 'body' );

    if ( body != null )
    {
        this.bot.handleMessage( stanza.attrs.from, body );
    }
}


Connection.prototype.sendMessage = function( jid, message )
{
    console.log( "--> " + jid + " :: " + message );
    var elem    = new xmpp.Element('message', { to: jid , type: 'chat' })
        .c('body').t( message );
    this.client.send(elem);
}


Connection.prototype.acceptSubscriptionRequests = function( stanza )
{
    var subscribe   = new xmpp.Element( 'presence', {
        to: stanza.attrs.from,
        type: 'subscribed'
    });

    this.client.send( subscribe );
}


module.exports = exports = Connection;