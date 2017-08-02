function CognitoWrapper(options) {
    this.region = options.region;
    this.identityPoolId = options.identityPoolId;
    this.userPoolId = options.userPoolId;
    this.clientId = options.clientId;
    this.userPool;
    this.cognitoUser;
    this.cognitoIdp;

    this.init();
}

CognitoWrapper.prototype.init = function() {

    var self = this;

    AWS.config.region = this.region;
    this.initCognito();
}

CognitoWrapper.prototype.initCognito = function() {

    var self = this;

    var deferred = $.Deferred();

    /* AWS COGNITO */
    AWSCognito.config.region = this.region;

    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: self.identityPoolId
    });

    var poolData = {
        UserPoolId : this.userPoolId, // your user pool id here
        ClientId : this.clientId // your app client id here
    };
    this.userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);

    this.cognitoUser = this.userPool.getCurrentUser();

    if (this.cognitoUser!=null) {
        this.cognitoUser.getSession(function(err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                self.setCognitoCredentials(data.getIdToken().getJwtToken());

                self.idToken = data.getIdToken().getJwtToken();

                self.getCognitoID().then(function(data) {
                    if (self.cognitoIdp==null) self.cognitoIdp = new AWS.CognitoIdentityServiceProvider();
                    deferred.resolve(data);
                })
                    .fail(function(err) {
                        deferred.reject(err);
                    });
            }
        });
    }
    return deferred.promise();
}

CognitoWrapper.prototype.signin = function(username, password) {

    var self = this;
    var deferred = $.Deferred();

    var authenticationData = {
        Username : username,
        Password : password,
    };
    var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);

    this.userData = {
        Username : username, // your username here
        Pool : this.userPool
    };

    this.cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(self.userData);
    self.cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            console.log('access token + ' + result.getAccessToken().getJwtToken());
            self.setCognitoCredentials(result.getIdToken().getJwtToken());
            self.idToken = result.getIdToken().getJwtToken();
            test = result;
            self.getCognitoID().then(function(data) {
                if (self.cognitoIdp==null) self.cognitoIdp = new AWS.CognitoIdentityServiceProvider();
                deferred.resolve({status: "done", data: data});
            })
        },

        onFailure: function(err) {
            alert(err);
            deferred.reject(err);
        },
        mfaRequired: function(codeDeliveryDetails) {},
        newPasswordRequired: function(userAttributes, requiredAttributes) {
            deferred.resolve({status: "change_temporary_password"});
        }
    });
    return deferred.promise();
}

CognitoWrapper.prototype.changeFirstTimePassword = function(password) {

    var deferred = $.Deferred();

    var self = this;

    this.cognitoUser.completeNewPasswordChallenge(password, null, {
        onSuccess: function (result) {
            console.log('access token + ' + result.getAccessToken().getJwtToken());
            self.setCognitoCredentials(result.getIdToken().getJwtToken());
            self.getCognitoID().then(function(data) {
                if (self.cognitoIdp==null) self.cognitoIdp = new AWS.CognitoIdentityServiceProvider();
                deferred.resolve(data);
            })
        },

        onFailure: function(err) {
            alert(err);
            deferred.reject(err);
        }
    });
    return deferred.resolve();
}

CognitoWrapper.prototype.getCognitoID = function() {
    var deferred = $.Deferred();

    // Get Cognito ID
    AWS.config.credentials.get(function (err) {
        if (err) {
            var errorMessage = "";
            errorMessage += "credentials.get: " + err, err.stack + "_____";
            errorMessage += "AWS.config.credentials: " + AWS.config.credentials + "_____";
            deferred.reject(errorMessage);
        } else {
            var message = "";
            message += "Cognito Identity Id: " + AWS.config.credentials.identityId + "_____";
            deferred.resolve(AWS.config.credentials.identityId);
        }
    });
    return deferred.promise();
};

CognitoWrapper.prototype.setCognitoCredentials = function(token) {
    var logins={};
    logins['cognito-idp.' + this.region + '.amazonaws.com/' + this.userPoolId] = token;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: this.identityPoolId,
        Logins: logins
    });
}

CognitoWrapper.prototype.globalSignout = function() {

    var deferred = $.Deferred();

    var self = this;

    if (this.cognitoUser!=null) {
        this.cognitoUser.globalSignOut({
            onSuccess: function(result) {
                self.cognitoUser = null;
                self.clearAwsCreds();
                deferred.resolve(result);
            },
            onFailure: function(err) {
                deferred.reject(err);
            }
        });
    } else {deferred.reject("User has not signed in");}
    return deferred.promise();
}

CognitoWrapper.prototype.signout = function() {

    if (this.cognitoUser!=null) {
        this.cognitoUser.signOut();
        this.clearAwsCreds();
    }
}

CognitoWrapper.prototype.clearAwsCreds = function() {
    AWS.config.credentials.clearCachedId();
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({IdentityPoolId: this.identityPoolId});
}

CognitoWrapper.prototype.signup = function(username, password, attributes) {
    var self = this;
    var attributeList = [];
    var deferred = $.Deferred();

    for (attribute in attributes) {

        var newAttribute = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute({
            Name : attribute,
            Value : attributes[attribute] // your email here
        });

        attributeList.push(newAttribute);
    }

    this.userPool.signUp(username, password, attributeList, null, function(err, result){
        if (err) {
            console.log(err);
            deferred.reject(err);
        } else {
            console.log(result);
            self.cognitoUser = result.user;
            console.log('user name is ' + self.cognitoUser.getUsername());
            deferred.resolve();
        }

    });

    return deferred.promise();
}

CognitoWrapper.prototype.confirmUser = function(code) {
    var deferred = $.Deferred();
    this.cognitoUser.confirmRegistration(code, true, function(err, result) {
        if (err) {
            alert(err);
            deferred.reject();
        } else {
            console.log('call result: ' + result);
            deferred.resolve();
        }
    });
    return deferred.promise();
}

CognitoWrapper.prototype.forgotPassword = function() {
    var deferred = $.Deferred();

    if (this.cognitoUser != null) {
        this.cognitoUser.forgotPassword({
            onSuccess: function (result) {
                deferred.resolve(result);
            },
            onFailure: function (err) {
                deferred.reject(err);
            },
            inputVerificationCode: function (result) {
                deferred.resolve(result);
            }
        });
    } else {
        deferred.reject("No Such User");
    }
    return deferred.promise();
}

CognitoWrapper.prototype.forcePasswordChange = function(username) {

    var deferred = $.Deferred();

    var parameters = {
        UserPoolId: this.userPoolId, /* required */
        Username: username /* required */
    };

    this.cognitoIdp.adminResetUserPassword(parameters,function(err,data) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(data);
        }
    });

    return deferred.promise();
}

CognitoWrapper.prototype.confirmPassword = function(verificationCode, newPassword) {
    var deferred = $.Deferred();

    if (this.cognitoUser != null) {
        this.cognitoUser.confirmPassword(verificationCode, newPassword, {
            onSuccess: function (result) {
                deferred.resolve(result);
            },
            onFailure: function (err) {
                deferred.reject(err);
            }
        });
    } else {
        deferred.reject("No Such User");
    }
    return deferred.promise();

}

CognitoWrapper.prototype.isAuthenticated = function() {
    if (this.cognitoUser != null)
        return true;
    return false;
};



/********************** ADMIN FUNCTIONS *********************/
CognitoWrapper.prototype.listUsers = function(username) {

    var deferred = $.Deferred();

    var parameters = {
        UserPoolId: this.userPoolId
    };

    this.cognitoIdp.listUsers(parameters,function(err,data) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(data);
        }
    });

    return deferred.promise();
}

// options = {
//     verifyBy: 'SMS | EMAIL',
//     autoVerify: true | false
// }
CognitoWrapper.prototype.adminCreateUser = function(username,tempPassword,verifyBy,attributes,options) {

    if (options==undefined) options = {};
    if (verifyBy==undefined) throw new Error('You must set "verifyBy" either to "SMS" or "EMAIL"');
    if (username==undefined) throw new Error('You must specify an username');
    if (tempPassword==undefined) throw new Error('You must specify a temporary password');
    if (options.autoVerify==undefined || typeof(options.autoVerify)!='boolean') options.autoVerify = false;

    var deferred = $.Deferred();

    var attributesToSend = [];

    if (verifyBy=='SMS') {
        var phoneNum = attributes.filter(function(item) {return item.Name=='phone_number'});
        if (phoneNum.length==0) throw new Error('If you choose SMS as validation medium you must include "phone_number" in user attributes');
        if (options.autoVerify == true) attributesToSend.push({Name: 'phone_number_verified', Value: 'true'});
    } else if (verifyBy=='EMAIL') {
        var email = attributes.filter(function(item) {return item.Name=='email'});
        if (email.length==0) throw new Error('If you choose email as validation medium you must include "email" in user attributes');
        if (options.autoVerify == true) attributesToSend.push({Name: 'email_verified', Value: 'true'});
    }

    attributes.forEach(function(item) {
        attributesToSend.push(item);
    });

    var params = {
        UserPoolId: this.userPoolId,
        Username: username,
        DesiredDeliveryMediums: [verifyBy],
        TemporaryPassword: tempPassword,
        UserAttributes: attributesToSend,
    };

    console.log(attributesToSend);

    this.cognitoIdp.adminCreateUser(params,function(err,data) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(data);
        }
    });
    return deferred.promise();
}

CognitoWrapper.prototype.deleteUser = function(username) {

    var deferred = $.Deferred();

    var parameters = {
        UserPoolId: this.userPoolId,
        Username: username
    };

    this.cognitoIdp.adminDeleteUser(parameters,function(err,data) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(data);
        }
    });

    return deferred.promise();
}

CognitoWrapper.prototype.adminGetUser = function(username) {

    var deferred = $.Deferred();

    var parameters = {
        UserPoolId: this.userPoolId, /* required */
        Username: username /* required */
    };

    this.cognitoIdp.adminGetUser(parameters,function(err,data) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(data);
        }
    });

    return deferred.promise();
}

CognitoWrapper.prototype.adminListGroupsForUser = function(username) {

    var deferred = $.Deferred();

    var parameters = {
        UserPoolId: this.userPoolId,
        Username: username
    };

    this.cognitoIdp.adminListGroupsForUser(parameters,function(err,data) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(data);
        }
    });

    return deferred.promise();
}

CognitoWrapper.prototype.addUserToGroup = function (username,group) {

    var deferred = $.Deferred();

    var params = {
        GroupName: group,
        UserPoolId: this.userPoolId,
        Username: username
    };
    this.cognitoIdp.adminAddUserToGroup(params, function(err, data) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(data);
        }
    });

    return deferred.promise();
}

CognitoWrapper.prototype.removeUserFromGroup = function (username,group) {

    var deferred = $.Deferred();

    var params = {
        GroupName: group,
        UserPoolId: this.userPoolId,
        Username: username
    };
    this.cognitoIdp.adminRemoveUserFromGroup(params, function(err, data) {
        if (err) {
            deferred.reject(err);
        }
        else {
            deferred.resolve(data);
        }
    });

    return deferred.promise();
}