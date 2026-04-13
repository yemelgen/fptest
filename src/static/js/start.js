(function () {
    "use strict";
    var supportsES6 = function() {
        try {
            new Function("() => {}");
            return true;
        }
        catch (err) {
            return false;
        }
    }();
    if (!supportsES6) {
        var lang = window.navigator.browserLanguage;
        switch (lang) {
            case 'ru-RU':
                var title = "Ваш веб-браузер не поддерживается";
                var message = "Ваш веб-браузер устарел и больше не поддерживается.<br/>Пожалуйства обновите ваш веб-браузер или используйте другой.";
                break;
            case 'zh-CN':
            case 'zh-TW':
            case 'zh-HK':
            case 'zh-SG':
                var title = "您的网页浏览器不受支持";
                var message = "您的网页浏览器已过时且不再受支持。<br/>请升级您的网页浏览器或使用其他浏览器。";
                break;
            default:
                var title = "Your web browser is not supported";
                var message = "Your web browser is obsolete and no longer is supported.<br/>Please upgrade your web brower or use an alternative one.";
        }
        document.write("<h1>"+title+"</h1>");
        document.write("<p>"+message+"</p>");
        document.execCommand("Stop");
    } else {
        document.title = 'Browser Fingerprinting Demo';
        document.getElementById('content').classList.remove('hidden');
    }
})();
