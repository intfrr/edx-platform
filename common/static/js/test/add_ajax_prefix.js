require(["jquery", "coffee/src/ajax_prefix"],
    function ($, AjaxPrefix) {

    // Tests require that addAjaxPrefix is called
    // before the tests are run.
        AjaxPrefix.addAjaxPrefix($, function () {
            return "";
        });
    }
);
