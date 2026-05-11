# OAuth and OIDC:

OAuth 2.0: a standard/protocol/framework that specifies how a third party application can get scoped access to resource(s) provided by an HTTP Service.
Abstract flow for it:
Client(3rd party app) redirects Resource Owner (Say end user) to Authorization Server
Resource Owner grants access, and redirects back to client with Authorization Code, which client uses to get Access Token
Using this access token, the client can communicate with the Resource Server (the HTTP Service)

Now, this is just for authorization. What can 3rd party app access. thats it.
And OIDC adds on top of it, an authentication layer. How? Since the resource can be any, in this case, it is the user's info itself.

For more details, can read RFC 6749, OIDC (OpenID Connect Standard)
