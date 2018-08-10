# node-red-contrib-auth-oidc

[Node-RED][nodered] node to use OpenID and Keycloak operation


## Install

Run the following command in the root directory of your Node-RED install

```bash
npm install node-red-contrib-auth-oidc
```

## Usage

You have to configure the node by setting the discovery URL of you OpenID
Connect provider.

For example the discovery URL of Google is:
https://accounts.google.com/.well-known/openid-configuration

  <p>
    This node is used to get some basic api keycloak functions
  <p>
    <li><b>Parameters are :</b>
      <ul>
        <li>Discovery : ex : https://auth.fr/auth/realms/myrealm/.well-known/openid-configuration </li>
        <li>Client : Name of client </li>
        <li>Secret : Credential secret of your client </li>
        <li>Realm : Name of your realm </li>
        <li>Auth : https://auth.fr/auth </li>
        <li>Url Auth : https://auth.fr/auth </li>
        <li>Admin : admin name </li>
        <li>Admin password</li>
      </ul>
    </li>
  </p>
  <p>
    <li><b>Operations are : </b>
      <ul>
        <li>Get Auth : Used to get a refresh token which is stored into <code>msg.access_token</code> and headers in order to be able to call http with authorization  </li>
        <li>Create : Used to create a new user and associate him to a group. Ex payload : <code>{"username":"test17","email":"test17@fr","enabled":true,"groupName":"editeur"}</code>  </li>
        <li>Change Password: Used to change the actual password for a username. Ex playload <code>{"username":"test17","password":"ok"}</code></li>
        <li>Check auth : Used to check if the caller is able to start the flow. Node must be placed just after http in. You can filter with role and client input parameters</li>
      </ul>
    </li>
  </p>  
