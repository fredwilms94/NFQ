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

    // TODO: move this function to line_functions
    // looks might differ from line to line
    /**
     * setGdnStop - calculate and set gdn stop time
     */
    my.setGdnStop = function() {
        var lk, t;
        var gdnt = 29000;
        var l = my.loopTime + my.tilLastLookTime;
        var n = my.looks.length - 1; // eslint-disable-line no-magic-numbers
        var loopTime1 = my.loopTime;

        //my.debug("loop time: " + my.loopTime + " - my.tilLastLookTime: " + my.tilLastLookTime);
        clearTimeout(my.gdnStop);
        my.gdnStopTime = 0;

        while (my.gdnStopTime < gdnt) {
            my.gdnStopTime += l;
        }
        do {
            my.gdnStopTime -= l;
        } while (my.gdnStopTime > gdnt);

        // if too many looks, we try to reach last look
        if (my.gdnStopTime === 0) { // eslint-disable-line no-magic-numbers
            while (loopTime1 > gdnt) {
                lk = my.looks[n];

                switch (lk) {
                case 'look01':
                    t = my.look01Time;
                    break;
                case 'look02':
                    t = my.look02Time;
                    break;
                case 'look03':
                    t = my.look03Time;
                    break;
                case 'intro':
                    t = my.introTime;
                    break;
                // no default
                }

                loopTime1 -= t;
                n--;
            }
            my.gdnStopTime = loopTime1;
        }

        // set timeout to stop look timer
        my.debug('- gdn animation stop: ' + (my.gdnStopTime / 1000) + 's\n\n'); // eslint-disable-line no-magic-numbers
        my.gdnStop = setTimeout(my.killLookTimer, my.gdnStopTime);
    };


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
        my.getTmplAttr('BannerBG_768', my.BannerBG_768, url);
        my.getTmplAttr('BannerBG2_768', my.BannerBG2_768, url);
        my.getTmplAttr('BannerBG3_768', my.BannerBG3_768, url);
        my.getTmplAttr('finger', my.finger, url);
        
        // SEQUENCE 1        
        my.getTmplAttr('seq01DisrTop2BG', my.seq01DisrTop2BG, url);
        my.getTmplAttr('seq01DisrTopBG', my.seq01DisrTopBG, url);
        my.getTmplAttr('seq01DisrTopTxt', emptyStr, str);
        my.getTmplAttr('seq01DisrTopTxtCol', my.seq01DisrTopTxtCol, str);
        my.getTmplAttr('seq01ProdImg', my.seq01ProdImg, url);
        my.getTmplAttr('seq01ProdImgName', my.seq01ProdImgName, url);
        
        // SEQUENCE 2  
        my.getTmplAttr('SecondProduct_768', my.SecondProduct_768, url);
        my.getTmplAttr('SecondProduct2_768', my.SecondProduct2_768, url);
        my.getTmplAttr('SecondProduct3_768', my.SecondProduct3_768, url);
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
    
        // SEQUENCE 3
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
        
        
        my.getTmplAttr('seq03TextulImg', my.seq03TextulImg, url);
        my.getTmplAttr('seq03TextulHead1', my.seq03TextulHead1, str);
        my.getTmplAttr('seq03TextulSub1', my.seq03TextulSub1, str);
        my.getTmplAttr('seq03TextulSub2', my.seq03TextulSub2, str);          
        my.getTmplAttr('seq03TextulSub3', my.seq03TextulSub3, str);   
        my.getTmplAttr('underscore', my.underscore, url);
        my.getTmplAttr('seqpricefrom', my.seqpricefrom, str);
        my.getTmplAttr('price', my.price, str);
        my.getTmplAttr('seqprice', my.seqprice, url);
        
        my.getTmplAttr('pricefooter', my.pricefooter, str);
        my.getTmplAttr('seqoldpriceline', my.seqoldpriceline, url);
        my.getTmplAttr('seqoldpricetxt', my.seqoldpricetxt, str);
        
               
        my.getTmplAttr('FirstDisrRight', my.FirstDisrRight, url);
        my.getTmplAttr('SecondDisrRight120', my.SecondDisrRight120, url);

        
        my.getTmplAttr('FirstHeadline120', my.FirstHeadline120, url);
        my.getTmplAttr('SecondHeadline120',  my.SecondHeadline120, url);

        my.getTmplAttr('ProductTitle', my.ProductTitle, url);
        
        my.getTmplAttr('Cta', my.Cta, url);





        
        my.getTmplAttr('lk01BgImg', my.emptyPng, url);
        my.getTmplAttr('lk01HlTxt', emptyStr, str);
        my.getTmplAttr('lk01HlTxtCol', my.defLk01HlTxtCol, str);
        my.getTmplAttr('lk01DisrLeftBgImg', my.defLk01DisrLeftBgImg, url);
        my.getTmplAttr('lk01DisrLeftAnim', my.defLk01DisrLeftAnim, str);
        my.getTmplAttr('lk01DisrRightTxt', emptyStr, str);
        my.getTmplAttr('lk01DisrRightTxtCol', my.defLk01DisrRightTxtCol, str);
        my.getTmplAttr('lk01DisrRightTxtBgCol', my.defLk01DisrRightTxtBgCol, str);
        my.getTmplAttr('lk01DisrRightBgImg', my.defLk01DisrRightBgImg, url);
        my.getTmplAttr('lk01DisrRightAnim', my.defLk01DisrRightAnim, str);
        my.getTmplAttr('lk01SmallprintTxt', emptyStr, str);
        my.getTmplAttr('lk01SmallprintTxtCol', my.defLk01SmallprintTxtCol, str);

        my.getTmplAttr('lk02BgImg', my.emptyPng, url);
        my.getTmplAttr('lk02HlTxt', emptyStr, str);
        my.getTmplAttr('lk02HlTxtCol', my.defLk02HlTxtCol, str);
        my.getTmplAttr('lk02HlBgImg', my.emptyPng, url);



        my.getTmplAttr('introImg', emptyStr, url);
        if (my.introImg !== '') {
            my.loadIntro = true;
            my.hasIntro = true;
        }
        my.getTmplAttr('showIntro', 'defShowIntro', bool);
        my.getTmplAttr('introLink', 'defIntroLink', str);
        my.getTmplAttr('introTime', 'introTime', num);

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
        +'  width: 45px;'
        +'  height: auto;'
        +'  position: absolute;'
        +'  bottom: 5px;'
        +'  left: 5px;'
        +'}'


        +'#BannerBG {'
        +'  background-image: url('+ my.BannerBG_768 +');'
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
        +'  background-image: url('+ my.BannerBG2_768 +');'
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
        +'  background-image: url('+ my.BannerBG3_768 +');'
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
        +'  background-image: url('+ my.BannerBG_768 +');'
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
        +'  height: 110px;'
        +'  top: 5px;'
        +'  right: 50px;'
        +'  animation-name: smartphoneAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'
     
        +'@keyframes smartphoneAni {'
        +'  0% {opacity: 0; top:100px;}'
        +'  5% {opacity: 1; top:5px;}'
        +'  25% {opacity: 1; top:5px;}'
        +'  30% {opacity: 0; top:100px;}'
        +'  100% {opacity: 0; top:100px;}'
        +'}'

        +'.seq01ProdImgName {'
        +'  position: absolute;'
        +'  width: 80px;'
        +'  height: auto;'
        +'  left: 220px;'
        +'  top: 50%;'
        +'  margin-top: -12px;'
        +'  animation-name: smartphoneTitleAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes smartphoneTitleAni {'
        +'  0% {opacity: 0;}'
        +'  5% {opacity: 1;}'
        +'  25%{opacity: 1;}'
        +'  30%{opacity: 0;}'
        +'  100% {opacity: 0;}'
        +'}'

        +'.seq01DisrTopBG {'
        +'  position: absolute;'
        +'  background-image: url('+ my.seq01DisrTop2BG +');'
        +'  background-repeat: no-repeat;'
        +'  width: 95px;'
        +'  height: 50px;'
        +'  left: 70px;'
        +'  top: 0px;'
        +'  padding-top: 10px;'
        +'  transform-origin: left top;'
        +'  animation-name: disturberTopAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-delay: .1s;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'.seq01DisrTopTxt {'
        +'  font-family: FrutigerLTPro-77BlkCn;'
        +'  font-size: 12px;'
        +'  line-height: 13px;'
        +'  letter-spacing: 0px;'
        +'  width: 90px;'
        +'  margin-left: 11px;'
        +'  text-align: left;'
        +'  color: ' + my.seq01DisrTopTxtCol + ';'
        +'}'
        
        +'@keyframes disturberTopAni {'
        +'  0% {opacity:0;top:-100px;}'
        +'  5% {opacity:1;top:0px;}'
        +'  25%{opacity:1;top:0px;}'
        +'  30%{opacity:0;top:0px;}'
        +'  100% {opacity:0;top:0px;}'
        +'}'


        // Step 2

        +'.smartphoneBroken {'
        +'  position: absolute;'
        +'  width: 468px;'
        +'  height: auto;'
        +'  top: 0px;'
        +'  left: 0px;'
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
        +'  width: 468px;'
        +'  height: auto;'
        +'  top: 0px;'
        +'  left: 0px;'
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
        +'  width: 468px;'
        +'  height: auto;'
        +'  top: 0px;'
        +'  left: 0px;'
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
        +'  font-size: 7px;'
        +'  text-align: center;'
        +'  line-height: 10px;'
        +'  letter-spacing: 0px;'
        +'  left: 70px;'
        +'  bottom: 5px;'
        +'  position: absolute;'
        +'  opacity: 0;'
        +'  animation-name: footer_zweiAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes footer_zweiAni {'
        +'  0% {bottom: 5px;opacity: 0;}'
        +'  30% {bottom: 5px;opacity: 0;}'
        +'  34% {bottom: 5px;opacity: 1;}'
        +'  56% {bottom: 5px;opacity: 1;}'
        +'  60% {bottom: 5px;opacity: 0;}'
        +'  100% {bottom: 5px;opacity: 0}'
        +'}'

        +'.seq02HeadTxt {'
        +'  position: absolute;'
        +'  font-family: FrutigerLTPro-77BlkCn;'
        +'  font-size: 16px;'
        +'  padding-top:0px;'
        +'  top: 22px;'
        +'  left: 108px;'
        +'  animation-name: headlineAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-delay: .1s;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'.seq02HeadTxtBG {'
        +'  position: absolute;'
        +'  width:35px;'
        +'  top: 23px;'
        +'  left: 70px;'
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
        +'  font-size: 7.5px;'
        +'  line-height: 16px;'
        +'  letter-spacing: 0px;'
        +'  text-align: left;'
        +'  padding-top: 5px;'
        +'  margin-left: 5px;'
        +'  color: ' + my.seq02DisrRightTxtCol + ';'
        +'}'

        +'.seq02DisrRightBG {'
        +'  position: absolute;'
        +'  width: 140px;'
        +'  height: 60px;'
        +'  top:-5px;'
        +'  right:-30px;'
        +'  opacity: 0;'
        +'  background: url(' + my.seq01DisrTopBG + ') no-repeat;'
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
        +'  font-size: 7.5px;'
        +'  line-height: 9px;'
        +'  letter-spacing: 0px;'
        +'  text-align: left;'
        +'  padding-left: 10px;'
        +'  margin-left: 30px;'
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
        +'  font-size: 7.5px;'
        +'  line-height: 9px;'
        +'  letter-spacing: 0px;'
        +'  text-align: left;'
        +'  padding-left: 10px;'
        +'  margin-left: 30px;'
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
        +'  font-size: 7.5px;'
        +'  line-height: 9px;'
        +'  letter-spacing: 0px;'
        +'  text-align: left;'
        +'  padding-left: 10px;'
        +'  margin-left: 30px;'
        +'  animation-name: seq02DisrRightTxtAni3;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'  color: ' + my.seq02DisrRightTxtCol + ';'
        +'  background: url(' + my.seq02DisrRightTxtulBG + ') no-repeat left center / contain;'
        +'}'

        +'@keyframes disturberRightAni {'
        +'  0% {opacity: 0;transform: rotateX(-90deg);}'
        +'  32% {opacity: 0;transform: rotateX(-90deg);}'
        +'  37% {opacity: 1;transform: rotateX(0deg);}'
        +'  55% {opacity: 1;transform: rotateX(0deg);}'
        +'  60% {opacity: 0;transform: rotateX(-90deg);}'
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
        +'  position: absolute;'
        +'  padding: 4px 6px 5px;'
        +'  right: 15px;'
        +'  top:32px;'
        +'  width: 98px;'
        +'  height: 20px;'
        +'  text-align: left;'
        +'  background-color: ' + my.seq03CtaBgCol + ';'
        +'  animation-name: ctaAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes ctaAni {'
        +'  0% {top: 20px;opacity: 0}'
        +'  62% {top: 20px;opacity: 0}'
        +'  68% {top: 20px;opacity: 1}'
        +'  69% {top: 23px;opacity: 1}'
        +'  70% {top: 20px;opacity: 1}'
        +'  73% {top: 20px;opacity: 1}'
        +'  74% {top: 23px;opacity: 1}'
        +'  75% {top: 20px;opacity: 1}'
        +'  100% {top: 20px;opacity: 1}'
        +'}'

        +'.seq03CtaTxt {'
        +'  font-size: 11px;'
        +'  line-height: 16px;'
        +'  text-align: center;'
        +'  color: ' + my.seq03CtaTxtCol + ';'
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
        +'  0% {bottom: 0px;left:500px;opacity: 0;}'
        +'  62% {bottom: 0px;left:500px;opacity: 0;}'
        +'  68% {bottom: 11px;left:446px;opacity: 1;}'
        +'  69% {bottom: 8px;left:446px;opacity: 1;}'
        +'  70% {bottom: 11px;left:446px;opacity: 1;}'
        +'  73% {bottom: 11px;left:446px;opacity: 1;}'
        +'  74% {bottom: 8px;left:446px;opacity: 1;}'
        +'  75% {bottom: 11px;left:446px;opacity: 1;}'
        +'  99.8% {bottom: 11px;left:446px;opacity: 0;}'
        +'  100% {bottom: 11px;left:446px;opacity: 0;}'
        +'}'

        +'.footer {'
        +'  font-family: FrutigerLTPro-57Cn, Arial, sans-serif;'
        +'  font-size: 7px;'
        +'  text-align: center;'
        +'  line-height: 10px;'
        +'  letter-spacing: 0px;'
        +'  position: absolute;'
        +'  max-width:190px;'
        +'  width:180px;'
        +'  left:311px;'
        +'  opacity: 0;'
        +'  animation-name: footerAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'

        +'@keyframes footerAni {'
        +'  0% {bottom: 3px;opacity: 0;}'
        +'  60% {bottom: 3px;opacity: 0;}'
        +'  65% {bottom: 3px;opacity: 1;}'
        +'  100% {bottom: 3px;opacity: 1}'
        +'}'
        
        +'.seq03HeadTxt {'
        +'  position: absolute;'
        +'  font-size: 16px;'
        +'  top:-2px;'
        +'  left: 201px;'
        +'  line-height: 28px;'
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
        +'  width: 100px;'
        +'  height: auto;'
        +'  top:80px;'
        +'  left: 50%;'
        +'  transform: translate(-50%, 0);'
        +'  opacity: 0;'     
        +'  transform-origin: right center;'
        +'  animation-name: disturberRight2Ani;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'  animation-delay: .2s;'
        +'}'

        +'@keyframes disturberRight2Ani {'
        +'  0% {opacity: 0;}'
        +'  60% {opacity: 0;}'
        +'  65% {opacity: 1;}'
        +'  100% {opacity: 1;}'
        +'}'

        
        +'.seq03Textul2 {'
        +'  top: 45px;'
        +'  position: absolute;'
        +'}'

        +'.seq03Textul3 {'
        +'  top: 90px;'
        +'  position: absolute;'
        +'}'

        +'.seq03TextulBG {'
        +'  position: absolute;'
        +'  width: 27px;'
        +'  height: auto;'
        +'  background: url(' + my.seq03TextulImg + ') no-repeat left center / contain;'
        +'}'

        +'.seq03TextulHead {'
        +'  position: absolute;'
        +'  font-size: 24px;'
        +'  color: #F8EF1A;'
        +'  left: 30px;'
        +'}'
        
        +'.seq03TextulSub {'
        +'  position: absolute;'
        +'  font-size: 12px;'
        +'  left: 30px;'
        +'  top: 26px;'
        +'  text-transform: uppercase;'
        +'}'
        
        +'.underscore {'
        +'  position: absolute;'        
        +'  top: 135px;'
        +'  left: -4px;'
        +'  width: 100px;'
        +'  height:auto;'
        +'}'

        +'.pricefrom {'
        +'  position: absolute;'        
        +'  top: 140px;'
        +'  position: absolute;'
        +'  font-size: 12px;'
        +'  color: #F8EF1A;'
        +'}'

        +'.price {'
        +'  position: absolute;'        
        +'  top:-59px;'
        +'  left: 20px;'
        +'  width:96px;'
        +'  position: absolute;'
        +'  font-size: 24px;'
        +'  color: #F8EF1A;'
        +'}'
        
        +'.pricefootnote {'
        +'  position: absolute;'
        +'  font-size: 8px;'
        +'  font-family: FrutigerLTPro-57Cn, Arial, sans-serif;'
        +'  top: 37px;'
        +'  left: 242px;'
        +'  width: 59px;'
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
        +'  height: 93px;'
        +'  left: 82px;'
        +'  top: 18px;'
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
        +'  height: 98px;'
        +'  left: 103px;'
        +'  top: 10px;'
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
        +'  height: 89px;'
        +'  left: 125px;'
        +'  top: 5px;'
        +'  opacity: 0;'
        +'  animation-name: smartphoneSmallAni;'
        +'  animation-duration: 15s;'
        +'  animation-timing-function: ease-in-out();'
        +'  animation-fill-mode: forwards;'
        +'  animation-iteration-count: 2;'
        +'}'
        
        +'@keyframes smartphoneSmallAni {'
        +'  0% {margin-left: 15px;opacity: 0;}'
        +'  60% {margin-left: 15px;opacity: 0;}'
        +'  65% {margin-left: 15px;opacity: 1;}'
        +'  100% {margin-left: 15px;opacity: 1;}'
        +'}'

        + 'sup {'
        + '    vertical-align: middle;'
        + '    position: relative;'
        + '    top: -0.6em;'
        + '    font-size: 45%;'
        + '}'

        
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

        + '.lk01HlTxtCtr {'
        + '    position: absolute;'
        + '    top: 6px;'
        + '    left: 0px;'
        + '    width: ' + my.bannerW + 'px;'
        + '}'

        + '.lk01HlTxtTblCtr {'
        + '    display: table-cell;'
        + '    width: ' + my.bannerW + 'px;'
        + '    vertical-align: middle;'
        + '}'

        + '.lk01HlTxt {'
        + '    font-size: 28px;'
        + '    letter-spacing: 0px;'
        + '    text-align: center;'
        + '    color: ' + my.lk01HlTxtCol + ';'
        + '}'

        + '.lk01SPrintCtr {'
        + '    position: absolute;'
        + '    top: 228px;'
        + '    left: 3px;'
        + '    width: 240px;'
        + '    text-align: left;'
        + '}'

        + '.lk01SPrintTxt {'
        + '    font-family: FrutigerLTPro-57Cn, Arial, sans-serif;'
        + '    font-weight: 400;'
        + '    font-size: 10px;'
        + '    letter-spacing: -0.1px;'
        + '    text-shadow: 0px 0px 2px rgba(0,0,0,0.6);'
        + '}'

        + '.lk01DisrLeftCtr {'
        + '    width: 155px;'
        + '    height: 170px;'
        + '    position: absolute;'
        + '    top: 51px;'
        + '    left: 0;'
        + '    background: url(' + my.lk01DisrLeftBgImg + ') no-repeat center center / contain;'
        + '}'

        + '.lk01DisrLeftCtr.flip {'
        + '    perspective: 1000px;'
        + '    transform: rotateY(-90deg);'
        + '    transform-style: preserve-3d;'
        + '    transform-origin: left;'
        + '    transition: transform 666ms cubic-bezier(0.56, 0.56, 0.27, 1.55)'
        + '}'

        + '.lk01DisrLeftCtr.flip.showFlip {'
        + '    transform: rotateY(0deg);'
        + '}'

        + '.lk01DisrRightCtr {'
        + '    width: 130px;'
        + '    height: 118px;'
        + '    position: absolute;'
        + '    top: 69px;'
        + '    right: 0px;'
        + '    background: url(' + my.lk01DisrRightBgImg + ') no-repeat center center / contain;'
        + '}'

        + '.lk01DisrRightCtr.flip {'
        + '    perspective: 1000px;'
        + '    transform: rotateY(90deg);'
        + '    transform-style: preserve-3d;'
        + '    transform-origin: right;'
        + '    transition: transform 666ms cubic-bezier(0.56, 0.56, 0.27, 1.55)'
        + '}'

        + '.lk01DisrRightCtr.flip.showFlip {'
        + '    transform: rotateY(0deg);'
        + '}'

        + '.lk01DisrRightTxt {'
        + '    display: inline-block;'
        + '    max-width: 108px;'
        + '    font-size: 14px;'
        + '    line-height: 15px;'
        + '    white-space: nowrap;'
        + '    letter-spacing: 0px;'
        + '    padding: 2px 3px 1px;'
        + '    color: ' + my.lk01DisrRightTxtCol + ';'
        + '    background: ' + my.lk01DisrRightTxtBgCol + ';'
        + '    position: absolute;'
        + '    top: 18px;'
        + '    left: 14px;'
        + '}'


        + '.lk02BgImgCtr {'
        + '    background: url(' + my.lk02BgImg + ') no-repeat center center / contain;'
        + '}'

        + '.lk02HlTxtCtr {'
        + '    position: absolute;'
        + '    top: 0px;'
        + '    left: 0px;'
        + '    width: ' + my.bannerW + 'px;'
        + '    height: ' + my.bannerH + 'px;'
        + '    background: url(' + my.lk02HlBgImg + ') no-repeat center center / contain;'
        + '}'

        + '.lk02HlTxtTblCtr {'
        + '    display: table-cell;'
        + '    width: 132px;'
        + '    height: 56px;'
        + '    vertical-align: middle;'
        + '    position: relative;'
        + '    top: 0px;'
        + '    left: 155px;'
        + '}'

        + '.lk02HlTxt {'
        + '    font-size: 16px;'
        + '    line-height: 19px;'
        + '    letter-spacing: 0px;'
        + '    text-align: left;'
        + '    color: ' + my.lk02HlTxtCol + ';'
        + '}'

        + '.lk02ProdImg {'
        + '    width: 102px;'
        + '    height: 192px;'
        + '    position: absolute;'
        + '    left: 10px;'
        + '    top: 22px;'
        + '    background: url(' + p.image + ') no-repeat center center / contain;'
        + '}'

        + '.lk02ProdManuImg {'
        + '    width: 73px;'
        + '    height: 12px;'
        + '    position: absolute;'
        + '    left: 125px;'
        + '    top: 96px;'
        + '    background: url(' + p.manufacturerImage + ') no-repeat center center / contain;'
        + '}'

        + '.lk02ProdNameImg {'
        + '    width: 149px;'
        + '    height: 28px;'
        + '    position: absolute;'
        + '    left: 125px;'
        + '    top: 115px;'
        + '    background: url(' + p.productNameImage + ') no-repeat center center / contain;'
        + '}'

        + '.lk02CtaCtr {'
        + '    width: 100px;'
        + '    height: 43px;'
        + '    position: absolute;'
        + '    top: 196px;'
        + '    left: 128px;'
        + '    transform: translateY(60px);'
        + '}'

        + '.lk02CtaCtrShow {'
        + '    opacity: 1;'
        + '    transform: translateY(0px);'
        + '    transition: transform 466ms cubic-bezier(0.175, 0.885, 0.350, 1.415), opacity 333ms;'
        + '}'



        + '.lk02CtaTxt:before {'
        + '    display: inline-block;'
        + '    content: "»";'
        + '    font-size: 15px;'
        + '    position: relative;'
        + '    top: -2px;'
        + '    margin-right: 2px;'
        + '    height: 30px;'
        + '    float: left;'
        + '}'

        + '.obaCtr {'
        + '    position: absolute;'
        + '    top: 0;'
        + '    left: 4px;'
        + '    color: ' + my.obaCol + ';'
        + '    font-size: 10px;'
        + '    display: none;'
        + '}'

        + '.introCtr {'
        + '    transition: opacity 0.5s ease-out;'
        + '}'

        + '#lk01Wrap, #lk02Wrap {'
        + '    transition: opacity 0.66s;'
        + '}'

        + '.opac0 {'
        + '    opacity: 0;'
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
                '<img class="smartphoneBroken" src="' + my.SecondProduct_768 + '"></img>' +
                '<img class="smartphoneBroken2" src="' + my.SecondProduct2_768 + '"></img>' +
                '<img class="smartphoneBroken3" src="' + my.SecondProduct3_768 + '"></img>' +

                '<div class="seq02DisrRightBG">'+
                    '<div class="seq02DisrRightTxt">' + my.seq02DisrRightTxt + '</div>'+
                    '<div class="seq02DisrRightTxtul1">' + my.seq02DisrRightTxtul1 + '</div>'+
                    '<div class="seq02DisrRightTxtul2">' + my.seq02DisrRightTxtul2 + '</div>'+
                    '<div class="seq02DisrRightTxtul3">' + my.seq02DisrRightTxtul3 + '</div>'+
                '</div>'+
                '<img src="' + my.seq02HeadTxtBG + '" class="seq02HeadTxtBG">'+
                '<div class="seq02HeadTxt">'+ my.seq02HeadTxt +'</div>'+

                '<div class="seq03HeadTxt">'+ my.seq03HeadTxt768 +'</div>'+
                '<div class="pricefootnote">' + my.pricefootnote + '</div>' +
                '<div class="seq03TextWall">'+
                    '<img class="price" src="' + my.seqprice + '"></img>' +
                '</div>'+

                '<div class="banner2BG"></div>' +
                '<img class="seq01ProdImgName" src="' + my.seq01ProdImgName + '"></img>' +
                '<img class="seq01ProdImg" src="' + my.seq01ProdImg + '"></img>' +
                
                '<div class="seq01DisrTopBG">'+
                   '<div class="seq01DisrTopTxt">' + my.seq01DisrTopTxt + '</div>'+
                '</div>'+
                '<img class="logo" src="' + my.logo + '">' +
            '</div>'
        );

        my.lk01Wrap = $(my.targetCtr).find('#lk01Wrap');
        my.lk01BgImgCtr = $(my.targetCtr).find('.lk01BgImgCtr');
        my.lk01HLImgCtr = $(my.targetCtr).find('.lk01HLImgCtr');
        my.lk01DisrLeftCtr = $(my.targetCtr).find('.lk01DisrLeftCtr');
        my.lk01DisrRightCtr = $(my.targetCtr).find('.lk01DisrRightCtr');
        my.lk01SPrintCtr = $(my.targetCtr).find('.lk01SPrintCtr');

        my.lk02Wrap = $(my.targetCtr).find('#lk02Wrap');
        my.lk02BgImgCtr = $(my.targetCtr).find('.lk02BgImgCtr');
        my.lk02HlTxtCtr = $(my.targetCtr).find('.lk02HlTxtCtr');
        my.lk02ProdImg = $(my.targetCtr).find('.lk02ProdImg');
        my.lk02ProdManuImg = $(my.targetCtr).find('.lk02ProdManuImg');
        my.lk02ProdNameImg = $(my.targetCtr).find('.lk02ProdNameImg');
        my.lk02CtaCtr = $(my.targetCtr).find('.lk02CtaCtr');

        my.introCtr = $(my.targetCtr).find('.introCtr');
        my.obaCtr = $(my.targetCtr).find('.obaCtr');
        if (my.showOBA) {
            my.obaCtr.append(my.obaTxt);
            my.obaCtr.css('display', 'block');
        }

        my.clickButton = $(my.targetCtr).find('#clickButton');

        // check disrupter left anim type
        switch (my.lk01DisrLeftAnim) {
        case 'pop':
            my.lk01DisrLeftCtr.addClass('pop');
            break;
        case 'slide':
            my.lk01DisrLeftCtr.addClass('slide');
            break;
        case 'flip':
        default:
            my.lk01DisrLeftCtr.addClass('flip');
            break;
        }

        // check disrupter right anim type
        switch (my.lk01DisrRightAnim) {
        case 'pop':
            my.lk01DisrRightCtr.addClass('pop');
            break;
        case 'slide':
            my.lk01DisrRightCtr.addClass('slide');
            break;
        case 'flip':
        default:
            my.lk01DisrRightCtr.addClass('flip');
            break;
        }

        // intro look
        if (my.hasIntro && my.showIntro) {
            h = ''
            + '<div id="intro_1" class="introImg">'
                + '<img id="intro" src="' + my.introImg + '" alt="" />'
            + '</div>';
            my.introCtr.append(h);
            my.introCtr.find('#intro').load(function() {
                my.introLoaded = true;
                my.addIntroLook();
            }).error(function() {
                my.hasIntro = false;
            });
        }
    };

    return my;
}(NFQDA || {}));
// create format html module
/* eslint-disable no-magic-numbers */
/* global */

/************************************************************
 * animation module
 * animates the looks
 */
var NFQDA = (function(my) {
    'use strict';

    /**
     * showLook - animation depending on current look
     * @param {boolean} dir - direction of animation loop, true: forward, false: backward
     */
    my.showLook = function() {
        my.runTime = new Date().getTime() - my.startTime;

        //my.debug(my.lookName + ' ' + my.runTime);

        switch (my.lookName) {
        case 'intro':
            // set custom clickurl
            my.clickButton.off('click mouseenter mouseleave');
            my.setClkBtnCstm(my.introLink, 'intro_link');

            // show intro container
            my.introCtr.removeClass('opac0');

            // animate intro image
            my.showIntroOutroImg(my.introCtr.find('#intro_1'), 'introImgShow', 0, true);

            // set interval
            my.currLoopTime = my.introTime;
            my.setNewTimeout(my.introTime);

            break;

        case 'look01':
            // set clickurl
            my.clickButton.off('click mouseenter mouseleave');
            my.setClkBtn(my.products[0]);

            // hide possible previous look
            my.hideIntro();

            // show look01
            my.lk01Wrap.removeClass('opac0');

            // show right disrupter
            setTimeout(function() {
                switch (my.lk01DisrRightAnim) {
                case 'flip':
                default:
                    my.lk01DisrRightCtr.addClass('showFlip');
                    break;
                }
            }, 700);

            // show left disrupter
            setTimeout(function() {
                switch (my.lk01DisrLeftAnim) {
                case 'flip':
                default:
                    my.lk01DisrLeftCtr.addClass('showFlip');
                    break;
                }
            }, 900);

            // hide left right disrupter
            setTimeout(function() {
                switch (my.lk01DisrRightAnim) {
                case 'flip':
                default:
                    my.lk01DisrRightCtr.removeClass('showFlip');
                    break;
                }
                switch (my.lk01DisrLeftAnim) {
                case 'flip':
                default:
                    my.lk01DisrLeftCtr.removeClass('showFlip');
                    break;
                }
            }, my.look01Time - 200);

            // set timeout for next animation
            my.currLoopTime = my.look01Time;
            my.setNewTimeout(my.look01Time);

            break;

        case 'look02':
            // set clickurl
            my.clickButton.off('click mouseenter mouseleave');
            my.setClkBtn(my.products[0]);

            // show look02
            my.lk02Wrap.removeClass('opac0');

            // show cta
            setTimeout(function() {
                my.lk02CtaCtr.addClass('lk02CtaCtrShow');
            }, 1000);

            //************************************************************
            // reset elements to be reset and start end animation or stop animation if needed
            if (my.gdnStopTime === 0 || (my.runTime + my.look02Time < my.gdnStopTime)) {
                my.lk01Wrap.addClass('opac0');
                setTimeout(function() {
                    my.lk02Wrap.addClass('opac0');
                    switch (my.lk01DisrRightAnim) {
                    case 'flip':
                    default:
                        my.lk01DisrRightCtr.removeClass('showFlip');
                        break;
                    }
                    switch (my.lk01DisrLeftAnim) {
                    case 'flip':
                    default:
                        my.lk01DisrLeftCtr.removeClass('showFlip');
                        break;
                    }
                }, my.look02Time - 300);

                setTimeout(function() {
                    my.lk02CtaCtr.removeClass('lk02CtaCtrShow');
                }, my.look02Time + 800);
            } else {
                // gdn brake
                my.killLookTimer();

                return;
            }

            // set timeout for next animation
            my.currLoopTime = my.look02Time;
            my.setNewTimeout(my.look02Time);

            break;
        // no default
        }
    };

    return my;
}(NFQDA || {}));
// create format html module
/* global */

/* ***********************************************************
 * animation helper functions module
 */
var NFQDA = (function(my) {
    'use strict';

    /**
     * startAnimation - start (init) animation
     */
    my.startAnimation = function() {
        my.debug('- starting animation\n\n', true);
        // remove loader display
        $(my.targetCtr).find('#html-loader').remove();

        // start animation
        my.startTime = new Date().getTime();

        setTimeout(function() {
            my.showNextLook();
        }, 10); // eslint-disable-line no-magic-numbers
    };

    /**
     * showNextLook - show next look
     * @param {boolean} user - flag for user initiated look switch
     */
    my.showNextLook = function(user) {
        if (++my.currLook > my.numAllLooks) {
            my.currLook = 1;
        }
        my.lookName = my.looks[my.currLook - 1]; // eslint-disable-line no-magic-numbers
        if (user && my.lookName === 'intro') {
            my.showNextLook();
        } else {
            my.showLook(true);
        }
    };

    /**
     * hideIntro - hide intro look
     */
    my.hideIntro = function() {
        if (my.hasIntro && my.introLoaded && my.showIntro) {
            // hide intro container
            my.showIntroOutroImg(my.introCtr.find('#intro_1'), 'introImgShow', 0, false); // eslint-disable-line no-magic-numbers
            // hide intro container
            my.introCtr.addClass('opac0');
        }
    };

    /**
     * showIntroOutroImg - show or hide intro image
     * @param {object} img - image element
     * @param {string} c - class name
     * @param {number} d - delay
     * @param {boolean} p - flag for add or remove class
     */
    my.showIntroOutroImg = function(img, c, d, p) {
        setTimeout(function() {
            if (p) {
                img.addClass(c);
            } else {
                img.removeClass(c);
            }
        }, d);
    };

    /**
     * setNewTimeout - set new interval
     * @param {number} ms - milliseconds of interval
     */
    my.setNewTimeout = function(ms) {
        clearTimeout(my.lookTimer);
        if (my.gdnStopped) {
            return;
        }
        my.lookTimer = setTimeout(function() {
            my.showNextLook();
        }, ms);
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