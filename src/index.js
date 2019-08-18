
import './styles/main.scss';
import { default as parsets } from "./parsets";
import { default as generateDataFromMetaAndRows } from "./generateDataFromMetaAndRows";



window.CustomVisualManager = function (metadata, rows, config) {
  const { data, mappedmeta } = generateDataFromMetaAndRows(metadata, rows, config.custom.categorymax, config.custom.collapsedlabel);

  const customizationLayer = {
    overall: config.custom.overall,
    colors: config.custom.colors,
    categoryfillcolor: config.custom.categoryfillcolor,
    categoryfontcolor: config.custom.categoryfontcolor,
    dimensionfontcolor: config.custom.dimensionfontcolor,
    persist: config.persist,
    tooltip: config.visualHostTooltipService,
    renderEventsAPI: config.renderEventsAPI,
    filterHelper: {
      set: function (group) {
        let filters = createFilterFromList(group, mappedmeta, config.custom.collapsedlabel);
        config.filter.set(filters);
        return true;
      },
      get: function () {
        let filters = config.filter.get();
        let list = createListFromFilter(filters, metadata, config.custom.collapsedlabel);
        if (list === -1) {
          config.filter.set(null);
          return []
        } else {
          return list;
        }
      }
    }
  };

  //Call the D3 component that renders the actual visual...
  parsets('#app', data, customizationLayer)
};

//Create a powerbi-models filter array from a list of strings sent by the visual..
function createFilterFromList(list, metadata, COLLAPSELABEL) {
  const replace_exceed_cateogies_with = "<" + COLLAPSELABEL + ">";
  let filters = [];
  metadata.map(function (m, i) {
    if (m.table == null || m.column == null) {
      //measure..
      return;
    }
    let in_or_not_in_values = [];
    let inOrNotIn = "NotIn"
    list.map(function (l) {
      if (l.metaindex == i && (l.category == replace_exceed_cateogies_with)) {
        inOrNotIn = "In";
      }
    })
    if (inOrNotIn == "NotIn") {
      list.map(function (l) {
        if (l.metaindex == i) {
          if (m.isNumber) {
            in_or_not_in_values.push(+l.category);
          } else {
            in_or_not_in_values.push(l.category);
          }
        }
      });
    } else {
      in_or_not_in_values = JSON.parse(JSON.stringify(m.uncollapsed))
      list.map(function (l) {
        if (l.metaindex == i && !(l.category == replace_exceed_cateogies_with)) {
          if (in_or_not_in_values.indexOf(l.category) > -1) {
            in_or_not_in_values.splice(in_or_not_in_values.indexOf(l.category), 1);
          }
        }
      });
      in_or_not_in_values = in_or_not_in_values.map(p => m.isNumber ? +p : p);
    }
    if (in_or_not_in_values.length) {
      filters.push({
        $schema: "http://powerbi.com/product/schema#basic",
        filterType: 1,
        operator: inOrNotIn,
        target: {
          table: m.table,
          column: m.column,
        },
        values: in_or_not_in_values,
      })
    }
  });

  return filters;
}

//Create a string array from the powerbi-models filter array..
function createListFromFilter(filters, metadata, COLLAPSELABEL) {
  const replace_exceed_cateogies_with = "<" + COLLAPSELABEL + ">";
  let list = [];
  let invalid_filters_found_flag = false;
  filters.map(function (f) {
    let metaindex = null;
    for (let i = 0; i < metadata.length; i++) {
      if (f.target.table == metadata[i].table &&
        f.target.column == metadata[i].column) {
        metaindex = i;
      }
    }
    // looped through all tables and did not find the requested target, i.e. 
    // the filter applied is not related to the columns in the fields
    // this filter must be removed
    invalid_filters_found_flag = (metaindex == null);

    if (metaindex !== null) {
      if (f.operator == "In") {
        list.push(JSON.stringify([metadata[metaindex].name + "^" + metaindex, replace_exceed_cateogies_with]));
        let stringFilters = f.values.map(d => d + "");
        metadata[metaindex].uncollapsed.map(function (u) {
          if (stringFilters.indexOf(u) == -1) {
            list.push(JSON.stringify([metadata[metaindex].name + "^" + metaindex, u + ""]));
          }
        })
      } else {
        f.values.map(function (d) {
          list.push(JSON.stringify([metadata[metaindex].name + "^" + metaindex, d + ""]));
        });
      }

    }

  })

  return invalid_filters_found_flag ? -1 : list;
}