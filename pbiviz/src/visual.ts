"use strict";

import "core-js/stable";
import powerbi from "powerbi-visuals-api";
import '../../build/App'; // Load the visual module from parent directory!


import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import DataView = powerbi.DataView;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;


export class Visual implements IVisual {
    private host: IVisualHost;
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
            rows: dataView.table.rows
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

    private getPersist(dataView: DataView) {
        return JSON.parse((dataView &&
            dataView.metadata.objects &&
            dataView.metadata.objects.general &&
            dataView.metadata.objects.general.persist as string) || "{}");
    }

    private setPersist(props: any) {
        return this.host.persistProperties({
            merge: [{
                objectName: "general",
                selector: null,
                properties: { "persist": JSON.stringify(props) || "" },
            }]
        });
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
        const colorHelper = (d: any) => { return { "solid": { "color": this.host.colorPalette.getColor(d).value } } };
        const props = this.customDisplayProperties = {
            top: get('top', 'All'),
            labelcolor: get("labelcolor", { "solid": { "color": "#333333" } }).solid.color,
            labeltextcolor: get("labeltextcolor", { "solid": { "color": "#ffffff" } }).solid.color,
            color1: get("color1", colorHelper).solid.color,
            color2: get("color2", colorHelper).solid.color,
            color3: get("color3", colorHelper).solid.color,
            color4: get("color4", colorHelper).solid.color,
            color5: get("color5", colorHelper).solid.color,
            color6: get("color6", colorHelper).solid.color,
            color7: get("color7", colorHelper).solid.color,
            color8: get("color8", colorHelper).solid.color,
            color9: get("color9", colorHelper).solid.color,
            color10: get("color10", colorHelper).solid.color
        };

        (window as any).CustomVisualManager(this.getObjectFromDataView(options.dataViews[0]).metadata, this.getObjectFromDataView(options.dataViews[0]).rows, {
            renderEventsAPI: (t: string) => {
                if (t === "start") {
                    this.host.eventService.renderingStarted(options);
                } else if (t == "fail") {
                    this.host.eventService.renderingFailed(options);
                } else if (t == "finished") {
                    this.host.eventService.renderingFinished(options);
                }
            },
            persist: {
                get: () => this.getPersist(dataView),
                set: this.setPersist.bind(this)
            },
            filter: {
                get: () => options.jsonFilters,
                set: (filters: powerbi.IFilter[]) => {
                    this.host.applyJsonFilter(filters, "general", "filter", powerbi.FilterAction.merge);
                },
            },
            visualHostTooltipService: this.host.tooltipService,
            custom: {
                colors: [props.color1, props.color2, props.color3, props.color4, props.color5, props.color6, props.color7, props.color8, props.color9, props.color10],
                categoryfillcolor: props.labelcolor,
                categoryfontcolor: props.labeltextcolor,
                overall: props.top
            }
        });
    }

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