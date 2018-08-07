module.exports = function (RED) {
  'use strict'

  const jwks = require('jwks-rsa')
  const nJwt = require('njwt')
  const request = require('request')

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
      this.verifier.verify(accessToken, (err, jwt) => {
        if (err) {
          this.error(RED._('bad-access-token', err))
          this.status({
            fill: 'red',
            shape: 'ring',
            text: 'bad-access-token'
          });
          delete msg.payload;
          msg.error = err;
          msg.statusCode = 403;
          msg.res._res.status(msg.statusCode).send(msg.error);
          return ;
        }


        msg.access_token = jwt;
        //check role and client
        console.log(jwt.body.resource_access[this.client]);
        
        if (this.client && !jwt.body.resource_access[this.client]) {         
          let err = 'Access error : client not found';
          this.status({
            fill: 'red',
            shape: 'ring',
            text: err
          });
          delete msg.payload;
          msg.error = err;
          msg.statusCode = 403;
          msg.res._res.status(msg.statusCode).send(msg.error);
          return ;
        }

        
        console.log()//.contains(this.role));
        if (this.client && this.role && !jwt.body.resource_access[this.client].roles.includes(this.role)) {
          let err = 'Access error : role not found with client : ' + this.client;
          this.status({
            fill: 'red',
            shape: 'ring',
            text: err
          });
          delete msg.payload;
          msg.error = err;
          msg.statusCode = 403;
          msg.res._res.status(msg.statusCode).send(msg.error);
          return ;

        };

        if (!this.client && this.role) {
          for (var client in jwt.body.ressource_access) {
            if (client.roles.includes(this.role)) {
              break;
            } else {
              let err = 'Access error : role not found ';
              this.status({
                fill: 'red',
                shape: 'ring',
                text: err
              });
              delete msg.payload;
              msg.error = err;
              msg.statusCode = 403;
              msg.res._res.status(msg.statusCode).send(msg.error);
              return ;
            }
          }         
        };      

        this.status({})
        this.send(msg)
      })
    })
  }
  RED.nodes.registerType('Keycloak', KeycloakNode)
}