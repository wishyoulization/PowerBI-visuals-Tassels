
import './styles/main.scss';
import { default as parsets } from "./parsets";
import { default as generateDataFromMetaAndRows } from "./generateDataFromMetaAndRows";



window.CustomVisualManager = function (metadata, rows, config) {
  const { data, mappedmeta } = generateDataFromMetaAndRows(metadata, rows);
  console.log(data, mappedmeta);
  const customizationLayer = {
    overall: config.custom.overall,
    colors: config.custom.colors,
    categoryfillcolor: config.custom.categoryfillcolor,
    categoryfontcolor: config.custom.categoryfontcolor,
    persist: config.persist,
    tooltip: config.visualHostTooltipService,
    filterHelper: {
      set: function (group) {
        let filters = createFilterFromList(group, mappedmeta);
        config.filter.set(filters);
        return true;
      },
      get: function () {
        let filters = config.filter.get();
        let list = createListFromFilter(filters, metadata);
        if (list === -1) {
          config.filter.set(null);
          return []
        } else {
          return list;
        }
      }
    }
  };
  parsets('#app', data, customizationLayer)
};

function createFilterFromList(list, metadata) {
  const replace_exceed_cateogies_with = "<Other...>";
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

function createListFromFilter(filters, metadata) {
  const replace_exceed_cateogies_with = "<Other...>";
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