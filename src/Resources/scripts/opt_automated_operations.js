var OptruaAutomatedSdk = window.OptruaAutomatedSdk || {};
(function () {
    this.onLengthChange = function (executionContext) {
        const formContext = executionContext.getFormContext();
        const rawValue = formContext.getAttribute("opt_length")?.getValue();
        const numericValue = parseFloat(rawValue);

        if (!Number.isNaN(numericValue) && numericValue > 100) {
            formContext.ui.setFormNotification(
                `Value ${rawValue} exceeds the recommended length threshold of 100.`,
                "WARNING",
                "opt-length-threshold"
            );
        } else {
            formContext.ui.clearFormNotification("opt-length-threshold");
        }
    };

    this.onNewColumnChange = function (executionContext) {
        const formContext = executionContext.getFormContext();
        const value = formContext.getAttribute("opt_newcolumn")?.getValue();

        if (!value) {
            formContext.ui.setFormNotification(
                "A value is required.",
                "WARNING",
                "opt-newcolumn-required"
            );
        } else {
            formContext.ui.clearFormNotification("opt-newcolumn-required");
        }
    };
}).call(OptruaAutomatedSdk);
