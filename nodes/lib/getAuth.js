const adminClient = require("keycloak-admin-client");
let settings = {};
const tokenUrl = 'protocol/openid-connect/token';
const url = require('url');
const http = require('http');
const https = require('https');
const querystring = require('querystring');
/**
 * Get client keycloak
 * @param {*} settings 
 */
var getClient = (settings) => {
    return new Promise((resolve, reject) => {
        //console.log(settings);
        return adminClient(settings)
            .then((client) => {
                //console.log(client);
                return resolve(client);
            })
            .catch((err) => {
                err = "erreur admin client";
                return reject(err);
            });
    });
}

var getToken = (baseUrl, settings) => {
    return new Promise((resolve, reject) => {
        console.log(baseUrl);
        settings = settings || {};

        settings.realmName = settings.realmName ? settings.realmName : 'master';

        const options = url.parse(`${baseUrl}/realms/${settings.realmName}/${tokenUrl}`);

        options.headers = {
            'Content-type': 'application/x-www-form-urlencoded'
        };

        options.method = 'POST';

        options.data = settings;

        const caller = (options.protocol === 'https:') ? https : http;
        const data = [];
        const req = caller.request(options, (res) => {
            res.on('data', (chunk) => {
                data.push(chunk);
            }).on('end', () => {
                try {
                    const stringData = Buffer.concat(data).toString();

                    // need to look for the 404 since the return value is not really JSON but HTML
                    if (res.statusCode === 404) {
                        return reject(stringData);
                    }

                    const parsedData = JSON.parse(stringData);
                    if (res.statusCode !== 200) {
                        return reject(parsedData);
                    }

                    const token = parsedData.access_token;
                    return resolve(token);
                } catch (e) {
                    return reject(e);
                }
            });
        });

        req.on('error', (e) => {
            return reject(e);
        });

        req.write(querystring.stringify(options.data));
        req.end();
    });
}



var getAuth = (node) => {
    var baseUrl = node.url;
    return new Promise((resolve, reject) => {
        settings = {
            baseUrl: node.url,
            grant_type: 'password',
            realmName: node.realm,
            client_id: node.client,
            client_secret: node.secret,
            username: node.admin,
            password: node.admin_password
        };

        return getClient(settings)
            .then((client) => {                
                return getToken(baseUrl, settings).then((token) => {
                    return resolve(token);
                })
            })

    })

}



module.exports.getAuth = getAuth;