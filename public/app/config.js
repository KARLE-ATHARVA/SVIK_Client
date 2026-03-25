(function () {
    var hostname = window.location.hostname;

    if (hostname === "localhost") {
        window.VISUALIZER_API_BASE = "http://localhost:5109/";
    } else {
        window.VISUALIZER_API_BASE = "https://api.yourdomain.com/";
    }
})();