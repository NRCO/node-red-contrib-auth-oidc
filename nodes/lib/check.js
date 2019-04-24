var check = (node, msg) => {
    return new Promise((resolve, reject) => {
        return node.verifier.verify(node.accessToken, (err, jwt) => {
            if (err) {
                node.error(RED._('bad-access-token', err))
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'bad-access-token'
                });
                delete msg.payload;
                msg.error = err;
                msg.statusCode = 403;
                return reject(msg);
            };


            msg.access_token = jwt;
            //check role and client
            //console.log("client"  + msg.client);
            //console.log("jwt" + jwt.body.resource_access[msg.client]);
            if (node.client && !jwt.body.resource_access[msg.client]) {
                let err = 'Access error : client not found';
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: err
                });
                delete msg.payload;
                msg.error = err;
                msg.statusCode = 403;
                return reject(msg);
            }



            if (node.client && node.role && !jwt.body.resource_access[node.client].roles.includes(node.role)) {
                let err = 'Access error : role not found with client : ' + node.client;
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: err
                });
                delete msg.payload;
                msg.error = err;
                msg.statusCode = 403;
                return reject(msg);

            };

            if (!node.client && node.role) {
                for (var client in jwt.body.ressource_access) {
                    if (client.roles.includes(node.role)) {
                        break;
                    } else {
                        let err = 'Access error : role not found ';
                        node.status({
                            fill: 'red',
                            shape: 'ring',
                            text: err
                        });
                        delete msg.payload;
                        msg.error = err;
                        msg.statusCode = 403;
                        return reject(msg);
                    }
                }
            };
            resolve(msg);
        });
    });
}

module.exports.check = check;
