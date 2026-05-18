// funnel.js — Slick slider wizard navigation
// Replicates Dec 2019 funnel behavior:
//   - label.slider-next-select radio click → auto-advance
//   - select.slider-next-select change → auto-advance
//   - .slider-next button click → advance
//   - #next_section → show completion screen
//   - checkboxes show/hide #additional_detail

(function ($) {
  "use strict";

  var $slider = $("#start-question-slider");
  var totalSlides = 0;

  function nextSlide() {
    $slider.slick("slickNext");
  }

  function updateProgress() {
    var current = $slider.slick("slickCurrentSlide");
    var pct = totalSlides > 1 ? (current / (totalSlides - 1)) * 100 : 0;
    $("#quiz-progress-fill").css("width", Math.min(pct, 100) + "%");
  }

  function showCompletionScreen() {
    $slider.addClass("hidden");
    $("#questionnaire-complete").removeClass("hidden");
    $("#quiz-progress-fill").css("width", "100%");
  }

  $slider.slick({
    arrows: false,
    draggable: false,
    swipe: false,
    accessibility: false,
    infinite: false,
    speed: 300,
    adaptiveHeight: true,
  });

  totalSlides = $slider.slick("getSlick").slideCount;

  setTimeout(function () {
    $slider.slick("setPosition");
  }, 0);

  $slider.on("afterChange", function () {
    updateProgress();
  });

  updateProgress();

  // Radio auto-advance
  $(document).on(
    "change",
    'label.slider-next-select input[type="radio"]',
    function () {
      setTimeout(function () {
        var current = $slider.slick("slickCurrentSlide");
        if (current >= totalSlides - 1) {
          showCompletionScreen();
        } else {
          nextSlide();
        }
      }, 200);
    },
  );

  // Select auto-advance (slider-next-select on the select element itself)
  $(document).on("change", "select.slider-next-select", function () {
    if (!$(this).val() || $(this).val() === "0") return;
    setTimeout(function () {
      var current = $slider.slick("slickCurrentSlide");
      if (current >= totalSlides - 1) {
        showCompletionScreen();
      } else {
        nextSlide();
      }
    }, 200);
  });

  // Manual Next buttons (.slider-next)
  $(document).on("click", "a.slider-next, button.slider-next", function (e) {
    e.preventDefault();
    var $btn = $(this);
    if ($btn.prop("disabled") || $btn.hasClass("disabled")) return;

    if ($btn.attr("id") === "next_section") {
      showCompletionScreen();
      return;
    }

    nextSlide();
  });

  // Checkboxes: show/hide optional detail field
  $(document).on("change", 'input[data-question-type="checkbox"]', function () {
    var anyChecked =
      $('input[data-question-type="checkbox"]:checked').length > 0;
    $("#additional_detail").toggleClass("hidden", !anyChecked);
    // scrollHeight gives the full content height regardless of any CSS
    // height:100% constraint on .slick-slide, bypassing Slick's own
    // setHeight() which uses outerHeight() and can read a stale value.
    $slider
      .find(".slick-list")
      .css("height", $slider.find(".slick-current")[0].scrollHeight);
  });

  // Prevent actual form submission
  $("#start-form").on("submit", function (e) {
    e.preventDefault();
    console.log(
      "[pixel-test-site] Form submit intercepted — beacon fired on button click",
    );
  });
})(jQuery);
