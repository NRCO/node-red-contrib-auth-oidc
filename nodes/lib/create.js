/**
 * Get client keycloak
 * @param {*} settings 
 */
this.getClient = (settings) => {
    return new Promise((resolve, reject) => {
        adminClient(settings)
            .then((client) => {
                return resolve(client);
            })
    });
}

/**
 * Get Group ID
 * @param {*} client 
 * @param {*} groupName 
 */
this.getGroupID = (client, groupName) => {
    return new Promise((resolve, reject) => {
        adminClient(settings)
            .then((client) => {
                //console.log(client);
                client.groups.find(realm)
                    .then((groups) => {
                        for (var i = 0; i < groups.length; i++) {
                            if (groups[i].name == groupName) {
                                return resolve(groups[i].id);
                            }
                        }
                        return reject('Group doesnt exist');
                    }).catch((err) => {
                        reject(err);
                    });
            })
    });
}

/**
 * Create user and add to group
 * @param {*} client 
 * @param {*} user 
 */
this.createUser = (client, user) => {
    return new Promise((resolve, reject) => {
        client.users.create(realm, user)
            .then((user) => {
                console.log('user created');
                resolve(user);
            }).catch((err) => {
                reject(err);
            });
    });
}




var create = (params) => {
    return getClient(settings).then((client) => {
        return getGroupID(client, this.groupName).then((groupId) => {
            return createUser(client, userToCreated).then((user) => {
                client.groups.join(this.realm, user.id, groupId)
                .then(() =>{
                    resolve(user);
                })                
                .catch((err) => {
                   reject(err);
                });
            });
        });
    }).catch((err) => {
        console.log(err);
    });
}

module.exports.create = create;