// funnel.js — Mar 2021 big-button slider wizard navigation
//
// Key structural change from Dec 2019:
//   Radio answers are now wrapped in div.big_button > label.radio.slider-next-select.
//   The radio <input> is hidden via CSS; the entire label IS the button.
//   Because each label is a clickable element inside a <form>, fbevents.js fires
//   SubscribedButtonClick automatically on every selection — the page code does
//   not need explicit fbq() calls for this to happen.
//
// Navigation logic:
//   - label.radio.slider-next-select click → check radio, apply .checked style, auto-advance
//   - select.slider-next-select change → auto-advance (age, country, language)
//   - .slider-next button/anchor click → advance (state Next, income Next)
//   - #next_income → show completion screen
//   - Show-more links → reveal hidden big_button rows
//   - Income checkboxes → toggle #additional_income

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

  // Recalculate slide widths after first paint. Slick can initialize before
  // the container has its final rendered width (col-md-6 layout), which causes
  // slides to be sized incorrectly and adjacent slide content to bleed through.
  setTimeout(function () {
    $slider.slick("setPosition");
  }, 0);

  $slider.on("afterChange", function () {
    updateProgress();
  });

  updateProgress();

  // Big-button label click: check the radio, apply visual state, then auto-advance.
  // The label IS the button in this design — clicking it triggers SubscribedButtonClick
  // in fbevents.js because it is an interactive element inside the form.
  $(document).on("click", "label.radio.slider-next-select", function (e) {
    e.preventDefault();
    var $label = $(this);
    var $input = $label.find('input[type="radio"]');

    // Mark checked on all sibling big_button labels in this question
    $label
      .closest(".form-group")
      .find("label.radio.slider-next-select")
      .removeClass("checked");
    $label.addClass("checked");

    // Set the radio value
    $input.prop("checked", true).trigger("change");

    // Auto-advance after short delay (matches original 200ms)
    setTimeout(function () {
      var current = $slider.slick("slickCurrentSlide");
      if (current >= totalSlides - 1) {
        showCompletionScreen();
      } else {
        nextSlide();
      }
    }, 200);
  });

  // Select auto-advance (age, country, language use class slider-next-select)
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

  // Manual Next buttons (state Next, income Next)
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

  // Show-more links — reveal hidden big_button rows for a given question ID
  $(document).on("click", "a.show-more", function (e) {
    e.preventDefault();
    var questionId = $(this).data("show-more");
    $(".show-more-" + questionId).removeAttr("hidden");
    $(this).closest(".show-more-wrapper").hide();
    $slider.slick("setOption", "adaptiveHeight", true, true);
  });

  // Income checkboxes: show/hide additional income fields, then let Slick
  // recalculate the list height so the expanded content isn't clipped.
  $(document).on(
    "change",
    'input[data-question-type="income_checkbox"]',
    function () {
      var anyChecked =
        $('input[data-question-type="income_checkbox"]:checked').length > 0;
      $("#additional_income").toggleClass("hidden", !anyChecked);
      $slider.slick("setOption", "adaptiveHeight", true, true);
    },
  );

  // Prevent actual form submission
  $("#start-form").on("submit", function (e) {
    e.preventDefault();
    console.log("[pixel-test-site] Form submit intercepted");
  });
})(jQuery);
