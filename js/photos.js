// Shows the top photo in full (no cropping) by using the photo's real width/height.
(function () {
  document.querySelectorAll("[data-fit=natural]").forEach(function (el) {
    var src = window.PHOTOS && PHOTOS[el.dataset.photo]; if (!src) return;
    var i = new Image();
    i.onload = function () {
      var r = i.naturalWidth / i.naturalHeight;
      r = Math.min(Math.max(r, 0.55), 1.4);          // keep within a sensible range
      el.style.aspectRatio = r;
    };
    i.src = src;
  });
})();
