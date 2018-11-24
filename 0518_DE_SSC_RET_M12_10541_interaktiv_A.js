// Mon, 30 Jul 2018 14:57:47 GMT : 1U1_DBTX_18_001
/* eslint-disable no-magic-numbers */
/* global */

// NFQ DynamicAds module
/************************************************************
 * NFQ DynamicAds module
 */
var NFQDA = (function () {
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
    wf.onload = wf.onreadystatechange = function () {
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
var NFQDA = (function (my) {
    'use strict';

    /**
     * fixRelImgUrl - fix the product image url in case it is relative
     * @param {string} url - url of image
     * @returns {string} fixed url
     */
    my.fixRelImgUrl = function (url) {
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
    my.getTmplAttr = function (attr, def, type) {
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
    my.getProdAttr = function (p) {
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
    my.setClkBtn = function (p) {
        my.clickButton.click(p.getClickHandler('_blank'));
    };


    /**
     * setClkBtnCstm - put aditions custom clickhandler
     * @param {type} url custom url to open
     * @param {type} name name of url
     */
    my.setClkBtnCstm = function (url, name) {
        my.clickButton.click(my.api.getCustomClickHandler(url, name, '_blank'));
    };


    /**
     * addIntroLook - adds an intro look
     */
    my.addIntroLook = function () {
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
    my.killLookTimer = function () {
        if (my.gdnStopped) {
            return;
        }
        clearTimeout(my.lookTimer);
        my.gdnStopped = true;
        my.debug('---- ' + my.bannerName + ' stop at ' +
            ((new Date().getTime() - my.startTime) / 1000) // eslint-disable-line no-magic-numbers
            +
            's animation time\n\n');
    };

    /**
     * lightenDarkenColor - lighten or darken a hexcolor
     * @param {string} c - a hexcolor without number sign
     * @param {number} p - value from -100 to 100, negative for darken, positive for lighten
     * @returns {string} hexcolor without number sign
     */
    my.lightenDarkenColor = function (c, p) {
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
    my.getUrlProtocol = function () {
        return window.location.protocol !== 'https:' ? 'http://' : 'https://';
    };


    /**
     * detectFF - detect Firefox browser
     * @returns {boolean} true if firefox detected
     */
    my.detectFF = function () {
        return navigator.userAgent.toLowerCase().indexOf('firefox') > -1; // eslint-disable-line no-magic-numbers
    };


    /**
     * detectIE - detect IE or Edge browser
     * @returns {[number, boolean]} returns version of ie / edge or false if other browser
     */
    my.detectIE = function () {
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
    my.detectApple = function () {
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
var NFQDA = (function (my) {
    'use strict';

    /**
     * init - initialize and collect data for banner
     * @param {object} html5API - reference to aditions html5 api
     * @param {object} win - reference to iframes window
     * @param {object} aditionTarget - reference to aditions target element
     */
    my.init = function (html5API, win, aditionTarget) {
        var p,
            str = 'string',
            bool = 'boolean',
            url = 'url',
            num = 'number',
            emptyStr = '';

        // ************************************************************
        // jQuery plugins here

        // font spy jQuery plugin ('preloader' for webfonts); modified a bit to return name of loaded/failed fontname
        ! function (t, s) {
            'use strict';
            my.fontSpy = function (t, e) {
                var n = s(e.doc).find("html"),
                    o = s(e.doc).find("body"),
                    i = t;
                if ("string" != typeof i || "" === i) throw "No valid fontName!";
                var a = {
                        font: i,
                        fontClass: i.toLowerCase().replace(/\s/g, ""),
                        success: function () {},
                        failure: function () {},
                        testFont: "Courier New",
                        testString: "QW@HhsXJ",
                        glyphs: "",
                        delay: 100,
                        timeOut: 2e3,
                        callback: s.noop
                    },
                    c = s.extend(a, e),
                    r = s("<span>" + c.testString + c.glyphs + "</span>").css("position", "absolute").css("top", "-9999px").css("left", "-9999px").css("visibility", "hidden").css("fontFamily", c.testFont).css("fontSize", "250px");
                o.append(r);
                var u = r.outerWidth();
                r.css("fontFamily", c.font + "," + c.testFont);
                var f = function () {
                        n.addClass("no-" + c.fontClass), c && c.failure && c.failure(c.font), c.callback(new Error("FontSpy timeout")), r.remove()
                    },
                    l = function () {
                        c.callback(), n.addClass(c.fontClass), c && c.success && c.success(c.font), r.remove()
                    },
                    d = function () {
                        setTimeout(p, c.delay), c.timeOut = c.timeOut - c.delay
                    },
                    p = function () {
                        var t = r.outerWidth();
                        u !== t ? l() : c.timeOut < 0 ? f() : d()
                    };
                p()
            }
        }(this, $);
        /*!
         * imagePreLoader : a jquery plugin for preloading images
         * Version: 0.2.0
         * Original author: @nick-jonas
         * Website: https://github.com/nick-jonas/nick-jonas.github.com/tree/master/imageloader
         * Licensed under the MIT license
         */

        (function ($) {

            $.imagePreloader = function (p) {

                var params = $.extend({
                    urls: [],
                    onComplete: function () {},
                    //onUpdate: function(ratio, image) {},
                    onError: function (err) {}
                }, p);

                var loadCount = 0,
                    urls = params.urls,
                    len = urls.length;

                $.each(urls, function (i, item) {

                    var img = new Image();
                    img.src = item;
                    img.onerror = function () {
                        loadCount++;
                        params.onError('Error loading image: ' + item);
                    };

                    /*$('<img/>').attr('src', item).load(function(res) {
                        loadCount++;
                        params.onUpdate(loadCount/len, urls[loadCount-1]);
                        if (loadCount === len) params.onComplete();
                    });*/

                    $('<img/>').attr('src', item).on('load', function (res) {
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

        my.getTmplAttr('bgspot_200', my.bgspot_200, url);
        my.getTmplAttr('logo', my.logo, url);

        my.getTmplAttr('product_title_1', emptyStr, str);
        my.getTmplAttr('product_title_2', emptyStr, str);
        my.getTmplAttr('product_title_3', emptyStr, str);
        my.getTmplAttr('product_title_4', emptyStr, str);
        my.getTmplAttr('product_title_5', emptyStr, str);

        my.getTmplAttr('product_title_size_1', emptyStr, str);
        my.getTmplAttr('product_title_size_2', emptyStr, str);
        my.getTmplAttr('product_title_size_3', emptyStr, str);
        my.getTmplAttr('product_title_size_4', emptyStr, str);
        my.getTmplAttr('product_title_size_5', emptyStr, str);

        my.getTmplAttr('product_image_1', my.product_image_1, url);
        my.getTmplAttr('product_image_2', my.product_image_2, url);
        my.getTmplAttr('product_image_3', my.product_image_3, url);
        my.getTmplAttr('product_image_4', my.product_image_4, url);
        my.getTmplAttr('product_image_5', my.product_image_5, url);

        

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
            onComplete: function () {
                my.firstImgLoaded = true;
                my.debug('- 1st product image loaded\n\n', true);
            },
            onError: function () {
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
var NFQDA = (function (my) {
    'use strict';

    // HTML5API
    my.api;
    // check url protocol, must be https: or http:
    my.urlProtocol = my.getUrlProtocol();
    // folder name of customer on adserver, suffix will be added later based on network
    my.customerName = '1u1';
    // change network number in adServerPath if required
    my.adServerDomain = 'imagesrv.adition.com/'; //'web.nfq.de/test/markus/';
    my.adServerPath = ''; // will be set later based on network
    my.assetsFolder = 'assets/'; //'_swf/'
    my.fontsFolder = my.assetsFolder + 'fonts/'; //'_fonts/'
    my.adServer = ''; // will be set later based on network
    my.fallbackLink = 'https://www.1und1.de/';

    // used webfonts
    my.usedFonts = ['FrutigerLTPro-57Cn', 'FrutigerLTPro-77BlkCn'];

    // adition networks and suffixes
    my.networks = {
        'std': 3202
    };
    my.networkSuffixes = {
        'std': ''
    };

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
    my.tmpltTypeExt = 'std'; // default is standard

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
var NFQDA = (function (my) {
    'use strict';

    // optional overwrites of common setup here
    // my.exampleOverwrite = whatever

    /**
     * create dynamic banner styles in document
     * @param {object} doc - the reference to document
     */
    my.createCss = function (doc) {
        var p = my.products[0];
        var style = doc.createElement('style');

        style.type = 'text/css';
        style.innerHTML = ''

            // General Setup
            +
            '@font-face {' +
            '    font-family: FrutigerLTPro-57Cn;' +
            '    src: url("http://1u1.dynamic-ads.de/api/uploads/assets_files/5baa786fc1c58.woff") format("opentype");' +
            '}'

            +
            '@font-face {' +
            '    font-family: FrutigerLTPro-77BlkCn;' +
            '    src: url("http://1u1.dynamic-ads.de/api/uploads/assets_files/5baa793ee20a9.woff") format("opentype");' +
            '}'

            +
            '@font-face {' +
            '    font-family: websans_extra_black;' +
            '    src: url("http://1u1.dynamic-ads.de/api/uploads/assets_files/5bbc9df0bc608.woff") format("opentype");' +
            '}'

            +
            '* {' +
            '    box-sizing: border-box;' +
            '    margin: 0;' +
            '    -webkit-font-smoothing: antialiased;' +
            '    -moz-osx-font-smoothing: grayscale; text-rendering: geometricprecision;' +
            '}'

            +
            'body {' +
            '    font-family: FrutigerLTPro-77BlkCn, Arial, sans-serif;' +
            '    font-weight: 400;' +
            '    color: #fff;' +
            '}'

            +
            '#banner {' +
            '   background-image: url(' + my.bgspot_200 + ');' +
            '   background-size: cover;' +
            '   background-repeat: no-repeat;' +
            '   background-color: #0e3274;' +
            '   width: 100%;' +
            '   height: 100%;' +
            '   position: absolute;' +
            '   left: 0px;' +
            '   top: 0px;' +
            '}'

            +
            '.logo {' +
            '   height: auto;' +
            '   width: 50px;' +
            '   position: absolute;' +
            '   bottom: 15px;' +
            '   left: 50%;' +
            '   transform: translate(-50%,0%);' +
            '   outline-color: white;' +
            '   outline-style: solid;' +
            '   outline-width: 1px;' +
            '}'

            +
            '#title {' +
            '   font-family: FrutigerLTPro-77BlkCn;' +
            '   font-size:16px;' +
            '   color:#134093;' +
            '   text-align:center;' +
            '   padding-top:5px;' +
            '   height: 30px;' +
            '   background-color: #ffed00;' +
            '   display: flex;' +
            '   justify-content: center;' +
            '}'

            +
            '.product_title_1 {' +
            '   position: absolute;' +
            '   font-size: ' + my.product_title_size_1 + ';' +
            '}'

            +
            '.product_title_2 {' +
            '   position: absolute;' +
            '   font-size: ' + my.product_title_size_2 + ';' +
            '}'

            +
            '.product_title_3 {' +
            '   position: absolute;' +
            '   font-size: ' + my.product_title_size_3 + ';' +
            '}'

            +
            '.product_title_4 {' +
            '   position: absolute;' +
            '   font-size: ' + my.product_title_size_4 + ';' +
            '}'

            +
            '.product_title_5 {' +
            '   position: absolute;' +
            '   font-size: ' + my.product_title_size_5 + ';' +
            '}'

            +
            '.product_image_1 {' +
            '   position: absolute;' +
            '   transform: translate(-50%, -50%);'+
            '   width: 90px;' +
            '   height: auto;' +
            '   top: 135px;' +
            '   left: 50%;' +
            '}'

            +
            '.itemwrapper {' +
            '   width: 40px;' +
            '   height: auto;' +
            '   padding: 2px 4px 20px 4px;'+
            '}'

            +
            '.itemwrapper:hover {' +
            '   background-color: #ffed00;' +
            '}'

            +
            '.product_item_1 {' +
            '   width: 100%;' +
            '   height: auto;' +
            '}'

            +
            '#items {' +
            '   position: absolute;' +
            '   transform: translate(-50%, 0%);'+
            '   left: 50%;' +
            '   width: 100px;' +
            '   height: 200px;' +
            '   bottom: 50px;' +
            '   display: flex;'+
            '   justify-content: space-evenly;'+
            '   flex-wrap: wrap;'+
            '   align-items: center;'+
            '}'

            

            +
            '.bannerHTML5, .lkWrap, #bannerBg {' +
            '    position: absolute;' +
            '    top: 0;' +
            '    left: 0;' +
            '    width: ' + my.bannerW + 'px;' +
            '    height: ' + my.bannerH + 'px;' +
            '    overflow: hidden;' +
            '  border: 1px solid #000000;' +
            '}'

            +
            '#html-loader, #clickButton, .lk01BgImgCtr, .lk01HlImgCtr, .lk02BgImgCtr, .introCtr, .introImg {' +
            '    position: absolute;' +
            '    top: 0;' +
            '    left: 0;' +
            '    width: 100%;' +
            '    height: 100%;' +
            '    display: block;' +
            '}'

            +
            '#clickButton {' +
            '    border: ' + my.border + ';' +
            '    cursor: pointer;' +
            '}'

            +
            '#bannerBg {' +
            '    background: ' + my.bgCol + ';' +
            '}'

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
var NFQDA = (function (my) {
    'use strict';

    /**
     * checkFonts - wait for webfonts loaded (or failed),
     * then preload intro image if any then start animation
     * @param {Array} fonts - array with used font names
     */
    my.checkFonts = function (fonts) {
        // convert fonts array to a string without ','
        var fs = fonts.toString().replace(/,/g, '');
        var i;

        my.debug('- checking webfonts\n\n', true);

        // check fonts using fontSpy
        for (i in fonts) {
            my.fontSpy(fonts[i], {
                success: fontLoadResult,
                failure: fontLoadResult,
                doc: my.targetDocument
            });
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
                setTimeout(function () {
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
var NFQDA = (function (my) {
    'use strict';

    /**
     * create html of banner within target container
     */
    my.createMainHtml = function () {
        var h;

        // put html into target container
        $(my.targetCtr).html(
            '<div id="' + my.bannerName + '" class="bannerHTML5">' +
            '<div id="banner">' +
            '<div id="title">' +
                '<span class="product_title_1">' + my.product_title_1 + '</span>' +
                // '<span class="product_title_2">' + my.product_title_2 + '</span>' +
                // '<span class="product_title_3">' + my.product_title_3 + '</span>' +
                // '<span class="product_title_4">' + my.product_title_4 + '</span>' +
                // '<span class="product_title_5">' + my.product_title_5 + '</span>' +
            '</div>' +
            '<div id="image">' +
                '<img class="product_image_1" src="' + my.product_image_1 + '"></img>' +
                // '<img class="product_image_2" src="' + my.product_image_2 + '"></img>' +
                // '<img class="product_image_3" src="' + my.product_image_3 + '"></img>' +
                // '<img class="product_image_4" src="' + my.product_image_4 + '"></img>' +
                // '<img class="product_image_5" src="' + my.product_image_5 + '"></img>' +
            '</div>' +
            '<div id="preis"></div>' +
            '<div id="cta"><span id="btn-cta"></span></div>' +
            '<div id="items">' +
                '<div class="itemwrapper">' +
                    '<img class="product_item_1" src="' + my.product_image_1 + '"></img>' +
                '</div>' +        
                    // '<img class="product_item_2" src="' + my.product_image_2 + '"></img>' +
                    // '<img class="product_item_3" src="' + my.product_image_3 + '"></img>' +
                    // '<img class="product_item_4" src="' + my.product_image_4 + '"></img>' +
                    // '<img class="product_item_5" src="' + my.product_image_5 + '"></img>' +
            '</div>' +
            '<img class="logo" src="' + my.logo + '">' +
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
var NFQDA = (function (my) {
    'use strict';

    /**
     * debug - output in console; if p is true elapsed time will be shown
     * @param {string} str - string to output
     * @param {boolean} p - flag for output of elapsed time
     */
    my.debug = function (str, p) {
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
    my.debugSetup = function () {
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
    my.debugProducts = function () {
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
    my.debugError = function (str) {
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
    my.debugAttrWarn = function (str, type) {
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
var NFQDA = (function (my) {
    'use strict';

    $ADLIB.DBT.runDynamicAdInitializer(function (html5API) {
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
        iframeContent = String('' +
            '<!DOCTYPE html>' +
            '<html>' +
            '<head id="bh">' +
            '<meta http-equiv="X-UA-Compatible" content="IE=Edge">' +
            '<meta name="viewport" content="width=device-width,height=device-height,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no">' +
            '<meta charset="utf-8">' +
            '<style type="text/css">body{margin:0}</style>' +
            '</head>' +
            '<body id="bb">' +
            '<div id="bannerTarget"></div>' +
            '</body>' +
            '</html>'
        );

        iframeWindow.contents = iframeContent;
        iframe.src = 'javascript:window["contents"]';
    });

    my.waitForJq = function () {
        if (my.jqReady) {
            clearInterval(my.iv);
            NFQDA.init(my.NFQBanner.api, my.NFQBanner.iframeWindow, my.NFQBanner.aditionTarget);
        }
    };
    my.iv = setInterval(my.waitForJq, 50);

    return my;
}(NFQDA || {}));