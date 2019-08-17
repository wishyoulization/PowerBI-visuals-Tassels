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

    public update(options: VisualUpdateOptions) {
        if (!options
            || !options.dataViews
            || !options.dataViews[0]
        ) {
            return;
        }
        console.log('Visual update', options);
        (window as any).CustomVisualManager(this.getObjectFromDataView(options.dataViews[0]).tempData);
    }


    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return;
    }
}