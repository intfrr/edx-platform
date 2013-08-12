require ["jquery", "underscore.string", "backbone", "coffee/src/ajax_prefix", "js/views/feedback_notification", "jquery.cookie"],
($, str, Backbone, AjaxPrefix, NotificationView) ->
  AjaxPrefix.addAjaxPrefix jQuery, ->
    $("meta[name='path_prefix']").attr('content')

  window.CMS = window.CMS or {}
  CMS.URL = CMS.URL or {}

  _.extend CMS, Backbone.Events

  $ ->
    Backbone.emulateHTTP = true

    $.ajaxSetup
      headers : { 'X-CSRFToken': $.cookie 'csrftoken' }
      dataType: 'json'

    $(document).ajaxError (event, jqXHR, ajaxSettings, thrownError) ->
      if ajaxSettings.notifyOnError is false
          return
      if jqXHR.responseText
        try
          message = JSON.parse(jqXHR.responseText).error
        catch error
          message = str.truncate(jqXHR.responseText, 300)
      else
        message = gettext("This may be happening because of an error with our server or your internet connection. Try refreshing the page or making sure you are online.")
      msg = new NotificationView.Error(
        "title": gettext("Studio's having trouble saving your work")
        "message": message
      )
      msg.show()

    if navigator.userAgent.match /iPhone|iPod|iPad/i
      $('body').addClass 'touch-based-device'
