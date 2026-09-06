var OptruaAutomatedSdk = window.OptruaAutomatedSdk || {};

(function () {
    this.formOnLoad = function (executionContext) {
        const formContext = executionContext.getFormContext();
        const nameAttribute = formContext.getAttribute("opt_name");

        if (nameAttribute?.getValue()) {
            formContext.ui.setFormNotification(
                "The automated record has a name.",
                "INFO",
                "opt-record-name"
            );
        }
    };

    this.formOnSave = function (executionContext) {
        const formContext = executionContext.getFormContext();
        const newColumnAttribute = formContext.getAttribute("opt_newcolumn");
        const eventArgs = executionContext.getEventArgs();

        if (!newColumnAttribute?.getValue()) {
            eventArgs.preventDefault();
            formContext.ui.setFormNotification(
                "New column is required before saving.",
                "ERROR",
                "opt-newcolumn-required"
            );
            return;
        }

        formContext.ui.clearFormNotification("opt-newcolumn-required");
    };
}).call(OptruaAutomatedSdk);
