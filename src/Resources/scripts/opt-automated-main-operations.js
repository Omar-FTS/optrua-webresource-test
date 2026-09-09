var OptruaAutomatedSdk = window.OptruaAutomatedSdk || {};
(function () {
    this.formOnLoad = function (executionContext) {
        const formContext = executionContext.getFormContext();
        showRecordNameNotification(formContext);
    };

    this.formOnSave = function (executionContext) {
        executionContext.getFormContext();
    };

    function showRecordNameNotification(formContext) {
        const name = formContext.getAttribute("opt_name")?.getValue();
        if (name) {
            formContext.ui.setFormNotification(name, "INFO", "opt-record-name");
        } else {
            formContext.ui.clearFormNotification("opt-record-name");
        }
    }
}).call(OptruaAutomatedSdk);
