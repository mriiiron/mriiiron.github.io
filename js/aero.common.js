function getURLParam() {
    var url = window.location.href;
    return url.substring(url.lastIndexOf("?") + 1, url.length);
}