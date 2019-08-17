var config = {
    persist: {
        get: function () {
            return {}
        },
        set: function (d) {
            //console.log('created settings:', JSON.stringify(d));
            return true;
        },
    },
    filter: {
        get: function () {
            return {}
        },
        set: function (d) {
            //console.log('created settings:', JSON.stringify(d));
            return true;
        },
    },
    visualHostTooltipService: {
        show: function () { },
        hide: function () { },
        move: function () { }
    },
    custom: {
        colors: ["#c51617", "#ef5205", "#ffc83d", "#0c907d", "#3eb1cc", "#5651ff", "#333333", "#4f4f4f", "#828282", "#bdbdbd",],
        categoryfillcolor: "#444444",
        categoryfontcolor: "#ffffff",
        overall: "All"
    },
    edit: false
};

var emulatePBIHostLifecycleEvent = function (CustomVisualManager, data) {
    CustomVisualManager(data, config);
};