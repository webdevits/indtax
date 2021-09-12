var spbsmNM = {};
(function($) {
  spbsmNM.func = {
    // spbtbl functionality
    updateRows: function() {
      dndi = 1;
      $("#media-selection-table > tbody  > tr").each(function() {
        $(this)
          .find("input.queue-value")
          .val(dndi++);
      });
    }
  };
})(jQuery);

jQuery(function($) {
  $(document).ready(function() {
    $("#media-selection-table").tableDnD();

    $(".spbsm-color-picker").wpColorPicker();
    var form = $("#spbsm-form");
    var initialSettings = convertSerializedArrayToHash(form.serializeArray());

    $("#spbsm-form").submit(function(e) {
      e.preventDefault();
      spbsm_loadSpinner(true);
      var newSettings = convertSerializedArrayToHash(form.serializeArray());
      var shouldSubmit = hashDiff(initialSettings, newSettings);
      if (jQuery.isEmptyObject(shouldSubmit)) {
        spbsm_showMsg(msgs.alreadySaved, true);
        return;
      }

      if (!spbsm_correctUrls()) return;

      $("#spbsm-save-btn").prop("disabled", true);
      var action = form.attr("action");
      $.ajax({
        type: "POST",
        url: action + "/wp-admin/admin-ajax.php",
        data: {
          action: "spbsmAjax",
          nonce: $("#_wpnonce").val(),
          cmd: "save",
          page: form.attr("data-page"),
          form: form.serialize()
        },
        success: function(result) {
          console.log(result);
          if (jQuery.isEmptyObject(result)) {
            spbsm_showMsg(msgs.error);
          } else if (result.type === "error") {
            spbsm_showMsg(result.msg);
          } else {
            spbsm_showMsg(result.msg, true);
            initialSettings = convertSerializedArrayToHash(
              form.serializeArray()
            );
          }
        }
      });
    });

    function spbsm_loadSpinner(show) {
      if (!show) $("#loadSpinner").hide();
      else $("#loadSpinner").show();
    }

    var spbsm_msgTimer;
    function spbsm_showMsg(msg, success) {
      var element = $("#spbsm-save-msg");
      if (success) element.addClass("success");
      element.html(msg);
      element.show().animate(
        {
          width: "90%"
        },
        675
      );
      clearTimeout(spbsm_msgTimer);
      spbsm_msgTimer = setTimeout(function() {
        element.animate(
          {
            width: "0%"
          },
          375,
          function() {
            $(this).hide();
            $(this).html("");
            $(this).removeClass("success");
          }
        );
      }, 5000);
      $("#spbsm-save-btn").prop("disabled", false);
      spbsm_loadSpinner(false);
    }

    function spbsm_correctUrls() {
      var errors = 0;
      $("#spbsm-form input[type=text][spbsm=validate]").each(function() {
        var urlButNotHttp = /\b^[^=https?].*:\/\/.*/;
        var value = $(this).val();
        if (
          !!value &&
          (urlButNotHttp.test(value) ||
            (!value.includes($(this).attr("data-site") + ".com/") &&
              !value.includes($(this).attr("data-site") + ".tv/") &&
              !value.includes($(this).attr("data-site") + ".net/") &&
              !value.includes($(this).attr("data-site") + ".co/") &&
              !value.includes($(this).attr("data-site") + ".io/") &&
              !value.includes("wa.me/")))
        ) {
          $(this).css("border", "2px solid red");
          errors++;
        } else {
          $(this).css("border", "0");
        }

        if (!!value && value.startsWith("http://"))
          $(this).val(value.replace("http://", "https://"));
        else if (errors <= 0 && !!value && !value.startsWith("https://"))
          $(this).val("https://" + value);
      });
      if (errors > 0)
        spbsm_showMsg(
          errors +
            " " +
            (errors > 1
              ? msgs.fieldErrorMultiple + msgs.fieldErrorExpected
              : msgs.fieldErrorSingle + msgs.fieldErrorExpected)
        );
      return errors <= 0 ? true : false;
    }

    function hashDiff(h1, h2) {
      var d = {};
      for (k in h2) {
        if (h1[k] !== h2[k]) d[k] = h2[k];
      }
      return d;
    }

    function convertSerializedArrayToHash(a) {
      var r = {};
      for (var i = 0; i < a.length; i++) {
        r[a[i].name] = a[i].value;
      }
      return r;
    }
  });
});
