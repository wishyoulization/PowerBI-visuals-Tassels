
import './styles/main.scss';
import { default as parsets } from "./parsets";



window.CustomVisualManager = function (data, config) {
  console.log("Loaded OK", data, config);
  const customizationLayer = {
    overall: config.custom.overall,
    colors: config.custom.colors,
    categoryfillcolor: config.custom.categoryfillcolor,
    categoryfontcolor: config.custom.categoryfontcolor
  };
  parsets('#app', data, customizationLayer)
};