"use strict";

import "core-js/stable";
import powerbi from "powerbi-visuals-api";
import '../../build/App';
import * as models from 'powerbi-models';


import IColorPalette = powerbi.extensibility.IColorPalette;
import IViewport = powerbi.IViewport;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import DataView = powerbi.DataView;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;
import DataViewValueColumn = powerbi.DataViewValueColumn;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import VisualObjectInstancesToPersist = powerbi.VisualObjectInstancesToPersist;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;


export class Visual implements IVisual {
    private host: IVisualHost;
    private colorPalette: IColorPalette;
    private customDisplayProperties: any;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        //Create the app element container and app element to embed the visual module
        let appContainer = document.createElement("div");
        let app = document.createElement("div");
        appContainer.setAttribute("id", "appContainer");
        appContainer.style.width = "100%";
        appContainer.style.height = "100%";
        appContainer.style.overflow = "auto";
        app.setAttribute("id", "app");
        appContainer.appendChild(app);
        options.element.appendChild(appContainer);
    }


    private getObjectFromDataView(dataView: DataView) {
        let metadata = [];

        let columns = dataView.table.columns
        for (let c = 0; c < columns.length; c++) {
            let currentColumn = columns[c];
            if (currentColumn.isMeasure) {
                metadata.push({
                    column: null,
                    table: null,
                    name: currentColumn.displayName,
                    roles: Object.keys(currentColumn.roles)
                });

            } else {
                metadata.push({
                    column: currentColumn.queryName.replace(/.*\./, ""),
                    table: currentColumn.queryName.replace(/\..*/, ""),
                    name: currentColumn.displayName,
                    roles: Object.keys(currentColumn.roles)
                });
            }
        }


        return {
            metadata: metadata,
            rows: dataView.table.rows,

            tempData: dataView.table.rows.map(function (row) {
                let t = {};
                row.map(function (d, i) {
                    let m = metadata[i];
                    let n = m.name;
                    if (m.table === null) {
                        n = "___VALUE___";
                    }
                    t[n] = d
                })
                return t;
            })
        };
    }

    private getProperty(dataview: DataView, obName: string, propName: string, defValue: any) {
        if (dataview &&
            dataview.metadata &&
            dataview.metadata.objects &&
            dataview.metadata.objects[obName] &&
            typeof dataview.metadata.objects[obName][propName] !== "undefined") {
            return dataview.metadata.objects[obName][propName];
        } else {
            //if defValue is a function call it instead of directly sending it
            if (defValue && {}.toString.call(defValue) === '[object Function]') {
                return defValue(propName);
            }
            return defValue;
        }
    }

    public update(options: VisualUpdateOptions) {
        if (!options
            || !options.dataViews
            || !options.dataViews[0]
        ) {
            return;
        }
        const dataView = options.dataViews[0];
        const get = (p: string, d: any) => this.getProperty(dataView, 'displaySettings', p, d);
        const colorHelper = (d: any) => this.host.colorPalette.getColor(d).value;
        const props = this.customDisplayProperties = {
            top: get('top', 'All'),
            labelcolor: get("labelcolor", "#333333"),
            labeltextcolor: get("labeltextcolor", "#ffffff"),
            color1: get("color1", colorHelper),
            color2: get("color2", colorHelper),
            color3: get("color3", colorHelper),
            color4: get("color4", colorHelper),
            color5: get("color5", colorHelper),
            color6: get("color6", colorHelper),
            color7: get("color7", colorHelper),
            color8: get("color8", colorHelper),
            color9: get("color9", colorHelper),
            color10: get("color10", colorHelper)
        }

        console.log('Visual update', options);
        (window as any).CustomVisualManager(this.getObjectFromDataView(options.dataViews[0]).tempData, {
            persist: {},
            filter: {},
            custom: {
                colors: [props.color1, props.color2, props.color3, props.color4, props.color5, props.color6, props.color7, props.color8, props.color9, props.color10],
                categoryfillcolor: props.labelcolor,
                categoryfontcolor: props.labeltextcolor,
                overall: props.top
            }
        });
    }


    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        let objectName = options.objectName;
        let objectEnumeration: VisualObjectInstance[] = [];
        switch (objectName) {
            case "general":
                // ignore
                break;
            case "displaySettings":
                objectEnumeration.push({
                    objectName: objectName,
                    displayName: "Wishyoulization Settings",
                    properties: this.customDisplayProperties,
                    selector: null
                });
                break;
        }
        return objectEnumeration;
    }
}