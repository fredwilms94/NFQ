// Mon, 30 Jul 2018 14:57:47 GMT : 1U1_DBTX_18_001
/* eslint-disable no-magic-numbers */
/* global */

// NFQ DynamicAds module
/************************************************************
 * NFQ DynamicAds module
 */
var NFQDA = (function() {
    'use strict';

    var my = {};
    var wf, s, r = false;

    my.NFQBanners = {};

    // jQuery plugin refs
    my.fontSpy;

    // timestamp only for debugging output
    my.timeStmp = new Date().getTime();

    window.NFQDA = my;

    my.jqReady = false;

    // async load jquery from google, set flag when loaded
    wf = document.createElement('script');
    wf.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js';
    wf.type = 'text/javascript';
    wf.async = true;
    wf.onload = wf.onreadystatechange = function() {
        if (!r && (!this.readyState || this.readyState === 'complete')) {
            r = true;
            my.jqReady = true;
        }
    };
    s = document.getElementsByTagName('head')[0];
    s.appendChild(wf, s);

    return my;
}(NFQDA || {}));

/* ***********************************************************
 * Augmentation modules
 * order of include is important
 */

// common functions module
/* global */

/************************************************************
 * common functions module
 * should only contain general functions needed for all lines
 * comment functions which are not needed
 */
var NFQDA = (function(my) {
    'use strict';

    /**
     * fixRelImgUrl - fix the product image url in case it is relative
     * @param {string} url - url of image
     * @returns {string} fixed url
     */
    my.fixRelImgUrl = function(url) {
        if (url === null || url === '' || (/^(.*\.(?!(jpg|jpeg|png|gif|svg)$))?[^.]*$/i).test(url)) {
            return '';
        }
        if (url.indexOf('http') !== 0) { // eslint-disable-line no-magic-numbers
            return my.api.getImageBaseUrl() + url;
        }

        return url;
    };


    /**
     * getTmplAttr - try catch template attribute via api
     * @param {string} attr - attribute name
     * @param {[string, number, boolean]} def - default, can be variable name or value
     * @param {string} type - type of template attribute
     */
    my.getTmplAttr = function(attr, def, type) {
        var t;

        try {
            t = my.api.getTemplateAttribute(attr);
        } catch (e) {
            t = null;
            my.debugAttrWarn(attr, 1); // eslint-disable-line no-magic-numbers
        }

        switch (type) {
        case 'string':
            my[attr] = t || def || '';
            break;
        case 'url':
            t = my.fixRelImgUrl(t);
            my[attr] = t || def || '';
            break;
        case 'boolean':
            if (t === 1) { // eslint-disable-line no-magic-numbers
                t = '1';
            }
            if (t === null && def === true) {
                t = '1';
            }
            my[attr] = (t === '1');
            break;
        case 'number':
            my[attr] = t ? parseInt(t, 10) : def || 0; // eslint-disable-line no-magic-numbers
            break;
        // no default
        }
    };


    /**
     * getProdAttr - put product attributes from productAttributeCollection into product
     * productAttributeCollection comes as object with objects, not as array!!!
     * @param {object} p - reference to product
     */
    my.getProdAttr = function(p) {
        var i, v, n;
        var a = p.productAttributeCollection;

        // put attributes into product
        for (i in a) {
            n = a[i].name;
            v = a[i].value;
            p[n] = v;

            // Retargeting: collect product attributes with format suffix
            // and put value in new product attribute without format suffix
            switch (n) {
            case 'lk01HlTxt_' + my.bannerFormat:
                p.lk01HlTxt = v;
                break;
            // no default
            }
        }
    };


    /**
     * setClkBtn - put aditions product clickhandler
     * @param {object} p - product reference
     */
    my.setClkBtn = function(p) {
        my.clickButton.click(p.getClickHandler('_blank'));
    };


    /**
     * setClkBtnCstm - put aditions custom clickhandler
     * @param {type} url custom url to open
     * @param {type} name name of url
     */
    my.setClkBtnCstm = function(url, name) {
        my.clickButton.click(my.api.getCustomClickHandler(url, name, '_blank'));
    };


    /**
     * addIntroLook - adds an intro look
     */
    my.addIntroLook = function() {
        my.numAllLooks++;
        // prepend intro to looks
        my.looks.unshift('intro');
        // add to loop time for gdn
        my.loopTime += my.introTime;
        my.tilLastLookTime += my.introTime;
    };

    /**
     * addLook - adds other look
     * @param {string} n - name of look
     * @param {number} t - time of look
     */
    /*my.addLook = function(n, t) {
        my.numAllLooks++;
        // append to looks
        my.looks.push(n);
        // add to loop time for gdn
        my.loopTime += t;
        my.tilLastLookTime += t;
    };*/

    /**
     * killLookTimer - kills looks timer
     */
    my.killLookTimer = function() {
        if (my.gdnStopped) {
            return;
        }
        clearTimeout(my.lookTimer);
        my.gdnStopped = true;
        my.debug('---- ' + my.bannerName + ' stop at '
        + ((new Date().getTime() - my.startTime) / 1000) // eslint-disable-line no-magic-numbers
        + 's animation time\n\n');
    };

    /**
     * lightenDarkenColor - lighten or darken a hexcolor
     * @param {string} c - a hexcolor without number sign
     * @param {number} p - value from -100 to 100, negative for darken, positive for lighten
     * @returns {string} hexcolor without number sign
     */
    my.lightenDarkenColor = function(c, p) {
        var num = parseInt(c, 16),
            amt = Math.round(2.55 * p),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;

        return (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    };

    /**
     * getUrlProtocol - get url protocol of window
     * @returns {string} protocol of window
     */
    my.getUrlProtocol = function() {
        return window.location.protocol !== 'https:' ? 'http://' : 'https://';
    };


    /**
     * detectFF - detect Firefox browser
     * @returns {boolean} true if firefox detected
     */
    my.detectFF = function() {
        return navigator.userAgent.toLowerCase().indexOf('firefox') > -1; // eslint-disable-line no-magic-numbers
    };


    /**
     * detectIE - detect IE or Edge browser
     * @returns {[number, boolean]} returns version of ie / edge or false if other browser
     */
    my.detectIE = function() {
        var msie, trident, edge, rv;
        var ua = window.navigator.userAgent;

        msie = ua.indexOf('MSIE ');
        if (msie > 0) { // eslint-disable-line no-magic-numbers
            // IE 10 or older => return version number
            return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10); // eslint-disable-line no-magic-numbers
        }

        trident = ua.indexOf('Trident/');
        if (trident > 0) { // eslint-disable-line no-magic-numbers
            // IE 11 => return version number
            rv = ua.indexOf('rv:');

            return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10); // eslint-disable-line no-magic-numbers
        }

        edge = ua.indexOf('Edge/');
        if (edge > 0) { // eslint-disable-line no-magic-numbers
            // IE 12 => return version number
            return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10); // eslint-disable-line no-magic-numbers
        }

        // other browser
        return false;
    };


    /**
     * detectApple - detect Apple Device
     * @returns {boolean} returns true if Apple else false
     */
    my.detectApple = function() {
        var i,
            appleDevices = ['Mac', 'iPad', 'iPhone', 'iPod'];

        for (i in appleDevices) {
            if (navigator.platform.indexOf(appleDevices[i]) !== -1) { // eslint-disable-line no-magic-numbers
                return true;
            }
        }

        return false;
    };

    return my;
}(NFQDA || {}));
// common line functions module
/* global */

/* ***********************************************************
 * line functions module
 * should contain functions needed for this specific line
 * comment functions which are not needed
 */
var NFQDA = (function(my) {
    'use strict';

    /**
     * init - initialize and collect data for banner
     * @param {object} html5API - reference to aditions html5 api
     * @param {object} win - reference to iframes window
     * @param {object} aditionTarget - reference to aditions target element
     */
    my.init = function(html5API, win, aditionTarget) {
        var p,
            str = 'string',
            bool = 'boolean',
            url = 'url',
            num = 'number',
            emptyStr = '';

        // ************************************************************
        // jQuery plugins here

// font spy jQuery plugin ('preloader' for webfonts); modified a bit to return name of loaded/failed fontname
!function(t,s){'use strict';my.fontSpy=function(t,e){var n=s(e.doc).find("html"),o=s(e.doc).find("body"),i=t;if("string"!=typeof i||""===i)throw"No valid fontName!";var a={font:i,fontClass:i.toLowerCase().replace(/\s/g,""),success:function(){},failure:function(){},testFont:"Courier New",testString:"QW@HhsXJ",glyphs:"",delay:100,timeOut:2e3,callback:s.noop},c=s.extend(a,e),r=s("<span>"+c.testString+c.glyphs+"</span>").css("position","absolute").css("top","-9999px").css("left","-9999px").css("visibility","hidden").css("fontFamily",c.testFont).css("fontSize","250px");o.append(r);var u=r.outerWidth();r.css("fontFamily",c.font+","+c.testFont);var f=function(){n.addClass("no-"+c.fontClass),c&&c.failure&&c.failure(c.font),c.callback(new Error("FontSpy timeout")),r.remove()},l=function(){c.callback(),n.addClass(c.fontClass),c&&c.success&&c.success(c.font),r.remove()},d=function(){setTimeout(p,c.delay),c.timeOut=c.timeOut-c.delay},p=function(){var t=r.outerWidth();u!==t?l():c.timeOut<0?f():d()};p()}}(this,$);/*!
 * imagePreLoader : a jquery plugin for preloading images
 * Version: 0.2.0
 * Original author: @nick-jonas
 * Website: https://github.com/nick-jonas/nick-jonas.github.com/tree/master/imageloader
 * Licensed under the MIT license
 */

(function ($) {

    $.imagePreloader = function(p) {

        var params = $.extend({
             urls: [],
             onComplete: function() {},
             //onUpdate: function(ratio, image) {},
             onError: function(err) {}
        }, p);

        var loadCount = 0,
             urls = params.urls,
             len = urls.length;

        $.each(urls, function(i, item) {

            var img = new Image();
            img.src = item;
            img.onerror = function() {
                loadCount++;
                params.onError('Error loading image: ' + item);
            };

            /*$('<img/>').attr('src', item).load(function(res) {
                loadCount++;
                params.onUpdate(loadCount/len, urls[loadCount-1]);
                if (loadCount === len) params.onComplete();
            });*/

            $('<img/>').attr('src', item).on('load', function(res) {
                loadCount++;
                //params.onUpdate(loadCount/len, urls[loadCount-1]);
                if (loadCount === len) params.onComplete();
            });

        });

    };

})(jQuery);
        // ************************************************************

        // HTML5API reference
        my.api = html5API;
        // the iframes document
        my.targetDocument = win.document;
        // Adition DOM target element
        my.aditionTargetCtr = aditionTarget;
        // DOM target element to put banner
        my.targetCtr = win.document.getElementById('bannerTarget');
        // size of ad
        my.bannerH = parseInt(my.api.getBannerAttribute('height'), 10);
        my.bannerW = parseInt(my.api.getBannerAttribute('width'), 10);
        // format string
        my.bannerFormat = my.bannerW + 'x' + my.bannerH;
        // name of banner
        my.bannerName = my.customerName + '_' + my.bannerFormat;

        // ************************************************************
        // set customer name folder and adition paths according to template type
        my.customerName = my.customerName + my.networkSuffixes[my.tmpltTypeExt];

        my.adServerPath = 'banners/' + my.networks[my.tmpltTypeExt] + '/dbt/' + my.customerName + '/';
        my.adServer = my.urlProtocol + my.adServerDomain + my.adServerPath;

        // ************************************************************
        // get template attributes

        // adition clickurl
        // if this is missing, something is very wrong in adition
        // so we let adition api throw exception to stop banner (no try..catch here)
        my.clickurl = my.api.getTemplateAttribute('clickurl');

        my.getTmplAttr('gdn', my.defGdn, bool);
        my.getTmplAttr('bgCol', my.defBgCol, str);
        my.getTmplAttr('border', my.defBorder, str);

        my.getTmplAttr('showOBA', my.defShowOBA, bool);
        my.getTmplAttr('obaCol', my.defObaCol, str);
        my.getTmplAttr('obaTxt', my.defObaTxt, str);

        my.getTmplAttr('logo', my.logo, url);
        my.getTmplAttr('BannerBG_970', my.BannerBG_970, url);
        my.getTmplAttr('BannerBG2_970', my.BannerBG2_970, url);
        my.getTmplAttr('BannerBG3_970', my.BannerBG3_970, url);
        my.getTmplAttr('finger', my.finger, url);
        
        // SEQUENCE 1        
        my.getTmplAttr('seq01DisrTop2BG', my.seq01DisrTop2BG, url);
        my.getTmplAttr('seq01DisrRight3', my.seq01DisrRight3, url);
        my.getTmplAttr('seq01DisrRight2', my.seq01DisrRight2, url);
        my.getTmplAttr('seq01DisrTopTxt', emptyStr, str);
        my.getTmplAttr('seq01DisrTopTxtCol', my.seq01DisrTopTxtCol, str);
        my.getTmplAttr('seq01ProdImg', my.seq01ProdImg, url);
        my.getTmplAttr('seq01ProdImgName', my.seq01ProdImgName, url);
        
        // SEQUENCE 2  
        my.getTmplAttr('SecondProduct_970', my.SecondProduct_970, url);
        my.getTmplAttr('SecondProduct2_970', my.SecondProduct2_970, url);
        my.getTmplAttr('SecondProduct3_970', my.SecondProduct3_970, url);
        my.getTmplAttr('seq02DisrRightBG', my.seq02DisrRightBG, url);
        my.getTmplAttr('seq02DisrRightTxt', emptyStr, str);
        my.getTmplAttr('seq02DisrRightTxtCol', my.seq02DisrRightTxtCol, str);        
        my.getTmplAttr('seq02DisrRightTxtul1', emptyStr, str);
        my.getTmplAttr('seq02DisrRightTxtul2', emptyStr, str);
        my.getTmplAttr('seq02DisrRightTxtul3', emptyStr, str);
        my.getTmplAttr('seq02DisrRightTxtulBG', my.seq02DisrRightTxtulBG, url);
        my.getTmplAttr('footer_zwei', emptyStr, str);
        my.getTmplAttr('seq02HeadTxt', emptyStr, str);
        my.getTmplAttr('seq02HeadTxtCol', emptyStr, str);
        my.getTmplAttr('seq02HeadTxtBG', my.seq02HeadTxtBG, url);
        my.getTmplAttr('seq02HeadTxt_second', emptyStr, str);
        my.getTmplAttr('seq02DisrRightBGColor', emptyStr, str);    
        // SEQUENCE 3
        my.getTmplAttr('SecondDisrRight970', my.SecondDisrRight970, url);
        my.getTmplAttr('seq03CtaTxt', my.seq03CtaTxt, str);
        my.getTmplAttr('seq03CtaTxtCol', my.defseq03CtaTxtCol, str);
        my.getTmplAttr('seq03CtaBgCol', my.defseq03CtaBgCol, str);
        my.getTmplAttr('footer', emptyStr, str);
        my.getTmplAttr('SmallProduct1', my.SmallProduct1, url);
        my.getTmplAttr('SmallProduct2', my.SmallProduct2, url);
        my.getTmplAttr('SmallProduct3', my.SmallProduct3, url);
        my.getTmplAttr('seq03HeadTxt', my.seq03HeadTxt, str);
        my.getTmplAttr('seq03HeadTxtSize', my.seq03HeadTxtSize, str);
        my.getTmplAttr('seq03HeadTxt2', my.seq03HeadTxt2, str);
        my.getTmplAttr('seq03HeadTxt2Size', my.seq03HeadTxt2Size, str);
        my.getTmplAttr('seq03HeadTxt768', my.seq03HeadTxt768, str);
        my.getTmplAttr('pricefootnote', my.pricefootnote, str);
        my.getTmplAttr('seq02DisrLeftBlue', my.seq02DisrLeftBlue, url); 
        my.getTmplAttr('seqpricefrom', my.seqpricefrom, str);
        
        
        my.getTmplAttr('seq03TextulImg', my.seq03TextulImg, url);
        my.getTmplAttr('seq03TextulHead1', my.seq03TextulHead1, str);
        my.getTmplAttr('seq03TextulSub1', my.seq03TextulSub1, str);
        my.getTmplAttr('seq03TextulSub2', my.seq03TextulSub2, str);          
        my.getTmplAttr('seq03TextulSub3', my.seq03TextulSub3, str);   
        my.getTmplAttr('underscore', my.underscore, url);
        my.getTmplAttr('pricefrom', my.pricefrom, str);
        my.getTmplAttr('price', my.price, str);
        my.getTmplAttr('pricekomma', my.pricekomma, str);
        my.getTmplAttr('seqprice', my.seqprice, url);  
        my.getTmplAttr('pricefooter', my.pricefooter, str);
        my.getTmplAttr('seqoldpriceline', my.seqoldpriceline, url);
        my.getTmplAttr('seqoldpricetxt', my.seqoldpricetxt, str);
        my.getTmplAttr('sternchentext', my.sternchentext, str);
        my.getTmplAttr('sternchentext2', my.sternchentext2, str);
        my.getTmplAttr('sternchentext3', my.sternchentext3, str);
        
               
        my.getTmplAttr('FirstDisrRight', my.FirstDisrRight, url);
        my.getTmplAttr('SecondDisrRight120', my.SecondDisrRight120, url);

        
        my.getTmplAttr('FirstHeadline120', my.FirstHeadline120, url);
        my.getTmplAttr('SecondHeadline120',  my.SecondHeadline120, url);

        my.getTmplAttr('ProductTitle', my.ProductTitle, url);
        
        my.getTmplAttr('Cta', my.Cta, url);

        // ************************************************************
        // products

        // get number of products and products
        try {
            my.products = my.api.getProducts();
        } catch (e) {
            my.products = [];
        }

        // real number of products
        my.numProds = my.products.length;

        // ************************************************************
        // data check --> if something is wrong, show default banner
        if (my.numProds === 0) { // eslint-disable-line no-magic-numbers
            my.debugError('products: ' + my.numProds);
            my.debug('showing fallback', true);

            my.api.displayDefaultBanner();

            return;
        }

        p = my.products[0];
        p.image = my.fixRelImgUrl(p.image);

        // collect product attributes from attribute collection first
        my.getProdAttr(p);

        // fix other product images
        p.manufacturerImage = my.fixRelImgUrl(p.manufacturerImage);
        p.productNameImage = my.fixRelImgUrl(p.productNameImage);

        my.debugSetup();

        my.createCss(my.targetDocument);

        // preload first product image

        my.debug('- preloading 1st product image\n\n', true);

        $.imagePreloader({
            urls: [p.image],
            onComplete: function() {
                my.firstImgLoaded = true;
                my.debug('- 1st product image loaded\n\n', true);
            },
            onError:  function() {
                my.firstImgLoaded = true;
                my.debugError('1st product image load failed\n\n');
            }
        });

        my.checkFonts(my.usedFonts);
    };

    return my;
}(NFQDA || {}));
// line setup module (format independant)
/* global */

/* ***********************************************************
 * line setup module
 * should only contain setup and default variables needed for all lines
 */
var NFQDA = (function(my) {
    'use strict';

    // HTML5API
    my.api;
    // check url protocol, must be https: or http:
    my.urlProtocol = my.getUrlProtocol();
    // folder name of customer on adserver, suffix will be added later based on network
    my.customerName = '1u1';
    // change network number in adServerPath if required
    my.adServerDomain = 'imagesrv.adition.com/';//'web.nfq.de/test/markus/';
    my.adServerPath = '';// will be set later based on network
    my.assetsFolder = 'assets/';//'_swf/'
    my.fontsFolder = my.assetsFolder + 'fonts/';//'_fonts/'
    my.adServer = '';// will be set later based on network
    my.fallbackLink = 'https://www.1und1.de/';

    // used webfonts
    my.usedFonts = ['FrutigerLTPro-57Cn', 'FrutigerLTPro-77BlkCn'];

    // adition networks and suffixes
    my.networks = {'std': 3202};
    my.networkSuffixes = {'std': ''};

    // show times for looks and intro
    my.introTime = 3000;
    my.look01Time = 5000;
    my.look02Time = 5000;

    // empty 1x1 pixel png (fallback and fix for clickbutton IE10 and fix for 'broken image' icon)
    // eslint-disable-next-line max-len
    my.emptyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABBJREFUeNpi+P//PwNAgAEACPwC/tuiTRYAAAAASUVORK5CYII=';

    // ************************************************************
    // common default values
    my.defShowIntro = false;
    my.defIntroLink = my.fallbackLink;

    my.defBorder = '1px solid #000';
    my.defBgCol = '#0d3175';
    //my.defBgImg = my.emptyPng;

    my.defShowOBA = false;
    my.defObaTxt = '-w-';
    my.defObaCol = '#fff';

    // look 01
    my.defLk01HlTxtCol = '#fff';
    my.defLk01DisrLeftBgImg = my.emptyPng;
    my.defLk01DisrLeftAnim = 'flip';
    my.defLk01DisrRightTxtCol = '#fff';
    my.defLk01DisrRightTxtBgCol = '#134094';
    my.defLk01DisrRightBgImg = my.emptyPng;
    my.defLk01DisrRightAnim = 'flip';
    my.defLk01SmallprintTxtCol = '#fff';

    // look 02
    my.defLk02HlTxtCol = '#134094';
    my.defLk02HlBgCol = '#ffed00';
    my.defLk02CtaTxtCol = '#134094';
    my.defLk02CtaBgCol = '#ffed00';

    // names of looks used in animation loop
    my.looks = ['look01', 'look02'];
    my.numAllLooks = my.looks.length;
    my.loopTime = my.look01Time + my.look02Time;
    my.tilLastLookTime = my.look01Time + my.look02Time;

    // clickhandler related vars
    my.tmpltTypeExt = 'std';// default is standard

    my.currProd = 0;
    my.currLook = 0;

    my.gdnStop;
    my.gdnStopTime = 0;
    my.gdnStopped = false;

    my.IEversion = my.detectIE();
    my.isIE = my.IEversion !== false;
    my.isFF = my.detectFF();
    my.isApple = my.detectApple();

    return my;
}(NFQDA || {}));
// format setup module

/* ***********************************************************
 * format dependant setup module
 * should only contain format dependant variables, default variables
 * and dynamic css for format
 */
var NFQDA = (function(my) {
    'use strict';

    // optional overwrites of common setup here
    // my.exampleOverwrite = whatever

    /**
     * create dynamic banner styles in document
     * @param {object} doc - the reference to document
     */
    my.createCss = function(doc) {
        var p = my.products[0];
        var style = doc.createElement('style');

        style.type = 'text/css';
        style.innerHTML = ''

        // General Setup
        + '@font-face {'
        + '    font-family: FrutigerLTPro-57Cn;'
        + '    src: url("http://1u1.dynamic-ads.de/api/uploads/assets_files/5baa786fc1c58.woff") format("opentype");'
        + '}'

        + '@font-face {'
        + '    font-family: FrutigerLTPro-77BlkCn;'
        + '    src: url("http://1u1.dynamic-ads.de/api/uploads/assets_files/5baa793ee20a9.woff") format("opentype");'
        + '}'

        + '@font-face {'
        + '    font-family: websans_extra_black;'
        + '    src: url("http://1u1.dynamic-ads.de/api/uploads/assets_files/5bbc9df0bc608.woff") format("opentype");'
        + '}'

        + '* {'
        + '    box-sizing: border-box;'
        + '    margin: 0;'
        + '    -webkit-font-smoothing: antialiased;'
        + '    -moz-osx-font-smoothing: grayscale; text-rendering: geometricprecision;'
        + '}'

        + 'body {'
        + '    font-family: FrutigerLTPro-77BlkCn, Arial, sans-serif;'
        + '    font-weight: 400;'
        + '    color: #fff;'
        + '}'

        +'.logo {'
        +'  background-repeat: no-repeat;'
        +'  background-size: contain;'
        +'  width: 60px;'
        +'  height: auto;'
        +'  position: absolute;'
        +'  bottom: 20px;'
        +'  right: 20px;'
        +'}'

        +'#BannerBG {'
        +'  background-image: url('+ my.BannerBG_970 +');'
        +'  background-color: #0d3374;'
        +'  background-size: cover;'
        +'  width: 100%;'
        +'  height: 100%;'
        +'  left: 0px;'
        +'  top: 0px;'
        +'  animation-name: bannerBGAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        + '}'

        +'@keyframes bannerBGAni {'
        +'  0% {opacity: 0;}'
        +'  5% {opacity: 1;}'
        +'  30% {opacity: 1;}'
        +'  35% {opacity: 0;}'
        +'  100% {opacity: 0;}'
        +'}'

        +'#BannerBG2 {'
        +'  background-image: url('+ my.BannerBG2_970 +');'
        +'  background-color: #0d3374;'
        +'  background-size: cover;'
        +'  width: 100%;'
        +'  height: 100%;'
        +'  left: 0px;'
        +'  top: 0px;'
        +'  position: absolute;'
        +'  animation-name: bannerBG2Ani;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        + '}'

        +'@keyframes bannerBG2Ani {'
        +'  0% {opacity: 0;}'
        +'  5% {opacity: 0;}'
        +'  30% {opacity: 0;}'
        +'  35% {opacity: 1;}'
        +'  100% {opacity: 1;}'
        +'}'

        +'#BannerBG3 {'
        +'  background-image: url('+ my.BannerBG3_970 +');'
        +'  background-color: #0d3374;'
        +'  background-repeat: no-repeat;'
        +'  background-size: cover;'
        +'  width: 100%;'
        +'  height: 100%;'
        +'  left: 0px;'
        +'  top: 0px;'
        +'  position: absolute;'
        +'  animation-name: bannerBG3Ani;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        + '}'

        +'@keyframes bannerBG3Ani {'
        +'  0% {opacity: 0;}'
        +'  5% {opacity: 0;}'
        +'  60% {opacity: 0;}'
        +'  65% {opacity: 1;}'
        +'  100% {opacity: 1;}'
        +'}'
    
        // Step 1

        +'.banner2BG {'
        +'  background-image: url('+ my.BannerBG_970 +');'
        +'  background-size: cover;'
        +'  width: 100%;'
        +'  height: 100%;'
        +'  top: 0px;'
        +'  left: 0px;'
        +'  position: absolute;'
        +'  animation-name: bannerAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes bannerAni {'
        +'  0% {opacity: 0;}'
        +'  1% {opacity: 1;}'
        +'  5% {opacity: 0;}'
        +'  100% {opacity: 0;}'
        +'}'

        +'.seq01ProdImg {'
        +'  position: absolute;'
        +'  width: auto;'
        +'  height: 210px;'
        +'  top: 20px;'
        +'  left: 125px;'
        +'  animation-name: smartphoneAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'
     
        +'@keyframes smartphoneAni {'
        +'  0% {opacity: 0;}'
        +'  5% {opacity: 1;}'
        +'  25% {opacity: 1;}'
        +'  30% {opacity: 0;}'
        +'  100% {opacity: 0;}'
        +'}'

        +'.seq01ProdImgName {'
        +'  position: absolute;'
        +'  width: 230px;'
        +'  height: auto;'
        +'  left: 270px;'
        +'  top: 90px;'
        +'  animation-name: smartphoneTitleAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes smartphoneTitleAni {'
        +'  0% {opacity: 0;}'
        +'  5% {opacity: 1;}'
        +'  25% {opacity: 1;}'
        +'  30% {opacity: 0;}'
        +'  100% {opacity: 0;}'
        +'}'

        +'.seq01DisrTopBG {'
        +'  position: absolute;'
        +'  background-image: url('+ my.seq01DisrRight3 +');'
        +'  background-repeat: no-repeat;'
        +'  width: 235px;'
        +'  height: 150px;'
        +'  right: 0px;'
        +'  top: 50px;'
        +'  padding-top: 50px;'
        +'  transform-origin: right top;'
        +'  animation-name: disturberTopAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-delay: .1s;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'.seq01DisrTopTxt {'
        +'  font-family: FrutigerLTPro-77BlkCn;'
        +'  font-size: 26px;'
        +'  line-height: 28px;'
        +'  letter-spacing: 0px;'
        +'  width: 180px;'
        +'  margin-left: 35px;'
        +'  text-align: left;'
        +'  color: ' + my.seq01DisrTopTxtCol + ';'
        +'}'
        
        +'@keyframes disturberTopAni {'
        +'  0% {opacity:0;transform: rotateY(-90deg);}'
        +'  5% {opacity:1;transform: rotateY(0deg);}'
        +'  25%{opacity:1;transform: rotateY(0deg);}'
        +'  30%{opacity:0;transform: rotateY(0deg);}'
        +'  100% {opacity:0;transform: rotateY(0deg);}'
        +'}'


        // Step 2

        +'.smartphoneBroken {'
        +'  position: absolute;'
        +'  width: 970px;'
        +'  height: auto;'
        +'  top: 0px;'
        +'  left: 100px;'
        +'  opacity: 0;'
        +'  animation-name: smartphoneBrokenAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes smartphoneBrokenAni {'
        +'  0% {opacity: 0;}'
        +'  30% {opacity: 0;}'
        +'  35% {opacity: 1;}'
        +'  55% {opacity: 1;}'
        +'  58% {opacity: 0;}'
        +'  100% {opacity: 0;}'
        +'}'

        +'.smartphoneBroken2 {'
        +'  position: absolute;'
        +'  width: 970px;'
        +'  height: auto;'
        +'  top: 0px;'
        +'  left: 100px;'
        +'  opacity: 0;'
        +'  animation-name: smartphoneBroken2Ani;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes smartphoneBroken2Ani {'
        +'  0% {opacity: 0;}'
        +'  35% {opacity: 0;}'
        +'  40% {opacity: 1;}'
        +'  55% {opacity: 1;}'
        +'  58% {opacity: 0;}'
        +'  100% {opacity: 0;}'
        +'}'

        +'.smartphoneBroken3 {'
        +'  position: absolute;'
        +'  width: 970px;'
        +'  height: auto;'
        +'  top: 0px;'
        +'  left: 100px;'
        +'  opacity: 0;'
        +'  animation-name: smartphoneBroken3Ani;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes smartphoneBroken3Ani {'
        +'  0% {opacity: 0;}'
        +'  40% {opacity: 0;}'
        +'  45% {opacity: 1;}'
        +'  55% {opacity: 1;}'
        +'  58% {opacity: 0;}'
        +'  100% {opacity: 0;}'
        +'}'

        +'.footer_zwei {'
        +'  font-family: FrutigerLTPro-57Cn, Arial, sans-serif;'
        +'  font-size: 12px;'
        +'  text-align: center;'
        +'  line-height: 10px;'
        +'  letter-spacing: 0px;'
        +'  left: 50px;'
        +'  bottom: 20px;'
        +'  position: absolute;'
        +'  opacity: 0;'
        +'  animation-name: footer_zweiAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes footer_zweiAni {'
        +'  0% {bottom: 20px;opacity: 0;}'
        +'  30% {bottom: 20px;opacity: 0;}'
        +'  34% {bottom: 20px;opacity: 1;}'
        +'  56% {bottom: 20px;opacity: 1;}'
        +'  60% {bottom: 20px;opacity: 0;}'
        +'  100% {bottom: 20px;opacity: 0}'
        +'}'

        +'.seq02HeadTxt {'
        +'  position: absolute;'
        +'  font-family: FrutigerLTPro-77BlkCn;'
        +'  font-size: 32px;'
        +'  top: 104px;'
        +'  left: 110px;'
        +'  animation-name: headlineAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-delay: .1s;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'.seq02HeadTxt_second {'
        +'  position: absolute;'
        +'  font-family: FrutigerLTPro-77BlkCn;'
        +'  font-size: 32px;'
        +'  top: 104px;'
        +'  left: 298px;'
        +'  animation-name: headlineAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-delay: .1s;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'.seq02HeadTxtBG {'
        +'  position: absolute;'
        +'  width:85px;'
        +'  top: 105px;'
        +'  left: 20px;'
        +'  height:auto;'
        +'  animation-name: headlineAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-delay: .1s;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes headlineAni {'
        +'  0% {opacity: 0;}'
        +'  30% {opacity: 0;}'
        +'  35% {opacity: 1;}'
        +'  55% {opacity: 1;}'
        +'  60% {opacity: 0;}'
        +'  100% {opacity: 0;}'
        +'}'
         
        +'.seq02DisrRightTxt {'
        +'  font-family: FrutigerLTPro-77BlkCn;'
        +'  font-size: 22px;'
        +'  line-height: 24px;'
        +'  letter-spacing: 0px;'
        +'  width: 150px;'
        +'  text-align: left;'
        +'  padding-top: 40px;'
        +'  margin-left: 30px;'
        +'  color: ' + my.seq02DisrRightTxtCol + ';'
        +'}'

        +'.seq02DisrRightBG {'
        +'  position: absolute;'
        +'  width: 270px;'
        +'  height: 219px;'
        +'  top:0px;'
        +'  right:-30px;'
        +'  opacity: 1;'
        +'  background: url(' + my.seq01DisrRight2 + ') no-repeat;'
        +'  background-size: contain;'
        +'  transform-origin: right top;'
        +'  animation-name: disturberRightAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'.seq02DisrRightTxtul1 {'
        +'  font-family: FrutigerLTPro-77BlkCn;'
        +'  font-size: 22px;'
        +'  line-height: 16px;'
        +'  letter-spacing: 0px;'
        +'  text-align: left;'
        +'  margin-top: 10px;'
        +'  padding-left: 20px;'
        +'  margin-left: 45px;'
        +'  animation-name: seq02DisrRightTxtAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'  color: ' + my.seq02DisrRightTxtCol + ';'
        +'  background: url(' + my.seq02DisrRightTxtulBG + ') no-repeat left center / contain;'
        +'}'

        +'.seq02DisrRightTxtul2 {'
        +'  font-family: FrutigerLTPro-77BlkCn;'
        +'  font-size: 22px;'
        +'  line-height: 16px;'
        +'  letter-spacing: 0px;'
        +'  text-align: left;'
        +'  margin-top: 10px;'
        +'  padding-left: 20px;'
        +'  margin-left: 45px;'
        +'  animation-name: seq02DisrRightTxtAni2;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'  color: ' + my.seq02DisrRightTxtCol + ';'
        +'  background: url(' + my.seq02DisrRightTxtulBG + ') no-repeat left center / contain;'
        +'}'

        +'.seq02DisrRightTxtul3 {'
        +'  font-family: FrutigerLTPro-77BlkCn;'
        +'  font-size: 20px;'
        +'  line-height: 16px;'
        +'  letter-spacing: 0px;'
        +'  text-align: left;'
        +'  margin-top: 10px;'
        +'  padding-left: 20px;'
        +'  margin-left: 45px;'
        +'  animation-name: seq02DisrRightTxtAni3;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'  color: ' + my.seq02DisrRightTxtCol + ';'
        +'  background: url(' + my.seq02DisrRightTxtulBG + ') no-repeat left center / contain;'
        +'}'

        +'@keyframes disturberRightAni {'
        +'  0% {opacity: 0;transform: rotateY(-90deg);}'
        +'  32% {opacity: 0;transform: rotateY(-90deg);}'
        +'  37% {opacity: 1;transform: rotateY(0deg);}'
        +'  55% {opacity: 1;transform: rotateY(0deg);}'
        +'  60% {opacity: 0;transform: rotateY(-90deg);}'
        +'  100% {opacity: 0;}'
        +'}'

        +'@keyframes seq02DisrRightTxtAni {'
        +'  34% {opacity: 0;}'
        +'  42% {opacity: 1;}'
        +'  55% {opacity: 1;}'
        +'  60% {opacity: 0;}'
        +'}'

        +'@keyframes seq02DisrRightTxtAni2 {'
        +'  36% {opacity: 0;}'
        +'  44% {opacity: 1;}'
        +'  55% {opacity: 1;}'
        +'  60% {opacity: 0;}'
        +'}'

        +'@keyframes seq02DisrRightTxtAni3 {'
        +'  38% {opacity: 0;}'
        +'  46% {opacity: 1;}'
        +'  55% {opacity: 1;}'
        +'  60% {opacity: 0;}'
        +'}'

        // Step 3
        +'.cta {'
        +'  font-family: FrutigerLTPro-77BlkCn;'
        +'  font-size: 13px;'
        +'  position: absolute;'
        +'  padding: 7px 4px 10px 4px;'
        +'  right: 160px;'
        +'  top:32px;'
        +'  width: 180px;'
        +'  height: 30px;'
        +'  text-align: left;'
        +'  background-color: ' + my.seq03CtaBgCol + ';'
        +'  animation-name: ctaAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes ctaAni {'
        +'  0% {top: 145px;opacity: 0}'
        +'  62% {top: 145px;opacity: 0}'
        +'  68% {top: 145px;opacity: 1}'
        +'  69% {top: 147px;opacity: 1}'
        +'  70% {top: 145px;opacity: 1}'
        +'  73% {top: 145px;opacity: 1}'
        +'  74% {top: 147px;opacity: 1}'
        +'  75% {top: 145px;opacity: 1}'
        +'  100% {top: 145px;opacity: 1}'
        +'}'

        +'.finger {'
        +'  width: 20px;'
        +'  height: auto;'
        +'  position: absolute;'
        +'  bottom: 30px;'
        +'  left: 350px;'
        +'  animation-name: fingerani;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes fingerani {'
        +'  0% {bottom: 0px;left:900px;opacity: 0;}'
        +'  62% {bottom: 0px;left:900px;opacity: 0;}'
        +'  68% {bottom: 75px;left:800px;opacity: 1;}'
        +'  69% {bottom: 73px;left:800px;opacity: 1;}'
        +'  70% {bottom: 75px;left:800px;opacity: 1;}'
        +'  73% {bottom: 75px;left:800px;opacity: 1;}'
        +'  74% {bottom: 73px;left:800px;opacity: 1;}'
        +'  75% {bottom: 75px;left:800px;opacity: 1;}'
        +'  99.8% {bottom: 75px;left:800px;opacity: 1;}'
        +'  100% {bottom: 75px;left:800px;opacity: 0;}'
        +'}'


        +'.seq03CtaTxt {'
        +'  font-size: 17px;'
        +'  line-height: 16px;'
        +'  text-align: center;'
        +'  color: ' + my.seq03CtaTxtCol + ';'
        +'}'

        +'.footer {'
        +'  font-family: FrutigerLTPro-57Cn, Arial, sans-serif;'
        +'  font-size: 12px;'
        +'  text-align: center;'
        +'  line-height: 10px;'
        +'  letter-spacing: 0px;'
        +'  position: absolute;'
        +'  max-width: 240px;'
        +'  width:220px;'
        +'  left: 610px;'
        +'  bottom:20px;'
        +'  opacity: 0;'
        +'  animation-name: footerAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes footerAni {'
        +'  0% {opacity: 0;}'
        +'  60% {opacity: 0;}'
        +'  65% {opacity: 1;}'
        +'  100% {opacity: 1}'
        +'}'
        +'.seq03DisrRightBlueBG{'
        +'  position: absolute;'
        +'  background: url(' + my.seq02DisrLeftBlue + ') no-repeat left center / contain;'
        +'  width: 210px;'
        +'  height: 230px;'
        +'  top:90px;'
        +'  right:0px;'
        +'  opacity: 0;'
        +'  transform-origin: right center;'
        +'  animation-name: disturberRightBlueAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes disturberRightBlueAni {'
        +'  0% {opacity: 0;transform: rotateY(90deg);}'
        +'  60% {opacity: 0;transform: rotateY(90deg);}'
        +'  65% {opacity: 1;transform: rotateY(0deg);}'
        +'  100% {opacity: 1;transform: rotateY(0deg);}'
        +'}'
        +'.seq03HeadTxt {'
        +'  position: absolute;'
        +'  font-size: 48px;'
        +'  top: 72px;'
        +'  left: 552px;'
        +'  line-height: 28px;'
        +'  letter-spacing: 0.2px;'
        +'  text-align: center;'
        +'  animation-name: headline2Ani;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-delay: .1s;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'.seq03HeadTxt2 {'
        +'  position: absolute;'
        +'  font-size: ' + my.seq03HeadTxt2Size + ';'
        +'  max-width:120px;'
        +'  top:4px;'
        +'  left: 407px;'
        +'  line-height: 28px;'
        +'  text-align: center;'
        +'  animation-name: headline2Ani;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-delay: .1s;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes headline2Ani {'
        +'  0% {opacity: 0;}'
        +'  60% {opacity: 0;}'
        +'  65% {opacity: 1;}'
        +'  100% {opacity: 1;}'
        +'}'

        +'.seq03TextWall {'
        +'  position: absolute;'
        +'  width: 210px;'
        +'  height: 230px;'
        +'  background: url(' + my.seq02DisrLeftBlue + ') no-repeat left center / contain;'
        +'  top:10px;'
        +'  left: 0px;'
        +'  opacity: 0;'     
        +'  transform-origin: left center;'
        +'  animation-name: disturberRight2Ani;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'  animation-delay: .2s;'
        +'}'

        +'@keyframes disturberRight2Ani {'
        +'  0% {opacity: 0;transform: rotateY(90deg);}'
        +'  60% {opacity: 0;transform: rotateY(90deg);}'
        +'  65% {opacity: 1;transform: rotateY(0deg);}'
        +'  100% {opacity: 1;transform: rotateY(0deg);}'
        +'}'

        
        +'.seq03Textul2 {'
        +'  top: 30px;'
        +'  position: absolute;'
        +'}'

        +'.seq03Textul3 {'
        +'  top: 60px;'
        +'  position: absolute;'
        +'}'

        +'.seq03TextulBG {'
        +'  position: absolute;'
        +'  width: 27px;'
        +'  left: 41px;'
        +'  top: 25px;'
        +'  height: auto;'
        +'  background: url(' + my.seq03TextulImg + ') no-repeat left center / contain;'
        +'}'

        +'.seq03TextulHead {'
        +'  position: absolute;'
        +'  font-size: 26px;'
        +'  color: #ffed00;'
        +'  left: 69px;'
        +'  top: 25px;'

        +'}'
        
        +'.seq03TextulSub {'
        +'  position: absolute;'
        +'  font-size: 13px;'
        +'  left: 120px;'
        +'  top: 38px;'
        +'  text-transform: uppercase;'
        +'}'
        
        +'.underscore {'
        +'  position: absolute;'        
        +'  top: 120px;'
        +'  left: 33px;'
        +'  width: 156px;'
        +'  height:auto;'
        +'}'

        +'.pricefrom {'
        +'  position: absolute;'        
        +'  top: 140px;'
        +'  position: absolute;'
        +'  font-size: 12px;'
        +'  color: #ffed00;'
        +'}'

        +'.pricekomma {'
        +'  position: absolute;'        
        +'  top: 106px;'
        +'  left: 100px;'
        +'  position: absolute;'
        +'  font-size: 97px;'
        +'  color: #ffed00;'
        +'  font-family: websans_extra_black, Arial, sans-serif;'
        +'}'

        +'.price {'
        +'  position: absolute;'        
        +'  top: 112px;'
        +'  left: 52px;'
        +'  width: 0px;'
        +'  position: absolute;'
        +'  font-size: 102px;'
        +'  color: #ffed00;'
        +'  font-family: websans_extra_black, Arial, sans-serif;'
        +'}'
        +
        '.hovertext {' +
        '  width:70px;' +
        '  height:30px;' +
        '  position: absolute;' +
        '  opacity:1;' +
        '  left:50px;' +
        '  top:190px;' +
        '  transition: 0.3s;' +
        '  animation-name: hovertextani;' +
        '  animation-duration: 15s;' +
        '  animation-timing-function: ease-in-out();' +
        '  animation-fill-mode: forwards;' +
        '  animation-iteration-count: 2;' +
        '  animation-delay: .2s;' +
        '}'

        +
        '@keyframes hovertextani {' +
        '  0% {opacity: 0; left:-120px;}' +
        '  60% {opacity: 0; left:-120px;}' +
        '  61% {opacity: 1; left:130px;}' +
        '  100% {opacity: 1; left:130px;}' +
        '}'

        +
        '.hovertext:hover +.sternchentext {' +
        '  display:inline;' +
        '  opacity:1;' +
        '  bottom:0px;' +
        '  transition: bottom 0.3s;' +
        '}'

        +'.sternchentext{'
        +'  font-family: FrutigerLTPro-57Cn, Arial, sans-serif;'
        +'  line-height: 15px;'
        +'  width:75%;'
        +'  background-color:white;'
        +'  position:absolute;'
        +'  bottom: -120px;'
        +'  right:0px;'
        +'  padding:5px 8px 8px;'
        +'  font-size:12px;'
        +'  color:#000;'
        +'  display:inline;'
        +'  opacity:0;'
        +'  transition: all 0.3s;'
        +'}'

        + 'sup {'
        +'  vertical-align: middle;'
        +'  position: relative;'
        +'  top: -148px;'
        +'  left: 59px;'
        +'  font-family: websans_extra_black, Arial, sans-serif;'
        +'  font-size: 58%;'
        +'  letter-spacing: -2px;'
        + '}'
            
        
        +'.seqpricefrom {'
        +'  position: absolute;'        
        +'  top: 185px;'
        +'  left: 30px;'
        +'  position: absolute;'
        +'  font-size: 26px;'
        +'  color: #ffed00;'
        +'}'

        +'.pricefootnote {'
        +'  position: absolute;'
        +'  font-size: 14px;'
        +'  font-family: FrutigerLTPro-57Cn, Arial, sans-serif;'
        +'  line-height: 15px;'
        +'  top: 180px;'
        +'  left: 132px;'
        +'  width: 80px;'
        +'  z-index: 2;'
        +'  animation-name: disturberRight2Ani;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'  animation-delay: .2s;'
        +'}'

        +'.smartphoneSmall1 {'
        +'  position: absolute;'
        +'  width: auto;'
        +'  height: 160px;'
        +'  left: 295px;'
        +'  top: 55px;'
        +'  opacity: 0;'
        +'  animation-name: smartphoneSmallAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'.smartphoneSmall2 {'
        +'  position: absolute;'
        +'  width: auto;'
        +'  height: 175px;'
        +'  left: 330px;'
        +'  top: 44px;'
        +'  opacity: 0;'
        +'  animation-name: smartphoneSmallAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'.smartphoneSmall3 {'
        +'  position: absolute;'
        +'  width: auto;'
        +'  height: 192px;'
        +'  left: 370px;'
        +'  top: 28px;'
        +'  opacity: 0;'
        +'  animation-name: smartphoneSmallAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'
        
        +'@keyframes smartphoneSmallAni {'
        +'  0% {opacity: 0;}'
        +'  60% {opacity: 0;}'
        +'  65% {opacity: 1;}'
        +'  100% {opacity: 1;}'
        +'}'
        
        + '.bannerHTML5, .lkWrap, #bannerBg {'
        + '    position: absolute;'
        + '    top: 0;'
        + '    left: 0;'
        + '    width: ' + my.bannerW + 'px;'
        + '    height: ' + my.bannerH + 'px;'
        + '    overflow: hidden;'
        +'  border: 1px solid #000000;'
        + '}'

        + '#html-loader, #clickButton, .lk01BgImgCtr, .lk01HlImgCtr, .lk02BgImgCtr, .introCtr, .introImg {'
        + '    position: absolute;'
        + '    top: 0;'
        + '    left: 0;'
        + '    width: 100%;'
        + '    height: 100%;'
        + '    display: block;'
        + '}'

        + '#clickButton {'
        + '    border: ' + my.border + ';'
        + '    cursor: pointer;'
        + '}'

        + '#bannerBg {'
        + '    background: ' + my.bgCol + ';'
        + '}'

        + '.lkWrap {}'

        + '.lk01BgImgCtr {'
        + '    background: url(' + my.lk01BgImg + ') no-repeat center center / contain;'
        + '}'

        // loader
        + '#html-loader {'
        + '    border: ' + my.border + ';'
        + '}'

        + '@-webkit-keyframes lspin {'
        + '     0% {-webkit-transform: scale(0); opacity: 0}'
        + '   100% {-webkit-transform: scale(1); opacity: 1};'
        + '}'

        + '@keyframes lspin {'
        + '     0% {transform: scale(0); opacity: 0}'
        + '   100% {transform: scale(1); opacity: 1};'
        + '}'

        + '.spinnerC {'
        + '    width: ' + my.bannerW + 'px;'
        + '    height: ' + my.bannerH + 'px;'
        + '    display: table-cell;'
        + '    vertical-align: middle;'
        + '    text-align: center;'
        + '}'

        + '.loaderC {'
        + '    width: ' + my.bannerW + 'px; height: ' + my.bannerH + 'px; position: relative;'
        + '}'

        + '.spinner {'
        + '    display: inline-block;'
        + '}'

        + '.spin1, .spin2, .spin3 {'
        + '    background: #bbb;'
        + '    border-radius: 50%;'
        + '    width: 12px;'
        + '    height: 12px;'
        + '    margin: 2px;'
        + '    display: inline-block;'
        + '    -webkit-transform: scale(0);'
        + '            transform: scale(0);'
        + '    -webkit-animation: lspin 0.5s cubic-bezier(0.8,0,0.2,1) infinite alternate;'
        + '            animation: lspin 0.5s cubic-bezier(0.8,0,0.2,1) infinite alternate;'
        + '}'

        + '.spin2 {'
        + '    -webkit-animation-delay: 0.15s;'
        + '            animation-delay: 0.15s;'
        + '}'

        + '.spin3 {'
        + '    -webkit-animation-delay: 0.3s;'
        + '            animation-delay: 0.3s;'
        + '}';

        doc.getElementsByTagName('head')[0].appendChild(style);
    };

    return my;
}(NFQDA || {}));
// preload functions module
/* global */

/************************************************************
 * preload functions module
 * checks webfonts and waits for intro loaded if any
 */
var NFQDA = (function(my) {
    'use strict';

    /**
     * checkFonts - wait for webfonts loaded (or failed),
     * then preload intro image if any then start animation
     * @param {Array} fonts - array with used font names
     */
    my.checkFonts = function(fonts) {
        // convert fonts array to a string without ','
        var fs = fonts.toString().replace(/,/g, '');
        var i;

        my.debug('- checking webfonts\n\n', true);

        // check fonts using fontSpy
        for (i in fonts) {
            my.fontSpy(fonts[i],
                {
                    success: fontLoadResult,
                    failure: fontLoadResult,
                    doc: my.targetDocument
                }
            );
        }

        /**
         *  fontLoadResult - called when font loaded or load failed
         * @param {string} f - loaded or failed font name
         */
        function fontLoadResult(f) {
            fs = fs.replace(f, '');
            // all loaded (or failed)

            if (fs.length === 0) { // eslint-disable-line no-magic-numbers
                // needs a short delay to start (only god knows why)!
                setTimeout(function() {
                    // create main html
                    my.createMainHtml();

                    // wait for load of optional intro
                    if (my.loadIntro && my.showIntro) {
                        my.debug('- preloading intro\n\n', true);
                    }
                    my.preloadIv = setInterval(waitForPreLoad, 30); // eslint-disable-line no-magic-numbers
                }, 30); // eslint-disable-line no-magic-numbers
            }
        }
    };

    /**
     *  waitForPreLoad - wait til intro loaded or failed
     */
    function waitForPreLoad() {
        if ((my.introLoaded || !my.hasIntro || !my.showIntro) && my.firstImgLoaded) {
            // intro loaded or load failed
            clearInterval(my.preloadIv);
            // recalculate gdn stop and start banner animation
            if (my.gdn) {
                my.setGdnStop();
            }
            my.startAnimation();
        }
    }

    return my;
}(NFQDA || {}));
// create format html module
/* global */

/* ***********************************************************
 * create banner html module
 */
var NFQDA = (function(my) {
    'use strict';

    /**
     * create html of banner within target container
     */
    my.createMainHtml = function() {
        var h;

        // put html into target container
        $(my.targetCtr).html(
            '<div id="' + my.bannerName + '" class="bannerHTML5">'
                +'<div id="BannerBG"></div>' +
                '<div id="BannerBG2"></div>' +
                '<div id="BannerBG3"></div>' +
                '<div class="cta">'+
                  '<div class="seq03CtaTxt">' + my.seq03CtaTxt + '</div>'+
                '</div>'+
                '<img class="finger" src="' + my.finger + '"></img>' +
                '<div class="footer">' + my.footer + '</div>' +
                '<div class="footer_zwei">' + my.footer_zwei + '</div>' +
                '<img class="smartphoneSmall1" src="' + my.SmallProduct3 + '"></img>' +
                '<img class="smartphoneSmall2" src="' + my.SmallProduct2 + '"></img>' +
                '<img class="smartphoneSmall3" src="' + my.SmallProduct1 + '"></img>' +
                '<img class="smartphoneBroken" src="' + my.SecondProduct_970 + '"></img>' +
                '<img class="smartphoneBroken2" src="' + my.SecondProduct2_970 + '"></img>' +
                '<img class="smartphoneBroken3" src="' + my.SecondProduct3_970 + '"></img>' +

                '<img src="' + my.seq02HeadTxtBG + '" class="seq02HeadTxtBG">'+
                '<div class="seq02HeadTxt">'+ my.seq02HeadTxt +'</div>'+
                '<div class="seq02HeadTxt_second">' + my.seq02HeadTxt_second + '</div>' +

                '<div class="seq03HeadTxt">'+ my.seq03HeadTxt768 +'</div>'+
              
                '<div class="seq03TextWall">'+
                '<div class="seq03Textul">' + 
                    '<img class="seq03TextulBG" id="seq03TextulBG_1" src="' + my.seq03TextulImg + '"></img>' +
                    '<div class="seq03TextulHead" id="seq03TextulHead_1">' + my.seq03TextulHead1 + '</div>' +
                    '<div class="seq03TextulSub" id="seq03TextulSub_1">' + my.seq03TextulSub1 + '</div>' +
                '</div>'+
                '<div class="seq03Textul2">' + 
                    '<img class="seq03TextulBG" src="' + my.seq03TextulImg + '"></img>' +
                    '<div class="seq03TextulHead">' + my.seq03TextulHead1 + '</div>' +
                    '<div class="seq03TextulSub">' + my.seq03TextulSub2 + '</div>' +
                '</div>'+
                '<div class="seq03Textul3">' + 
                    '<img class="seq03TextulBG" src="' + my.seq03TextulImg + '"></img>' +
                    '<div class="seq03TextulHead">' + my.seq03TextulHead1 + '</div>' +
                    '<div class="seq03TextulSub">' + my.seq03TextulSub3 + '</div>' +
                '</div>'+
                '<img class="underscore" src="' + my.underscore + '">'+
                '<div class="price">' + my.price + '</div>' +
                '<div class="pricekomma">' + my.pricekomma + '</div>' +
                '<div class="seqpricefrom">' + my.seqpricefrom + '</div>' +
                '<div class="pricefootnote">' + my.pricefootnote + '</div>' +
            '</div>'+

                '<div class="banner2BG"></div>' +
                '<img class="seq01ProdImgName" src="' + my.seq01ProdImgName + '"></img>' +
                '<img class="seq01ProdImg" src="' + my.seq01ProdImg + '"></img>' +
                
                '<div class="seq02DisrRightBG">'+
                    '<div class="seq02DisrRightTxt">' + my.seq02DisrRightTxt + '</div>'+
                    '<div class="seq02DisrRightTxtul1">' + my.seq02DisrRightTxtul1 + '</div>'+
                    '<div class="seq02DisrRightTxtul2">' + my.seq02DisrRightTxtul2 + '</div>'+
                    '<div class="seq02DisrRightTxtul3">' + my.seq02DisrRightTxtul3 + '</div>'+
                '</div>'+
                '<div class="seq01DisrTopBG">'+
                   '<div class="seq01DisrTopTxt">' + my.seq01DisrTopTxt + '</div>'+
                '</div>'+
                '<img class="logo" src="' + my.logo + '">' +
                '<div class="pricetag">' +
                '<div class="hovertext">' + '</div>' +
                    '<div class="sternchentext">' +
                        '<span>' + my.sternchentext + '</span>' +
                        '<span>' + my.sternchentext2 + '</span>' +
                        '<span>' + my.sternchentext3 + '</span>' +
                        '<span>' + "Preise inkl. MwSt. 1&1 Telecom GmbH, Elgendorfer Straße 57, 56410 Montabaur" + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>'
        );
    };

    return my;
}(NFQDA || {}));
// debug functions module
/* eslint-disable no-magic-numbers */
/* global */

/************************************************************
 * debug functions module
 * used in debug versions of templates
 */
var NFQDA = (function(my) {
    'use strict';

    /**
     * debug - output in console; if p is true elapsed time will be shown
     * @param {string} str - string to output
     * @param {boolean} p - flag for output of elapsed time
     */
    my.debug = function(str, p) {
        var s, t;

        if (window.console) {
            t = Math.round((new Date().getTime() - my.timeStmp) / 10) / 100;
            if (p) {
                s = '\n- ' + t + 's\n' + str;
            } else {
                s = str;
            }
            console.log(s);
        }
    };

    /**
     * debugSetup - output of important vars
     */
    my.debugSetup = function() {
        var nl = '\n-';

        my.debug('----- ' + my.bannerName + nl, true);
        my.debug('-- platform: ' + navigator.platform);
        my.debug('-- isApple: ' + my.isApple);
        my.debug('-- isIE: ' + my.isIE);
        my.debug('-- IEversion: ' + my.IEversion);
        my.debug('-- urlProtocol: ' + my.urlProtocol);
        my.debug('-- template type: ' + my.tmpltTypeExt);
        my.debug('-- gdn: ' + my.gdn);
        my.debug('-- OBA: ' + my.showOBA);
        my.debug('-- clickurl: ' + my.clickurl);
        if (my.deeplinkExt !== '') {
            my.debug('-- deeplink (external): ' + my.deeplinkExt);
        }
        if (my.redirUrlExt !== '') {
            my.debug('-- redirectUrl (external): ' + my.redirUrlExt);
        }
        if (my.paramsExt !== '') {
            my.debug('-- redirectParams (external): ' + my.paramsExt);
        }
        my.debugProducts();
        my.debug('\n\n');
    };

    /**
     * debugProducts - output product data
     */
    my.debugProducts = function() {
        var nl = '\n-';
        var i, t;

        for (i = 0; i < my.numProds; i++) {
            t = my.products[i];
            my.debug(nl);
            my.debug('----- product ' + i);
            my.debug('-- name: ' + t.name);
            my.debug('-- external Id: ' + t.externalId);
            my.debug('-- clickURL: ' + t.clickURL);
        }
    };

    /**
     * debugError - output error
     * @param {string} str - string to output
     */
    my.debugError = function(str) {
        var n = '**********\n';

        my.debug('\n' + n);
        my.debug('ERROR ' + str);
        my.debug(n + '\n');
    };

    /**
     * debugAttrWarn - output attribute warning
     * @param {string} str - name of attribute
     * @param {string} type - type of of attribute
     */
    my.debugAttrWarn = function(str, type) {
        var n = '**********\n';
        var t = type ? 'template' : 'product';

        my.debug('\n' + n);
        my.debug('WARNING ' + t + ' attribute ' + str + ' is undefined. Using default value.');
        my.debug(n + '\n');
    };

    return my;
}(NFQDA || {}));
// friendly iframe initializer module
/* eslint-disable no-magic-numbers */
/* global $ADLIB */

/************************************************************
 * DynamicAd initializer module
 * initializes ad via adition api call: $ADLIB.DBT.runDynamicAdInitializer
 * creates friendly iframe for banner content
 */
var NFQDA = (function(my) {
    'use strict';

    $ADLIB.DBT.runDynamicAdInitializer(function(html5API) {
        var target;

        // create friendly iframe
        var iframeWindow;
        var iframeDocument;
        var iframeContent;
        var iframe = document.createElement('iframe');

        // get banners id from adition api
        my.id = html5API.getId() + '_iframe';

        iframe.setAttribute('width', html5API.getBannerAttribute('width'));
        iframe.setAttribute('height', html5API.getBannerAttribute('height'));
        iframe.setAttribute('seamless', '');
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('frameBorder', '0');
        iframe.setAttribute('allowTransparency', 'true');
        iframe.setAttribute('src', 'about:blank');
        iframe.setAttribute('id', my.id);

        // put iframe into target div
        target = html5API.getTarget();
        target.appendChild(iframe);

        // the iframes document
        iframeWindow = iframe.contentWindow;
        iframeDocument = iframeWindow.document;

        // put important stuff into NFQBanners object for reference
        my.NFQBanners[my.id] = {
            api: html5API,
            iframeWindow: iframeWindow,
            iframeDocument: iframeDocument,
            aditionTarget: target,
            NFQDA: my
        };
        my.NFQBanner = my.NFQBanners[my.id];

        // the iframes HTML
        iframeContent = String(''
        + '<!DOCTYPE html>'
        + '<html>'
        + '<head id="bh">'
        + '<meta http-equiv="X-UA-Compatible" content="IE=Edge">'
        + '<meta name="viewport" content="width=device-width,height=device-height,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no">'
        + '<meta charset="utf-8">'
        + '<style type="text/css">body{margin:0}</style>'
        + '</head>'
        + '<body id="bb">'
        + '<div id="bannerTarget"></div>'
        + '</body>'
        + '</html>'
        );

        iframeWindow.contents = iframeContent;
        iframe.src = 'javascript:window["contents"]';
    });

    my.waitForJq = function() {
        if (my.jqReady) {
            clearInterval(my.iv);
            NFQDA.init(my.NFQBanner.api, my.NFQBanner.iframeWindow, my.NFQBanner.aditionTarget);
        }
    };
    my.iv = setInterval(my.waitForJq, 50);

    return my;
}(NFQDA || {}));