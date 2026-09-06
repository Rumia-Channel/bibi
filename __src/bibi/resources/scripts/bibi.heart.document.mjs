// Heart of Bibi — Document-Defined Settings (split from bibi.heart.js; peers via shared context, no cycles)

import { Bibi, D } from './bibi.heart.context.mjs';

//==============================================================================================================================================
//----------------------------------------------------------------------------------------------------------------------------------------------

//-- Document-Defined Settings (Bookshelf, Book, Book-Data)

//----------------------------------------------------------------------------------------------------------------------------------------------




D.at1st = () => {
    const RE = /^[_\-\w\d]+(\.[_\-\w\d]+)*$/;
    const PresetValue = Bibi.Script.getAttribute('data-bibi-preset');
    if(PresetValue && RE.test(PresetValue)) D['preset'] = PresetValue;
    const DressValue  = Bibi.Style.getAttribute('data-bibi-dress');
    if( DressValue && RE.test(DressValue) ) D['dress']  = DressValue;
    const BookshelfValue = document.body.getAttribute('data-bibi-bookshelf');
    if(BookshelfValue) D['bookshelf'] = new URL(BookshelfValue, location.href.split('?')[0]);
    const BookValue = document.body.getAttribute('data-bibi-book');
    if(BookValue) D['book'] = BookValue;
    const BookDataElement = document.getElementById('bibi-book-data');
    if(BookDataElement) {
        const BookData = BookDataElement.innerText.trim();
        if(BookData) {
            const BookDataMIMEType = BookDataElement.getAttribute('data-bibi-book-mimetype');
            if(/^application\/(epub\+zip|zip|x-zip(-compressed)?)$/i.test(BookDataMIMEType)) {
                D['book-data']          = BookData;
                D['book-data-mimetype'] = BookDataMIMEType;
            }
        }
        BookDataElement.innerHTML = '';
        BookDataElement.parentNode.removeChild(BookDataElement);
    }
    delete D.at1st;
};


D.initialize = () => {
    if(D['book-data'] || D['book']) {
        // delete U['book'];
        let HRef = location.href.replace(/([\?&])book=[^&]*&?/, '$1');
        if(!HRef.split('?')[1]) HRef = HRef.split('?')[0];
        history.replaceState(null, document.title, HRef);
    }
    delete D.initialize;
};




