

var appModel = {
};


var loginModel = {
    user: undefined,
};


var controller = {

    /*** INITIALIZATION ***/

    init: () => {
        /* Initialization routines
        */
        var self = controller;

        // Load basic loginModel data
        var token = loginController.loadToken();
        if(token)
            loginModel.user = util.getUserFromToken(token);

        util.onPublicAppInit();

        // Render the UI Views
        appView.init();
    },

    getColegioNews: {

        exec: () => {
            /* Get news about Colégio Logosófico
            */
            var self = controller;

            API.getColegioNews();
        },

        callback: (newsItems) => {
            /* Receive news about Colégio Logosófico
            */
            var self = controller;

            appView.renderColegioNews(newsItems);
        },

    },
};


var appView = {

    initialized: false,

    content: {
        colegioNews: undefined,
    },

    init: () => {
        /* Initialize application main view
        */
        var self = appView;

        if(!self.initialized)
            self.initialized = true;

        self.loadElements();
        self.addListeners();
        self.renderColegioNews(self.content.colegioNews);
    },

    loadElements: () => {
        /* Load jQuery UI elements
        */
        var self = appView;

        self.$noticiasColegioContainer = $('div#noticias-colegio-container');
        self.templateNoticiaColegio = $('script#template-noticia-colegio').text();
    },

    addListeners: () => {
        /* Bind event listeners
        */
        var self = appView;
    },

    renderColegioNews: (news) => {
        /* Render news about Colégio Logosófico
        */
        var self = appView;

        var newsList = news || self.content.colegioNews;

        if(!newsList) {
            controller.getColegioNews.exec();
            return;
        }

        var newsList = util.arrayShuffle(newsList).slice(0, 4);

        var rows = [];

        newsList.forEach((newsItem, index) => {
            if(index % 2 == 0)
                rows.push($('<div class="row"></div>'));

            if(newsItem.fields.galeria_de_imagens.length > 0)
                var thumbnail = newsItem.fields.galeria_de_imagens[0].sizes.thumbnail;
            else
                var thumbnail = DEFAULT_THUMBNAIL_COLEGIO;

            var newsDate = new Date(newsItem.post_date);

            var newsHTML = util.fillTemplate({
                template: self.templateNoticiaColegio,
                data: {
                    id: newsItem.ID,
                    permalink: newsItem.permalink,
                    thumbnail: thumbnail,
                    title: newsItem.post_title,
                    summary: self.summarizeColegioNews(newsItem),
                    unidade: newsItem.unidade.name,
                    date: newsDate.getDate() +' '+ MONTH[newsDate.getMonth()],
                },
            });

            rows[rows.length-1].append($(newsHTML));
        });

        rows.forEach(($row) => { self.$noticiasColegioContainer.append($row) });
    },

    summarizeColegioNews: (newsItem) => {
        var maxLength = NOTICIA_COLEGIO_MAX_LENGTH - newsItem.post_title.length;
        return newsItem.post_content.substring(0, maxLength) + '...';
    },

};


$(document).ready(function() {
    var timer = setInterval(function() {
        if(typeof API !== 'undefined' && 
            typeof util !== 'undefined' && 
            typeof loginController !== 'undefined') {
            clearInterval(timer);
            controller.init();
        }
    }, 100);
});

