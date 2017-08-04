/**
 * Created by Stefano on 11/11/2016.
 */

function Main() {

    this.$debugText = $("#debug-msg");

    this.client;

    this.init();
    this.bindEvents();
}

Main.prototype.init = function() {
    this.cognitoAuth = new CognitoWrapper (
        {
            'region': 'eu-west-1',
            'identityPoolId': 'eu-west-1:4a7a2357-1d3f-487e-9eef-5ac19f0d5d1d',
            'userPoolId': 'eu-west-1_eAnVqYkws',
            'clientId': 'd40f124ip323v8hetis7c6bdj'
        }
    );
    this.logAuthentication();

    this.client = new ApiClient(this.cognitoAuth);

    $('#get-url').val('https://1pbwvz80qj.execute-api.eu-west-1.amazonaws.com/api/followmebackend/webresources/ro.siveco.followme.followmebackend.patients');
    $('#post-url').val('https://1pbwvz80qj.execute-api.eu-west-1.amazonaws.com/api/followmebackend/path/test?param=value');
}

Main.prototype.bindEvents = function() {

    var self = this;

    $("#signin").click(function () {
        self.cognitoAuth.signin($("#username").val(),$("#password").val())
            .then(function() {
                self.logAuthentication();
            });
    });

    $("#signup").click(function () {
        self.cognitoAuth.signup($("#username").val(),$("#password").val(),{'email': $("#email").val()});
    });

    $("#query").click(function () {
        $.proxy(self.query,self)();
    });

    $("#globalLogout").click(function () {
        self.cognitoAuth.globalSignout()
            .then(function(success) {
                self.logAuthentication();
            })
            .fail(function(message) {
                self.log(message)
            });
    });

    $("#logout").click(function () {
        self.cognitoAuth.signout();
    });

    $("#confirm").click(function () {
        self.cognitoAuth.confirmUser($("#code"));
    });

    $("#get-btn").click(function() {
        self.client.callGet($('#get-url').val());
    });

    $("#post-btn").click(function() {
        self.client.callPost($('#post-url').val());
    });


}

Main.prototype.log = function(message) {
    this.$debugText.val(message);
    this.$debugText.fadeOut().fadeIn();
}

Main.prototype.logAuthentication = function() {
    if (this.cognitoAuth.isAuthenticated()) {
        this.log("User is authenticated as " + this.cognitoAuth.cognitoUser.username);
    } else {
        this.log("User is not authenticated");
    }
}
