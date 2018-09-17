const adminClient = require("keycloak-admin-client");
let settings = {};
/**
 * Get client keycloak
 * @param {*} settings 
 */
var getClient = (settings) => {
    return new Promise((resolve, reject) => {
        console.log(settings);
        adminClient(settings)
            .then((client) => {
                console.log(client);
                return resolve(client);
            })
            .catch((err) => {
                err = "erreur admin client";
                return reject(err);
            });
    });
}



/**
 * Create user and add to group
 * @param {*} client 
 * @param {*} user 
 */
var removeUser = (client, userId, realm) => {
    return new Promise((resolve, reject) => {
        console.log('user deletion');
        console.log(user);
        return client.users.remove(realm, userId)
            .then((user) => {
                console.log('user deleted');
                return resolve(user);
            }).catch((err) => {
                return reject(err);
            });
    });
}




var remove = (node, userId) => {
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
        return getClient(settings).then((client) => {
            return removeUser(client, userId, settings.realmName).then((user) => {
                return resolve(user);
            });
        }).catch((err) => {
            console.log(err);
            return reject(err);
        });
    });
}

module.exports.remove = remove;