// funnel.js — Mar 2021 big-button slider wizard navigation
// Key structural change from Dec 2019: radio answers are wrapped in
// div.big_button > label.radio.slider-next-select. The input is hidden via CSS;
// the label IS the button. fbevents.js fires SubscribedButtonClick on every
// label click because it is an interactive element inside a <form>.
//
// Tracking:  .is_previous_therapy change → dataLayer selected_previous_therapy
//            .is_finance change → dataLayer indicate_rich / indicate_not_poor
//            Slick init → dataLayer started_questionaire
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

  // Big-button label click: check radio, apply visual state, then auto-advance.
  // The label IS the button — clicking it triggers SubscribedButtonClick in
  // fbevents.js because it is an interactive element inside the form.
  $(document).on("click", "label.radio.slider-next-select", function (e) {
    e.preventDefault();
    var $label = $(this);
    var $input = $label.find('input[type="radio"]');

    $label
      .closest(".form-group")
      .find("label.radio.slider-next-select")
      .removeClass("checked");
    $label.addClass("checked");

    $input.prop("checked", true).trigger("change");

    setTimeout(function () {
      var current = $slider.slick("slickCurrentSlide");
      if (current >= totalSlides - 1) {
        showCompletionScreen();
      } else {
        nextSlide();
      }
    }, 200);
  });

  // Select auto-advance (country uses slider-next-select)
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

  // Manual Next anchors (state Next, income Next)
  $(document).on("click", "a.slider-next, button.slider-next", function (e) {
    e.preventDefault();
    var $btn = $(this);
    if ($btn.prop("disabled") || $btn.hasClass("disabled")) return;

    if ($btn.attr("id") === "next_income") {
      showCompletionScreen();
      return;
    }

    nextSlide();
  });

  // Show-more links — reveal hidden big_button rows for the given question ID
  $(document).on("click", "a.show-more", function (e) {
    e.preventDefault();
    var questionId = $(this).data("show-more");
    $(".show-more-" + questionId).removeAttr("hidden");
    $(this).closest(".show-more-wrapper").hide();
    $slider.slick("setOption", "adaptiveHeight", true, true);
  });

  // Income checkboxes: toggle additional income fields + recalculate Slick height
  $(document).on("change", 'input[data-question-type="income_checkbox"]', function () {
    var anyChecked = $('input[data-question-type="income_checkbox"]:checked').length > 0;
    $("#additional_income").toggleClass("hidden", !anyChecked);
    $slider.slick("setOption", "adaptiveHeight", true, true);
  });

  // is_previous_therapy → dataLayer → GTM → AddToWishlist (when Yes)
  $(document).on("change", ".is_previous_therapy", function () {
    var therapy_before = $(this).closest("label").text().toLowerCase().trim();
    sessionStorage.setItem("therapy_before", therapy_before);
    if (therapy_before === "yes") {
      if (typeof dataLayer !== "undefined") {
        dataLayer.push({ event: "selected_previous_therapy" });
      }
    }
  });

  // is_finance → dataLayer → GTM → Search (when != poor)
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
