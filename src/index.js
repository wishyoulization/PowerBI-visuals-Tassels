
import './styles/main.scss';
import { default as parsets } from "./parsets";



window.CustomVisualManager = function (data, config) {
  console.log("Loaded OK", data, config)
  window.debug = config;
  parsets('#app', data, ((config && config.custom && config.custom.overall) || ""))
};