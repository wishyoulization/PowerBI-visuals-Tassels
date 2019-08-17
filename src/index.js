
import './styles/main.scss';
import { default as parsets } from "./parsets";



window.CustomVisualManager = function (data, config) {
  console.log("Loaded OK", data)
  parsets('#app', data, "All")
};