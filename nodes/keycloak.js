module.exports = function (RED) {
  'use strict'

  const jwks = require('jwks-rsa');
  const nJwt = require('njwt');
  const request = require('request');
  const check = require('./lib/check').check;

  function KeycloakNode(n) {
    RED.nodes.createNode(this, n)

    // Set node state
    this.name = n.name
    this.discovery = n.discovery;
    this.role = n.role;
    this.client = n.client;
    this.verifier = {
      verify: function (accessToken, cb) {
        return cb(RED._('bad-discovery-endpoint'))
      }
    }

    request.get({
      url: this.discovery,
      json: true
    }, (err, res, body) => {
      if (err) {
        console.log('Discovery error: %j', err)
        this.status({
          fill: 'red',
          shape: 'ring',
          text: 'bad-discovery-request'
        })
        return this.error(RED._('bad-discovery-request'))
      }
      if (!body || !body.jwks_uri) {
        console.log('Discovery error: bad response: %j', body)
        this.status({
          fill: 'red',
          shape: 'ring',
          text: 'bad-discovery-response'
        })
        return this.error(RED._('bad-discovery-response'))
      }
      console.log('JWKS URI: %j', body.jwks_uri)

      const options = {
        cache: true,
        cacheMaxAge: 60 * 60 * 1000,
        cacheMaxEntries: 3,
        jwksRequestsPerMinute: 10,
        rateLimit: true
      }

      const jwksClient = jwks(Object.assign({},
        options, {
          jwksUri: body.jwks_uri
        }))
      this.verifier = nJwt.createVerifier()
        .setSigningAlgorithm('RS256')
        .withKeyResolver((kid, cb) => {
          jwksClient.getSigningKey(kid, (err, key) => {
            cb(err, key && (key.publicKey || key.rsaPublicKey))
          })
        })
      this.status({
        fill: 'blue',
        shape: 'ring',
        text: 'ready'
      })
    })

    this.on('input', msg => {
      if (!msg.req || !msg.req.headers || !msg.req.headers['authorization']) {
        this.error(RED._('no-access-token'))
        this.status({
          fill: 'red',
          shape: 'ring',
          text: 'no-access-token'
        });
        msg.payload = {};
        msg.error = 'NoAccessToken'
        msg.statusCode = 401
        return this.send(msg)
      }
      const accessToken = msg.req.headers['authorization'].split(' ')[1]
      this.accessToken = accessToken;
      check(this).then((res) => {
        node.send(
          msg = {
            payload: res
          }
        );
      });
    });
    RED.nodes.registerType('Keycloak', KeycloakNode);
  }
}