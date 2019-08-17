
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
    categoryfontcolor: config.custom.categoryfontcolor,
    persist: config.persist,
    filterHelper: {
      set: function (group) {
        let filters = createFilterFromList(group, mappedmeta);
        config.filter.set(filters);
        console.log(filters);
        return true;
      },
      get: function () {
        let filters = config.filter.get();
        let list = createListFromFilter(filters, metadata);
        console.log(list);
        return list;
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
    let not_in_values = [];
    list.map(function (l) {
      if (l.metaindex == i) {
        if (l.category == replace_exceed_cateogies_with) {
          m.collapsed.map(function (c) {
            if (m.isNumber) {
              not_in_values.push(+c);
            } else {
              not_in_values.push(c);
            }
          });
        } else {
          if (m.isNumber) {
            not_in_values.push(+l.category);
          } else {
            not_in_values.push(l.category);
          }
        }
      }
    })
    if (not_in_values.length) {
      filters.push({
        $schema: "http://powerbi.com/product/schema#basic",
        filterType: 1,
        operator: "NotIn",
        target: {
          table: m.table,
          column: m.column,
        },
        values: not_in_values,
      })
    }
  });

  return filters;
}

function createListFromFilter(filters, metadata) {
  const replace_exceed_cateogies_with = "<Other...>";
  let list = [];
  filters.map(function (f) {
    let metaindex = null;
    for (let i = 0; i < metadata.length; i++) {
      if (f.target.table == metadata[i].table &&
        f.target.column == metadata[i].column) {
        metaindex = i;
      }
    }
    if (metaindex !== null) {
      let exceed_flag = false;
      f.values.map(function (d) {
        d = d + ""
        if (metadata[metaindex].collapsed.indexOf(d) == -1) {
          list.push(JSON.stringify([metadata[metaindex].name + "^" + metaindex, d]));
        } else {
          exceed_flag = true;
        }
      });
      if (exceed_flag) {
        list.push(JSON.stringify([metadata[metaindex].name + "^" + metaindex, replace_exceed_cateogies_with]));
      }
    }

  })

  return list;
}