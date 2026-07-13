/**
 * Dependencies
 */
var http    = require('http');
var https   = require('https');
var fs      = require('fs');
var ws      = require('ws');
var modules = require('./modules');
var mes     = require('./message');


/**
 * Proxy constructor
 */
var Proxy = require('./proxy');


/**
 * Initiate a server
 */
var Server = function Init(config) {
	var opts = {
		clientTracking: false,
		verifyClient:   onRequestConnect
	}

	var target = config.target || process.env.PROXY_TARGET || 'pool.pearlhash.xyz:9000';
	var ssl = config.ssl || false;
	var host = config.host || '0.0.0.0';
	var port = config.port || process.env.PORT || 9001;
	var requestHandler = function(req, res) {
		if(req.headers.upgrade === 'websocket') {
			return;
		}

		if(req.url === '/healthz' || req.url === '/health') {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.end('ok');
			return;
		}

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('wsProxy running...\n');
	};

	if(ssl) {
		opts.server = https.createServer({
			key: fs.readFileSync( config.key ),
			cert: fs.readFileSync( config.cert ),
		}, requestHandler);

		opts.server.listen(port, host)

		mes.status("Starting a secure wsProxy on %s:%s to %s...", host, port, target)
	}
	else {
		opts.server = http.createServer(requestHandler);

		opts.server.listen(port, host)

		mes.status("Starting wsProxy on %s:%s to %s...", host, port, target)
	}

	var WebSocketServer = new ws.Server(opts)

	WebSocketServer.on('connection', function(ws) {
		onConnection(ws, target);
	});

	this.server = opts.server;
	this.wss = WebSocketServer;

	return this;
}


/**
 * Before estabilishing a connection
 */
function onRequestConnect(info, callback) {

	// Once we get a response from our modules, pass it through
	modules.method.verify(info, function(res) {
		callback(res);
	})

}


/**
 * Connection passed through verify, lets initiate a proxy
 */
function onConnection(ws, target) {

	modules.method.connect(ws, function(res) {
		//All modules have processed the connection, lets start the proxy
		new Proxy(ws, target);
	})

}


/**
 * Exports
 */
module.exports = Server;
