// funnel.js — Dec 2019 funnel behavior
// Navigation: label.slider-next-select radio click → auto-advance
//             select.slider-next-select change → auto-advance
//             .slider-next anchor click → advance (or complete on last slide)
// Tracking:   .is_previous_therapy change → dataLayer selected_previous_therapy
//             .is_finance change → dataLayer indicate_rich / indicate_not_poor
//             Slick init → dataLayer started_questionaire
// Completion: #quiz-submit → window.location = ./next.html

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
    sessionStorage.setItem("quiz_complete", "true");
  }

  $slider.slick({
    arrows: false,
    draggable: false,
    swipe: false,
    touchMove: false,
    accessibility: false,
    infinite: false,
    speed: 400,
    adaptiveHeight: true,
    mobileFirst: true,
  });

  totalSlides = $slider.slick("getSlick").slideCount;

  if (typeof dataLayer !== "undefined") {
    dataLayer.push({ event: "started_questionaire" });
  }

  setTimeout(function () {
    $slider.slick("setPosition");
  }, 0);

  $slider.on("afterChange", function () {
    updateProgress();
  });

  updateProgress();

  // Radio auto-advance (includes redirect-type inputs via label.slider-next-select)
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

  // Select auto-advance
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

  // Manual Next anchors (.slider-next)
  $(document).on("click", "a.slider-next, button.slider-next", function (e) {
    e.preventDefault();
    var $btn = $(this);
    if ($btn.prop("disabled") || $btn.hasClass("disabled")) return;

    var current = $slider.slick("slickCurrentSlide");
    if (current >= totalSlides - 1) {
      showCompletionScreen();
    } else {
      nextSlide();
    }
  });

  // Income checkboxes: reveal additional_income fields when any box is checked
  $(document).on("change", 'input[data-question-type="income_checkbox"]', function () {
    var anyChecked = $('input[data-question-type="income_checkbox"]:checked').length > 0;
    $("#additional_income").toggleClass("hidden", !anyChecked);
    $slider
      .find(".slick-list")
      .css("height", $slider.find(".slick-current")[0].scrollHeight);
  });

  // is_previous_therapy: push to dataLayer → GTM → AddToWishlist (when Yes)
  $(document).on("change", ".is_previous_therapy", function () {
    var therapy_before = $(this).closest("label").text().toLowerCase().trim();
    sessionStorage.setItem("therapy_before", therapy_before);
    if (therapy_before === "yes") {
      if (typeof dataLayer !== "undefined") {
        dataLayer.push({ event: "selected_previous_therapy" });
      }
    }
  });

  // is_finance: push to dataLayer → GTM → Search (when != poor)
  $(document).on("change", ".is_finance", function () {
    var financial_status = $(this).closest("label").text().toLowerCase().trim();
    sessionStorage.setItem("financial_status", financial_status);
    if (financial_status === "good") {
      if (typeof dataLayer !== "undefined") {
        dataLayer.push({ event: "indicate_rich" });
      }
    }
    if (financial_status !== "poor") {
      if (typeof dataLayer !== "undefined") {
        dataLayer.push({ event: "indicate_not_poor" });
      }
    }
  });

  // Completion: navigate to next.html
  $(document).on("click", "#quiz-submit", function (e) {
    e.preventDefault();
    window.location.href = "./next.html";
  });

  // Prevent actual form submission
  $("#start-form").on("submit", function (e) {
    e.preventDefault();
  });
})(jQuery);
