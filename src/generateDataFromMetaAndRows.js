import { type } from "os";

export default function generateDataFromMetaAndRows(metadata, rows) {
  let value_index = null;
  const default_value = 1;
  const max_categories_in_dimension = 4;
  const replace_exceed_cateogies_with = "<Other...>";
  let data = new Array(rows.length);
  metadata.map(function (d, i) {
    if (d.table == null && d.column == null) {
      value_index = i;
    }
  });

  for (let i = 0; i < metadata.length; i++) {
    let cat_in_dim_and_total = {};
    let collapsed = [];
    let uncollapsed = [];
    let isNumber = typeof rows[0][i] == "number";
    if (value_index != i) {
      for (var j = 0; j < rows.length; j++) {
        if (typeof cat_in_dim_and_total[rows[j][i]] === "undefined") {
          cat_in_dim_and_total[rows[j][i]] = 0;
        }
        cat_in_dim_and_total[rows[j][i]] += value_index ? rows[j][value_index] : default_value;
      }
      //collect all excess categories that need to be collapsed..
      Object.keys(cat_in_dim_and_total).sort(function (a, b) {
        return cat_in_dim_and_total[b] - cat_in_dim_and_total[a]
      }).map(function (p, i) {
        if (i > max_categories_in_dimension) {
          collapsed.push(p);
          cat_in_dim_and_total[p] = replace_exceed_cateogies_with
        } else {
          uncollapsed.push(p);
        }
      });
    }
    metadata[i]["isNumber"] = isNumber;
    metadata[i]["collapsed"] = collapsed;
    metadata[i]["uncollapsed"] = uncollapsed;
  };
  //dataset
  let k = 0;
  while (k < rows.length) {
    // loop to create the empty elements, so we can loop later by columns rather than by rows to
    // avoid checking collapsed index too many times if its actually empty
    data[k] = {}
    if (value_index === null) {
      data[k]["___VALUE___"] = default_value;
    }

    k++;
  }
  k = 0;
  while (k < metadata.length) {
    let dim_label = metadata[k].name + "^" + k;
    let noCollapsed = metadata[k]["collapsed"].length === 0;
    for (let j = 0; j < rows.length; j++) {
      let cat = rows[j][k] + "";
      if (k == value_index) {
        data[j]["___VALUE___"] = +cat;
      } else if (noCollapsed) {
        data[j][dim_label] = cat;
      } else {
        if (metadata[k]["collapsed"].indexOf(cat) > -1) {
          data[j][dim_label] = replace_exceed_cateogies_with;
        } else {
          data[j][dim_label] = cat;
        }
      }
    }
    k++;
  }

  return {
    data: data,
    mappedmeta: metadata
  };
}