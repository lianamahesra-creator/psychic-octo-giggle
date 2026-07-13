var assert = require('assert');
var net = require('net');
var WebSocket = require('ws');
var Server = require('../src/server');

describe('wsProxy', function() {
	it('starts a proxy server', function(done) {
		var server = new Server({
			port: 0,
			ssl: false,
			target: '127.0.0.1:1'
		});

		server.server.close(function() {
			done();
		});
	});

	it('proxies websocket traffic to a fixed upstream target', function(done) {
		var upstream = net.createServer(function(socket) {
			socket.on('data', function(data) {
				socket.write(Buffer.from('echo:' + data.toString()));
			});
		});

		upstream.listen(0, '127.0.0.1', function() {
			var upstreamPort = upstream.address().port;
			var proxy = new Server({
				port: 0,
				ssl: false,
				target: '127.0.0.1:' + upstreamPort
			});

			proxy.server.on('listening', function() {
				var client = new WebSocket('ws://127.0.0.1:' + proxy.server.address().port + '/');
				client.on('open', function() {
					client.send('hello');
				});
				client.on('message', function(message) {
					assert.strictEqual(message.toString(), 'echo:hello');
					client.close();
					proxy.server.close(function() {
						upstream.close(function() {
							done();
						});
					});
				});
				client.on('error', function(error) {
					proxy.server.close(function() {
						upstream.close(function() {
							done(error);
						});
					});
				});
			});
		});
	});
});
