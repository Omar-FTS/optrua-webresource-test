var Orgb788707aAutomatedSdk = window.Orgb788707aAutomatedSdk || {};
(function () {
    this.formOnLoad = function (executionContext) {
        const formContext = executionContext.getFormContext();
        defaultTitleOnCreate(formContext);
    };

    function defaultTitleOnCreate(formContext) {
        if (formContext.ui.getFormType() === "create") {
            formContext.getAttribute("taradeh_title").setValue("order:");
        }
    }
}).call(Orgb788707aAutomatedSdk);
