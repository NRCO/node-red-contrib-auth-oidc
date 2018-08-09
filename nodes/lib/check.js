var check = (params) => {
    return this.verifier.verify(accessToken, (err, jwt) => {
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
            return;
        };


        msg.access_token = jwt;
        //check role and client    

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
            return;
        }



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
            return;

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
                    return;
                }
            }
        };

    });
}

module.exports.check = check;