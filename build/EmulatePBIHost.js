window.persist = {};
window.filters = [];

//Test props
persist = { order:  ["___TOP___", "age^2", "Carnegie Classification^3", "Generation^1"] };
filters = [{"$schema":"http://powerbi.com/product/schema#basic","filterType":1,"operator":"NotIn","target":{"table":"Generation","column":"Generation"},"values":["Generation X"]},{"$schema":"http://powerbi.com/product/schema#basic","filterType":1,"operator":"NotIn","target":{"table":"age","column":"age"},"values":["Not available","60-69"]},{"$schema":"http://powerbi.com/product/schema#basic","filterType":1,"operator":"NotIn","target":{"table":"Carnegie Classification","column":"Carnegie Classification"},"values":["Master's Colleges & Universities: Small Programs","Doctoral Universities: Higher Research Activity","Doctoral Universities: Moderate Research Activity","Special Focus Four-Year: Faith-Related Institutions","Baccalaureate/Associate's Colleges: Mixed Baccalaureate/Associate's","Special Focus Four-Year: Other Health Professions Schools","Baccalaureate/Associate's Colleges: Associate's Dominant","Special Focus Four-Year: Arts, Music & Design Schools","Not available","Special Focus Four-Year: Other Special Focus Institutions","Special Focus Four-Year: Business & Management Schools","Tribal Colleges","Special Focus Four-Year: Other Technology-Related Schools","Special Focus Four-Year: Medical Schools & Centers","Special Focus Four-Year: Engineering Schools"]}];

var config = {
    persist: {
        get: function () {
            return window.persist
        },
        set: function (d) {
            console.log('created settings:', JSON.stringify(d));
            window.persist = d;
            return true;
        },
    },
    filter: {
        get: function () {
            return window.filters
        },
        set: function (d) {
            console.log('Applied filters:', JSON.stringify(d));
            window.filters = d;
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

var emulatePBIHostLifecycleEvent = function (CustomVisualManager, meta, rows) {
    CustomVisualManager(meta, rows, config);
};