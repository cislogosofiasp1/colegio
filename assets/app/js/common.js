
// COMMON VARIABLES

var NOTICIAS = [];


// COMMON FUNCTIONS

var setNoticias = function(args={}) {
    /* Setar novo conjunto de notícias

    :arg noticias: (array) conjunto de notícias a ser setado
    */
    NOTICIAS = args.noticias;
}


var getNoticia = function(args={}) {
    /* Fornece dados de uma notícia

    :arg noticiaID: (int) número ID da notícia a ser retornada
    */
    return NOTICIAS[args.noticiaID];
}


var abrirNoticia = function(args={}) {
    /* Abrir noticia em janela modal

    :arg noticia: (json|opcional) dados da notícia a ser aberta
    :arg noticiaID: (int) número ID da notícia
    */
    if(args.hasOwnProperty('noticia'))
        var noticia = args.noticia;
    else
        var noticia = getNoticia({'noticiaID': args.noticiaID});

    noticiaModal.$titulo.html(noticia.titulo);
    noticiaModal.$corpo.html(noticia.corpo);
    noticiaModal.$e.modal('show');
}


// ELEMENTS

var noticiaModal = {
    $e: $('#modal-noticia'),
    $titulo: $('#modal-noticia').find('h5#noticia-title').eq(0),
    $corpo: $('#modal-noticia').find('div.modal-body').eq(0),
};


// EVENT LISTENERS

$('body').on('click.AbrirNoticia', 'a.abrir-noticia', function(e) {
    var $linkNoticia = $(this);
    var noticiaID = $linkNoticia.attr('noticia-id');

    abrirNoticia({'noticiaID': noticiaID});
});


// INITIALIZATION ROUTINES

$(document).ready(function() {
    noticiaModal.$e.modal({
        backdrop: true,
        keyboard: true,
        focus: true,
        show: false,
    });
});
