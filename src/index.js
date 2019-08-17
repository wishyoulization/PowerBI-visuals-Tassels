
import './styles/main.scss';
import { default as parsets } from "./parsets";
import { default as generateDataFromMetaAndRows } from "./generateDataFromMetaAndRows";



window.CustomVisualManager = function (metadata, rows, config) {
  const { data, mappedmeta } = generateDataFromMetaAndRows(metadata, rows);
  //console.log("Loaded OK", data, config);
  console.log(data, mappedmeta);
  const customizationLayer = {
    overall: config.custom.overall,
    colors: config.custom.colors,
    categoryfillcolor: config.custom.categoryfillcolor,
    categoryfontcolor: config.custom.categoryfontcolor
  };
  parsets('#app', data, customizationLayer)
};