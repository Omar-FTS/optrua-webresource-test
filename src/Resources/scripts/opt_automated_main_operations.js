var OptruaAutomatedSdk = window.OptruaAutomatedSdk || {};
(function () {
    this.formOnLoad = function (executionContext) {
        const formContext = executionContext.getFormContext();
        showRecordNameNotification(formContext);
    };

    this.formOnSave = function (executionContext) {
        const formContext = executionContext.getFormContext();
        enforceNewColumnRequired(executionContext, formContext);
    };

    this.onTitleChange = function (executionContext) {
        const formContext = executionContext.getFormContext();
        showTitleNotification(formContext);
    };

    this.onNewColumnChange = function (executionContext) {
        const formContext = executionContext.getFormContext();
        validateNewColumnOnChange(formContext);
    };

    this.onDescriptionChange = function (executionContext) {
        const formContext = executionContext.getFormContext();
        showDescriptionNotification(formContext);
    };

    function showTitleNotification(formContext) {
        const title = formContext.getAttribute("opt_title")?.getValue();
        const nameAttribute = formContext.getAttribute("opt_name");
        if (!nameAttribute.getValue()) {
            nameAttribute.setValue(title);
        }
    }

    function validateNewColumnOnChange(formContext) {
        const value = formContext.getAttribute("opt_newcolumn")?.getValue();
        if (value) {
            formContext.ui.clearFormNotification("opt-newcolumn-required");
        }
    }

    function showDescriptionNotification(formContext) {
        const description = formContext.getAttribute("opt_description")?.getValue() || "";
        const length = description.length;
        if (length > 200) {
            formContext.ui.setFormNotification(
                `Description is ${length} characters, which exceeds the 200 character limit.`,
                "WARNING",
                "opt-description-length"
            );
        } else {
            formContext.ui.clearFormNotification("opt-description-length");
        }
    }

    function showRecordNameNotification(formContext) {
        const name = formContext.getAttribute("opt_name")?.getValue();
        if (name) {
            formContext.ui.setFormNotification(`Record: ${name}`, "INFO", "opt-record-name");
        }
    }

    function enforceNewColumnRequired(executionContext, formContext) {
        const value = formContext.getAttribute("opt_newcolumn")?.getValue();
        if (!value) {
            executionContext.getEventArgs().preventDefault();
            formContext.ui.setFormNotification(
                "A value is required before this record can be saved.",
                "ERROR",
                "opt-newcolumn-required"
            );
        } else {
            formContext.ui.clearFormNotification("opt-newcolumn-required");
        }
    }
}).call(OptruaAutomatedSdk);
