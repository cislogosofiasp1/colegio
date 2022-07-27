

var loginModel = {
    user: undefined,
    token: localStorage.getItem('token'),
};


var loginController = {

    /*** INITIALIZATION ***/

    init: () => {
        /* Initialization routines
        */
        var self = loginController;

        // Load basic loginModel data
        var token = self.loadToken();
        if(token)
            loginModel.user = util.getUserFromToken(token);

        util.onAppInit();

        // Render the UI Views
        loginContext.init();
        if(loginContext.$contextName == 'public-front-page')
            loginView.init();
    },


    /*** AUTHENTICATION ***/

    loadToken: () => {
        /* Provide token

        :return: (str) auth token
        */
        var self = loginController;

        return loginModel.token;
    },

    loadUser: () => {
        /* Provide user data

        :return: (json) user data
        */
        var self = loginController;

        return loginModel.user;
    },

    persistToken: (newToken) => {
        /* Update the authentication token and user data in localStorage

        :attr token: (str) authentication token
        */
        localStorage.token = newToken;
        loginModel.token = newToken;
        loginModel.user = util.getUserFromToken(newToken);
    },

    clearToken: function() {
        /* Clear token and user data from loginModel and localStorage
        */
        loginModel.token = null;
        loginModel.user = null;
        localStorage.removeItem('token');
    },

    validateLogin: {

        exec: (loginData) => {
            /* Validate user login

            :loginData: (json) contains:
                .cpf (int) user CPF
                .password (str) user password
                .remember (bool) whether to store locally the login token
            */
            var self = loginController;

            // Check fields values
            var checkLogin = util.checkFormFields(loginData, FORM_VALIDATE.login);
            if(!checkLogin.valid)
                loginView.renderMsg(API_CODES.error, checkLogin.errors[0].msg);
            else
                API.validateLogin(loginData);
        },

        callback: (response) => {
            /* Callback to parse server response from validate login function

            :response: (json) server response object
            */
            var self = loginController;

            loginView.renderMsg(response.code, response.data.message);

            if(response.code == API_CODES.success) {
                // Persist auth token
                self.persistToken(response.data.new_token);

                // Redirect user
                window.location.href = LOCAL_BASE_URL + '/interno/index.html';
            }
        },

    },

};


var loginContext = {

    initialized: false,

    $contextName: null,

    init: () => {
        /* Run initialization routines
        */
        var self = loginContext;

        if(self.initialized)
            return;

        self.initialized = true;

        self.loadElements();
    },

    loadElements: () => {
        // Load jQuery elements
        var self = loginContext;

        self.$contextName = $('code#login-context').text();
    },

};


var loginView = {

    initialized: false,

    bindListener: {},

    init: () => {
        /* Run initilization routines
        */
        var self = loginView;

        if(self.initialized)
            return false;

        self.initialized = true;

        self.loadElements();
        self.addListeners();
        self.render();
    },

    render: () => {
        /* Rendering routines
        */
        var self = loginView;

        self.form.msg.$all.hide();
    },

    loadElements: () => {
        /* Load jQuery elements
        */
        var self = loginView;

        var $form = $('form#login-modal');

        self.form = {
            $container: $form,
            $submitBtn: $form.find('button'),
            field: {
                $cpf: $form.find('input[name=cpf]'),
                $password: $form.find('input[name=password]'),
                // $remember: $form.find('input[name=remember]')
            },
            msg: {
                $all: $form.find('p.form-msg'),
                success: {
                    $container: $form.find('p.success'),
                    $icon: $form.find('p.success > i'),
                    $text: $form.find('p.success > strong')
                },
                failed: {
                    $container: $form.find('p.failed'),
                    $icon: $form.find('p.failed > i'),
                    $text: $form.find('p.failed > strong')
                }
            }
        };
    },

    addListeners: () => {
        /* Bind event listeners to elements
        */
        var self = loginView;

        self.form.$submitBtn.on('click', function(e) {
            e.preventDefault();
            var self = loginView;

            self.form.msg.$all.hide();

            loginController.validateLogin.exec({
                cpf: self.form.field.$cpf.val(),
                password: self.form.field.$password.val(),
                // remember: self.form.field.$remember.is(':checked') ? 1 : 0
            });
        });
    },

    renderMsg: (status, messageStr) => {
        /* Render a login message on the UI

        :status: (str) whether the login failed or succeeded
        :messageStr: (str) a text message to display to the end user
        */
        var self = loginView;

        // Hide all messages first
        self.form.msg.$all.hide();

        var messageElem = status == API_CODES.success ? self.form.msg.success : 
            self.form.msg.failed;

        // Display the message
        messageElem.$text.html(messageStr);
        messageElem.$container.show();
    },

};


$(document).ready(function() {
    var timer = setInterval(function() {
        if(typeof API !== 'undefined' && 
            typeof util !== 'undefined') {
            clearInterval(timer);
            loginController.init();
        }
    }, 100);
});
