
/* ======= API Endpoint Handlers ======= */

var API = {

    loadHTMLContent: function(url, page, target, onSuccess, onNotFound, onError,
        onNotAuthorized) {
        req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onreadystatechange = function (oEvent) {
            if (req.readyState === 4) {
                if(req.status === 200) {
                    if(onSuccess)
                        onSuccess(target, page, req.responseText);
                } else if (req.status === 404) {
                    if(onNotFound)
                        onNotFound(target, req.responseText);
                } else {
                    if(onError)
                        onError(target, req.responseText)
                }
            }
        };
        req.send(null);
    },

    validateLogin: function(data) {
        var connSettings = {
            contentType: 'application/x-www-form-urlencoded; charset=utf-8',
            endpoint: '/validateLogin',
            type: 'POST',
            data: data,
            notify: false,
            notifyError: false,
            pleaseWait: false,
            loaderBar: false
        };

        Ajax.connect(connSettings, false, function(response) {
            loginController.validateLogin.callback(response);
        });

        return true;
    },

    internalEndpoint: function(data) {
        var connSettings = {
            endpoint: '/internalEndpoint',
            headers: {
                'Authorization': loginController.getToken()
            },
            type: 'POST',
            data: JSON.stringify(data),
            notify: false,
            notifyError: true,
            pleaseWait: false,
            loaderBar: true
        };

        Ajax.connect(connSettings, false, function(response) {
            loginController.internalEndpoint.callback(response);
        });

        return true;
    },

    loadPageContent: (args) => {
        /* Load UI page content
        */
        var self = API;

        var connSettings = {
            endpoint: '/loadPageContent',
            headers: {
                'Authorization': loginController.loadToken(),
            },
            type: 'POST',
            data: JSON.stringify(args),
            notify: false,
            notifyError: false,
            pleaseWait: false,
            loaderBar: false,
        };

        Ajax.connect(connSettings, false, function(response) {
            args.response = response;
            appController.loadPageContent.callback(args);
        });

        return true;
    },

    getColegioNews: (args) => {
        /* Get news about Colégio Logosófico
        */
        if(ENV == 'local') {
            controller.getColegioNews.callback(NOTICIAS_COLEGIO_DUMMY);
            return;
        }

        var self = API;

        var connSettings = {
            endpoint: 'https://www.colegiologosofico.com.br/api/last-news',
            contentType: 'text/plain', // Avoid OPTIONS pre-flight requests
            overrideBaseUrl: true,
            type: 'GET',
            notify: false,
            notifyError: false,
            pleaseWait: false,
            loaderBar: false,
        };

        Ajax.connect(connSettings, false, function(response) {
            controller.getColegioNews.callback(response);
        });

        return true;
    },

};


/* ======= AJAX ======= */

var Ajax = {

    apixhr: false,

    defaultArgs: {
        overrideBaseUrl: false,
        contentType: 'application/json;charset=UTF-8',
        type: 'POST',
        dataType: 'json',
        notify: false,
        notifyError: true,
        pleaseWait: false,
        loaderBar: false,
        headers: null
    },

    connect: function(d={}, abort=true, callback=false) {
        /* Execute an Ajax call

        :attr d: (obj) request arguments to be used in the Ajax connection
        :attr abort: (bool) whether Ajax should terminate previous calls and 
            terminete this one if another is fired subsequently
        :attr callback: (function) the callback function that should be called
            passing the response
        */
        var self = Ajax;

        // Indicate the request is being processed in the UI
        if(self.getArg('pleaseWait', d) == true)
            util.pleaseWait();
        if(self.getArg('loaderBar', d) == true)
            util.loaderBar(true);

        // Abort previous connections before sending this one
        if(abort)
            self.abort();

        // Get ajax parameters
        var connectionArgs = self.getConnectionArgs(d, callback);

        // Run the Ajax call
        var ajaxCall = $.ajax(connectionArgs);

        // Keep track of the request to abort it later, if necessary
        if(abort)
            self.apixhr = ajaxCall;
    },

    getConnectionArgs: function(d, callback) {
        /* Generate arguments to be used in the Ajax call

        :param d: (obj) request arguments to be used in the Ajax connection
        :param callback: (function) the callback function that should be called
            passing the response
        */
        var self = Ajax;

        var notify = self.getArg('notify', d);
        var notifyError = self.getArg('notifyError', d);
        var loaderBar = self.getArg('loaderBar', d);

        // Prepare connection arguments
        var connArgs = {
            url: API_BASE_URL + d.endpoint,
            data: d.data,
            contentType: self.getArg('contentType', d),
            type: self.getArg('type', d),
            dataType : self.getArg('dataType', d),
            success: function(response) {
                self.onSuccess(response, callback, notify, notifyError,
                    loaderBar);
            },
            error: function(xhr, status, errorThrown) {
                self.onHTTPError(xhr, status, errorThrown);
            }
        };

        if(d.overrideBaseUrl)
            connArgs.url = d.endpoint;

        // Add HTTP Headers
        headers = self.getArg('headers', d);
        if(headers)
            connArgs.headers = headers;

        return connArgs;
    },

    onSuccess: function(response, callback, notify, notifyError, loaderBar) {
        /* Handler for successful responses

        :param response: (obj) the response object returned by the API endpoint
        :param callback: (function) the callback function that should be called
            passing the response
        :param notify: (bool) whether it should notify the user of result
        :param notifyError: (bool) whether it should notify the user of an error
        */
        // Close any messages still open in the UI
        util.closeAllMsg();

        if(response.hasOwnProperty('code') && response.hasOwnProperty('data')) {
            // Prepare message to the user according to response
            var responseCode = util.capitalizeFirst(response.code);
            var status = responseCode == API_CODES.success ? 'success' : 'error';
            var message = response.data.message ? response.data.message : 
                API_NOTIFY[status].message[response.endpoint];

            // Display message to the user
            if(notify == true) {
                util.msg({
                    message : message,
                    status  : API_NOTIFY[status].status,
                    timeout : API_NOTIFY[status].timeout,
                    pos     : API_NOTIFY[status].position
                });
            } else if(status == 'error' && notifyError == true) {
                util.msg({
                    message : message,
                    status  : API_NOTIFY[status].status,
                    timeout : API_NOTIFY[status].timeout,
                    pos     : API_NOTIFY[status].position
                });
            }

            // Persist new token
            if(response.data.hasOwnProperty('new_token'))
                loginController.persistToken(response.data.new_token);
        }

        if(loaderBar == true)
            util.loaderBar(false, 500);

        if(callback)
            callback(response);
    },

    onHTTPError: function(xhr, status, errorThrown) {
        /* Handler for HTTP errors

        :attr xhr: (obj) the jqXHR object
        :attr statis: (str) error status could be null, timeout, error, abort,
            parsererror
        :attr errorThrown: (str) exception with portion of the HTTP status text
        */
        // Ignore if the connection was aborted by the application
        if(status == 'abort') return false;

        // Clear all UI notifications and loaders
        util.clearAllNotifications();

        // Prepare response message
        var response = JSON.parse(xhr.responseText);
        var message = API_NOTIFY.error.message.default;
        if(xhr.status == 403)
            message = API_NOTIFY.error.message.unauthorized;

        // Log errors in the console
        console.error('Status: '+ status);
        console.error('HTTP status: '+ errorThrown);
        console.error('Response:');
        console.dir(response);
        console.error('xhr object:');
        console.dir(xhr);

        // Display error message to the user
        util.msg({
            message : message,
            status  : API_NOTIFY.error.status,
            timeout : API_NOTIFY.error.timeout,
            pos     : API_NOTIFY.error.position
        });
    },

    getArg: function(arg, d) {
        /* Return a custom value to the argument, or the default value

        :attr arg: (str) name of the argument
        :attr d: (obj) request arguments
        */
        var self = Ajax;
        return d.hasOwnProperty(arg) ? d[arg] : self.defaultArgs[arg];
    },

    abort: function() {
        /* Abort previous connections before sending a new one
        */
        var self = Ajax;
        if(self.apixhr && self.apixhr.readyState != 4)
            self.apixhr.abort();
    },

    logError: function(user, status, error, response) {

        $.ajax({
            url: LOG_BASE_URL + '/logError',
            data: {
                user: user,
                status: status,
                error: error,
                response: response
            },
            type: "POST",
            dataType : "text",
            success: function( response ) {},
        });
    }

}
