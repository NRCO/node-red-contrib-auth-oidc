/**
 * Copyright 2018 Nicolas Carlier
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

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
        return cb(RED._('auth-oidc.error.bad-discovery-endpoint'))
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
          text: 'auth-oidc.status.bad-discovery-request'
        })
        return this.error(RED._('auth-oidc.error.bad-discovery-request'))
      }
      if (!body || !body.jwks_uri) {
        console.log('Discovery error: bad response: %j', body)
        this.status({
          fill: 'red',
          shape: 'ring',
          text: 'auth-oidc.status.bad-discovery-response'
        })
        return this.error(RED._('auth-oidc.error.bad-discovery-response'))
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
        text: 'auth-oidc.status.ready'
      })
    })

    this.on('input', msg => {
      if (!msg.req || !msg.req.headers || !msg.req.headers['authorization']) {
        this.error(RED._('auth-oidc.error.no-access-token'))
        this.status({
          fill: 'red',
          shape: 'ring',
          text: 'auth-oidc.status.no-access-token'
        })
        msg.error = 'NoAccessToken'
        msg.statusCode = 401
        return this.send(msg)
      }
      const accessToken = msg.req.headers['authorization'].split(' ')[1]
      this.verifier.verify(accessToken, (err, jwt) => {
        if (err) {
          this.error(RED._('auth-oidc.error.bad-access-token', err))
          this.status({
            fill: 'red',
            shape: 'ring',
            text: 'auth-oidc.status.bad-access-token'
          })
          msg.error = err
          msg.statusCode = 403
          return this.send(msg)
        }


        msg.access_token = jwt;
        //check role and client
        checkPermission(this, msg, jwt);
        if (delete msg.error) {
          msg.payload = {};
        }

        this.status({})
        this.send(msg)
      })
    })
  }
  RED.nodes.registerType('Keycloak', KeycloakNode)
}

var checkPermission = function (this, msg, jwt) {

  if (this.client && !jwt.body.resource_access[this.client]) {
    let err = 'Access error : client not found';
    this.status({
      fill: 'red',
      shape: 'ring',
      text: err
    });
    msg.error = err
    msg.statusCode = 403
    break;
  }

  if (this.client && this.role && !jwt.body.resource_access[this.client].roles.has(this.roles)) {
    let err = 'Access error : role not found with client : ' + this.client;
    this.status({
      fill: 'red',
      shape: 'ring',
      text: err
    });
    msg.error = err
    msg.statusCode = 403
    break;
  };

  if (!this.client && this.role) {
    for (var client in jwt.body.ressource_access) {
      if (client.roles.has(this.role)) {        
        break;
      } else {
        msg.statusCode = 403;
      }
    }

    if (msg.statusCode == 403) {
      let err = 'Access error : role not found ';
      this.status({
        fill: 'red',
        shape: 'ring',
        text: err
      });
      msg.error = err
    }
  };
}