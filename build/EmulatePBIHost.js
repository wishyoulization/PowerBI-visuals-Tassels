window.persist = {};
window.filters = [];

//Test props
persist = { order: ["___TOP___", "age^2", "Carnegie Classification^3", "Generation^1"] };
filters = [{ "$schema": "http://powerbi.com/product/schema#basic", "filterType": 1, "operator": "In", "target": { "table": "Carnegie Classification", "column": "Carnegie Classification" }, "values": ["Baccalaureate Colleges: Arts & Sciences Focus", "Baccalaureate Colleges: Diverse Fields", "Master's Colleges & Universities: Medium Programs"] }];

var config = {
    renderEventsAPI: function (d) {
        //console.log("Rendering event:", d);
    },
    persist: {
        get: function () {
            return window.persist
        },
        set: function (d) {
            //console.log('created settings:', JSON.stringify(d));
            window.persist = d;
            return true;
        },
    },
    filter: {
        get: function () {
            return window.filters
        },
        set: function (d) {
            //console.log('Applied filters:', JSON.stringify(d));
            window.filters = d;
            return true;
        },
    },
    visualHostTooltipService: {
        show: function (d) {
            //console.log("Showing tooltips", d);
        },
        hide: function () {
            //console.log("Hiding tooltip")
        },
        move: function () { }
    },
    custom: {
        colors: ["#c51617", "#ef5205", "#ffc83d", "#0c907d", "#3eb1cc", "#5651ff", "#333333", "#4f4f4f", "#828282", "#bdbdbd",],
        categoryfillcolor: "#444444",
        categoryfontcolor: "#ffffff",
        dimensionfontcolor: "#333333",
        overall: "All",
        collapsedlabel: "Some label",
        categorymax: 5
    },
    edit: false
};

var emulatePBIHostLifecycleEvent = function (CustomVisualManager, meta, rows) {
    CustomVisualManager(meta, rows, config);
};