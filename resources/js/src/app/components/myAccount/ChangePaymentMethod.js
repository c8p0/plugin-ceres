const ModalService        = require("services/ModalService");
const ApiService          = require("services/ApiService");

Vue.component("change-payment-method", {

    props: [
        "template",
        "currentOrder",
        "allowedPaymentMethods",
        "changePossible"
    ],

    data()
    {
        return {
            changePaymentModal: {},
            paymentMethod: 0,
            isPending: false
        };
    },

    created()
    {
        this.$options.template = this.template;
    },

    /**
     * Initialize the change payment modal
     */
    ready()
    {
        this.changePaymentModal = ModalService.findModal(this.$els.changePaymentModal);
    },

    methods:
    {
        checkChangeAllowed()
        {
            ApiService.get("/rest/io/order/payment", {orderId: this.currentOrder.order.id, paymentMethodId: this.paymentMethod})
                .done(response =>
                {
                    this.changePossible = response;
                })
                .fail(() =>
                {
                    this.changePossible = false;
                });
        },

        openPaymentChangeModal()
        {
            this.changePaymentModal.show();
        },

        getPaymentStateText(paymentStates)
        {
            for (const paymentState in paymentStates)
            {
                if (paymentStates[paymentState].typeId == 4)
                {
                    return Translations.Template["paymentStatus_" + paymentStates[paymentState].value];
                }
            }

            return "";
        },

        getPaymentId(paymentIds)
        {
            for (const paymentId in paymentIds)
            {
                if (paymentIds[paymentId].typeId == 3)
                {
                    return paymentIds[paymentId].value;
                }
            }

            return "";
        },

        closeModal()
        {
            this.changePaymentModal.hide();
            this.isPending = false;
        },

        updateOrderHistory(updatedOrder)
        {
            document.getElementById("payment_name_" + this.currentOrder.order.id).innerHTML = updatedOrder.paymentMethodName;
            document.getElementById("payment_state_" + this.currentOrder.order.id).innerHTML = this.getPaymentStateText(updatedOrder.order.properties);

            this.checkChangeAllowed();

            this.closeModal();
        },

        updateAllowedPaymentMethods(paymentMethodId)
        {

            ApiService.get("/rest/io/order/paymentMethods", {orderId: this.currentOrder.order.id, paymentMethodId: paymentMethodId})
                .done(response =>
                {
                    this.allowedPaymentMethods = response;
                })
                .fail(() =>
                {
                });
        },

        changePaymentMethod()
        {
            this.isPending = true;

            ApiService.post("/rest/io/order/payment", {orderId: this.currentOrder.order.id, paymentMethodId: this.paymentMethod})
                .done(response =>
                {
                    document.dispatchEvent(new CustomEvent("historyPaymentMethodChanged", {detail: {oldOrder: this.currentOrder, newOrder: response}}));

                    this.updateOrderHistory(response);
                    this.updateAllowedPaymentMethods(this.getPaymentId(response.order.properties));
                })
                .fail(() =>
                {
                });
        }
    }

});
