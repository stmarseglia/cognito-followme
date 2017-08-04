function ApiClient (cognitoAuth) {
    this.cognitoAuth = cognitoAuth;
}

ApiClient.prototype.callPatientApi = function() {

    var self = this;

    $.ajax(
        {
            url: 'https://1pbwvz80qj.execute-api.eu-west-1.amazonaws.com/api/echotest',
            method: 'GET',
            headers: {Authorization: self.cognitoAuth.idToken}
        })
        .then(function(data) {
            console.log(data);
        })
        .fail(function() {
            console.log('failed');
        });

    console.log("CALL PATIENT API");
}

ApiClient.prototype.callCaregiverApi = function() {

    var self = this;

    $.ajax(
        {
            url: 'https://urujp0lxhf.execute-api.eu-west-1.amazonaws.com/test/caregiver',
            method: 'GET',
            headers: {Authorization: self.cognitoAuth.idToken}
        })
        .then(function(data) {
            console.log(data);
        })
        .fail(function() {
            console.log('failed');
        });

    console.log("CALL CAREGIVER API");
}

ApiClient.prototype.callGet = function(path) {

    var self = this;

    $.ajax(
        {
            url: path,
            method: 'GET',
            headers: {
                Authorization: self.cognitoAuth.idToken,
                Accept: 'application/json'
            }
        })
        .then(function(data) {
            console.log(data);
        })
        .fail(function() {
            console.log('failed');
        });

    console.log("CALL CAREGIVER API");
}

ApiClient.prototype.callPost = function(path) {

    var self = this;

    var toSend = {"bodyparam": "bodyvalue"};

    $.ajax(
        {
            url: path,
            method: 'POST',
            contentType: 'application/json',
            headers: {
                Authorization: self.cognitoAuth.idToken,
                Accept: 'application/json'
            },
            data: JSON.stringify(toSend)
        })
        .then(function(data) {
            console.log(data);
        })
        .fail(function() {
            console.log('failed');
        });

    console.log("CALL POST API");
}

ApiClient.prototype.callPatientPostApi = function() {

    console.log("ONE");

    var self = this;

    $.ajax(
        {
            url: 'https://1pbwvz80qj.execute-api.eu-west-1.amazonaws.com/api/patients/updateparameter',
            method: 'POST',
            headers: {Authorization: self.cognitoAuth.idToken},
            contentType: "application/json",
            data: JSON.stringify({
                "key": "value"
            })
        })
        .then(function(data) {
            console.log(data);
        })
        .fail(function() {
            console.log('failed');
        });

    console.log("CALL patient POST API");
}