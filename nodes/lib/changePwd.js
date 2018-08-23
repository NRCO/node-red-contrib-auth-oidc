const adminClient = require("keycloak-admin-client");
let settings = {};

/**
 * Get client keycloak
 * @param {*} settings 
 */
var getClient = (settings) => {
    return new Promise((resolve, reject) => {
        //console.log(settings);
        return adminClient(settings)
            .then((client) => {
                return resolve(client);
            })
            .catch((err) => {
                err = "erreur admin client";
                return reject(err);
            });
    });
}

var getUserId = (client, realm, user) => {
    return new Promise((resolve, reject) => {
        return client.users.find(realm, user).then((user) => {
                return resolve(user);
            })
            .catch((err) => {
                return reject(err);
            });
    })
}

var setPwd = (client, realm, user) => {
    return new Promise((resolve, reject) => {        
       return client.users.resetPassword(realm, user.userId, {
                temporary: user.temporary || false,
                value: user.password
            })
            .then((res) => {
                console.log(res);
                return resolve();
            })
    });
}



var changePwd = (node, payload) => {
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
        realm = settings.realmName;

        return getClient(settings).then((client) => {           
            return getUserId(client, realm, payload).then((users) => {               
                payload.userId = users[0].id;
                console.log(payload);
                return setPwd(client, realm, payload).then(() => {
                    resolve({                        
                        message : "modification password effectuée",
                        success : true                    
                    });
                });
            });
        });
    }).catch((err) => {
        console.log(err);
        return reject(err);
    });

}

module.exports.changePwd = changePwd;