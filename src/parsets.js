require("d3");

d3.parsets = function () {
  var event = d3.dispatch("sortDimensions", "sortCategories"),
    dimensions_ = autoDimensions,
    dimensionFormat = String,
    tooltip_ = defaultTooltip,
    categoryTooltip = defaultCategoryTooltip,
    value_,
    spacing = 20,
    width,
    height,
    tension = 1,
    tension0,
    duration = 500;
  var dNegOffset;


  function parsets(selection) {
    selection.each(function (data, i) {
      var g = d3.select(this),
        ordinal = d3.scale.ordinal(),
        dragging = false,
        dimensionNames = dimensions_.call(this, data, i),
        dimensions = [],
        tree = { children: {}, count: 0 },
        nodes,
        total,
        ribbon;

      d3.select(window).on("mousemove.parsets." + ++parsetsId, unhighlight);

      if (tension0 == null) tension0 = tension;
      g.selectAll(".ribbon, .ribbon-mouse")
        .data(["ribbon", "ribbon-mouse"], String)
        .enter().append("g")
        .attr("class", String);
      updateDimensions();
      if (tension != tension0) {
        var t = d3.transition(g);
        if (t.tween) t.tween("ribbon", tensionTween);
        else tensionTween()(1);
      }


      function tensionTween() {
        var i = d3.interpolateNumber(tension0, tension);
        return function (t) {
          tension0 = i(t);
          ribbon.attr("d", ribbonPath);
        };
      }

      function updateDimensions() {
        // Cache existing bound dimensions to preserve sort order.
        var dimension = g.selectAll("g.dimension"),
          cache = {};
        dimension.each(function (d) { cache[d.name] = d; });
        dimensionNames.forEach(function (d) {
          if (!cache.hasOwnProperty(d)) {
            cache[d] = { name: d, categories: [] };
          }
          dimensions.push(cache[d]);
        });
        dimensions.sort(compareY);
        // Populate tree with existing nodes.
        g.select(".ribbon").selectAll("path")
          .each(function (d) {
            var path = d.path.split("\0"),
              node = tree,
              n = path.length - 1;
            for (var i = 0; i < n; i++) {
              var p = path[i];
              node = node.children.hasOwnProperty(p) ? node.children[p]
                : node.children[p] = { children: {}, count: 0 };
            }
            node.children[d.name] = d;
          });
        tree = buildTree(tree, data, dimensions.map(dimensionName), value_);
        cache = dimensions.map(function (d) {
          var t = {};
          d.categories.forEach(function (c) {
            t[c.name] = c;
          });
          return t;
        });
        (function categories(d, i) {
          if (!d.children) return;
          var dim = dimensions[i],
            t = cache[i];
          for (var k in d.children) {
            if (!t.hasOwnProperty(k)) {
              dim.categories.push(t[k] = { name: k });
            }
            categories(d.children[k], i + 1);
          }
        })(tree, 0);
        ordinal.domain([]).range(d3.range(dimensions[1].categories.length + 1));
        nodes = layout(tree, dimensions, ordinal);
        total = getTotal(dimensions);
        dimensions.forEach(function (d) {
          d.count = total;
          d.categories.sort(function () { return -1 * function (a, b) { return a.count - b.count; }.apply(this, arguments); })
        });
        nodes = layout(tree, dimensions, ordinal);
        dimension = dimension.data(dimensions, dimensionName);

        var dEnter = dimension.enter().append("g")
          .attr("class", "dimension")
          .attr("transform", function (d) { return "translate(0," + d.y + ")"; })

        dimension.each(function (d) {
          d.y0 = d.y;
          d.categories.forEach(function (d) { d.x0 = d.x; });
        });
        var rect = dEnter.filter(removePresident).append("rect")
          .attr("width", width)
          .attr("y", -45)
          .attr("height", 25);
        var textEnter = dEnter.filter(removePresident).append("text")
          .attr("class", "dimension")
          .attr("transform", "translate(0,-25)");
        textEnter.append("tspan")
          .attr("class", "name")
          .text(dimensionFormatName)
          .style('fill', globalCustomization.categoryfillcolor || "#000000");
        textEnter.append("tspan")
          .attr("class", "sort alpha")
          .attr("dx", "2em")
          .text("alpha »")
          .on("mousedown.parsets", cancelEvent);
        textEnter.append("tspan")
          .attr("class", "sort size")
          .attr("dx", "2em")
          .text("size »")
          .on("mousedown.parsets", cancelEvent);
        dimension.filter(removePresident)
          .call(d3.behavior.drag()
            .on("dragstart", function (d) {
              d3.event.sourceEvent.stopPropagation();
              dragging = true;
              d.y0 = d.y;
            })
            .on("drag", function (d) {
              d.y0 = d.y = d3.event.y;
              //Alok:do not allow to drag to the first row
              if (d.y0 < 60) {
                return;
              }
              //End
              for (var i = 1; i < dimensions.length; i++) {
                if (height * dimensions[i].y < height * dimensions[i - 1].y) {
                  dimensions.sort(compareY);
                  dimensionNames = dimensions.map(dimensionName);
                  ordinal.domain([]).range(d3.range(dimensions[1].categories.length + 1));
                  nodes = layout(tree = buildTree({ children: {}, count: 0 }, data, dimensionNames, value_), dimensions, ordinal);
                  total = getTotal(dimensions);
                  updateRibbons();
                  updateCategories(dimension);
                  dimension.transition().duration(duration)
                    .attr("transform", translateY)
                    .tween("ribbon", ribbonTweenY);
                  event.sortDimensions();
                  break;
                }
              }
              d3.select(this)
                .attr("transform", "translate(0," + d.y + ")")
                .transition();
              ribbon.filter(function (r) { return r.source.dimension === d || r.target.dimension === d; })
                .attr("d", ribbonPath);
            })
            .on("dragend", function (d) {
              dragging = false;
              unhighlight();
              //Alok: set the heights here simialr to layout
              var nd = dimensions.length,
                y0 = 20,
                dy = (height - y0 - 2) / (nd - 1);
              dNegOffset = 0;
              if (nd == 2) {
                //When only one is selected regular chart, no change
              } else {
                dNegOffset = 400 / nd; //Adjust the height of the first row
                dy = (height - dNegOffset - 2) / (nd - 2); //calculate the height for each other row
              }
              dimensions.forEach(function (d, i) {
                if (nd == 2) {
                  d.y = y0 + i * dy;
                } else {
                  if (i == 0) {
                    d.y = y0;
                  } else if (i == 1) {
                    d.y = y0 + dNegOffset;
                  } else {
                    d.y = dNegOffset + ((i - 1) * dy);
                  }
                }
              });


              //Alok: copy the new dimension order to persist...
              var listOfNewDimensionOrder = [];
              dimensions.forEach(function (d, i) {
                listOfNewDimensionOrder.push(d.name);
              });//removed changed check.. and click dispatch. any impact?
              if (JSON.stringify(masterList) != JSON.stringify(listOfNewDimensionOrder)) {
                console.log('Dimension order', listOfNewDimensionOrder)
                globalCustomization.persist.set({ order: listOfNewDimensionOrder })
              }
              //reapply category hides when dragging..
              g.selectAll('g.category').each(function (gc) {
                var thisTmp = JSON.stringify([gc.dimension.name, gc.name]);
                if (categoryHidden.indexOf(thisTmp) > -1) {
                  categoryHidden.splice(categoryHidden.indexOf(thisTmp), 1);
                  categoryClick.bind(this)(gc);
                }
              });


              //End
              transition(d3.select(this))
                .attr("transform", "translate(0," + d.y + ")")
                .tween("ribbon", ribbonTweenY);
            }));

        dimension.select("text").select("tspan.sort.alpha")
          .on("click.parsets", sortBy("alpha", function (a, b) { return a.name < b.name ? 1 : -1; }, dimension));
        dimension.select("text").select("tspan.sort.size")
          .on("click.parsets", sortBy("size", function (a, b) { return a.count - b.count; }, dimension));


        dimension.transition().duration(duration)
          .attr("transform", function (d) { return "translate(0," + d.y + ")"; })
          .tween("ribbon", ribbonTweenY);


        dimension.exit().remove();
        updateRibbons();
        updateCategories(dimension);
      }

      function sortBy(type, f, dimension) {
        return function (d) {
          var direction = this.__direction = -(this.__direction || 1);
          d3.select(this).text(direction > 0 ? type + " »" : "« " + type);
          d.categories.sort(function () { return direction * f.apply(this, arguments); });
          nodes = layout(tree, dimensions, ordinal);
          updateRibbons();
          updateCategories(dimension);
          event.sortCategories();
        };
      }

      function updateRibbons() {
        ribbon = g.select(".ribbon").selectAll("path")
          .data(nodes, function (d) { return d.path; });
        ribbon.enter().append("path")
          .each(function (d) {
            d.source.x0 = d.source.x;
            d.target.x0 = d.target.x;
          })
          .style("fill", function (d) {
            //Alok: For making top row grey!
            if (d.parent.dimension == '___TOP___' && dimensions.length > 2) {
              return "rgb(187, 188, 188)";
            };
            return globalCustomization.colors[d.major % 10]
          })
          .attr("d", ribbonPath);
        ribbon.sort(function (a, b) { return b.count - a.count; });
        ribbon.exit().remove();
        var mouse = g.select(".ribbon-mouse").selectAll("path")
          .data(nodes, function (d) { return d.path; });
        mouse.enter().append("path")
          .on("mousemove.parsets", function (d) {
            ribbon.classed("active", false);
            if (dragging) return;
            if (d.DUPhide == 0) {
              highlight(d = d.node, true);

              showTooltip(tooltip_.call(this, d), "category-" + d.major);
            }
            d3.event.stopPropagation();
          });
        mouse
          .sort(function (a, b) { return b.count - a.count; })
          .attr("d", ribbonPathStatic);
        mouse.exit().remove();

        //Alok: Logic to hide/show class based on nodes
        ribbon.classed('DUPhiddenRibbon', function (d) { return (d.DUPhide > 0) })

      }

      // Alok: Hide a node and its and its descendants and optionally its ancestors...
      function hide(d, ancestors) {
        if (dragging) return;
        var childrenlist = [];
        (function recurse(d) {
          childrenlist.push(d);
          for (var k in d.children) recurse(d.children[k]);
        })(d);
        childrenlist.shift();
        ribbon.filter(function (d) {
          return childrenlist.indexOf(d.node) >= 0;
        }).each(function (d) {
          d.DUPhide += 1;
        });
      }

      function categoryClick(d) {
        var tmpThis = JSON.stringify([d.dimension.name, d.name]);
        if (categoryHidden.indexOf(tmpThis) > -1) {
          d.nodes.forEach(function (nd) { unhide(nd); })
          categoryHidden.splice(categoryHidden.indexOf(tmpThis), 1);
          d3.select(this).classed('hiddenDUPRibbon', false);
        } else {
          d.nodes.forEach(function (nd) { hide(nd); })
          categoryHidden.push(tmpThis);
          d3.select(this).classed('hiddenDUPRibbon', true);
        }
        updateRibbons();
        if (d3.event && d3.event.type && d3.event.type == "click") {
          //console.log('filter', 'toggle category ' + tmpThis, 'click');
          globalCustomization.filterHelper.set(categoryHidden.map(h => {
            let t = JSON.parse(h);
            return {
              metaindex: +t[0].replace(/.*(?=\^\d+$)/, "").replace("^", ""),
              category: t[1]
            }
          }));
        }
      }

      function unhide(d, ancestors) {
        if (dragging) return;
        var childrenlist = [];
        (function recurse(d) {
          childrenlist.push(d);
          for (var k in d.children) recurse(d.children[k]);
        })(d);
        childrenlist.shift();
        ribbon.filter(function (d) {
          return childrenlist.indexOf(d.node) >= 0;
        }).each(function (d) {
          d.DUPhide -= 1;
        });
      }

      // Animates the x-coordinates only of the relevant ribbon paths.
      function ribbonTweenX(d) {
        var nodes = [d],
          r = ribbon.filter(function (r) {
            var s, t;
            if (r.source.node === d) nodes.push(s = r.source);
            if (r.target.node === d) nodes.push(t = r.target);
            return s || t;
          }),
          i = nodes.map(function (d) { return d3.interpolateNumber(d.x0, d.x); }),
          n = nodes.length;
        return function (t) {
          for (var j = 0; j < n; j++) {
            //Alok fixed the interpolation problem..
            nodes[j].x0 = i[j](t) || nodes[j].x
          };
          r.attr("d", ribbonPath);
        };
      }

      // Animates the y-coordinates only of the relevant ribbon paths.
      function ribbonTweenY(d) {
        var r = ribbon.filter(function (r) { return r.source.dimension.name == d.name || r.target.dimension.name == d.name; }),
          i = d3.interpolateNumber(d.y0, d.y);
        return function (t) {
          d.y0 = i(t);
          r.attr("d", ribbonPath);
        };
      }

      // Highlight a node and its descendants, and optionally its ancestors.
      function highlight(d, ancestors) {
        if (dragging) return;
        var highlight = [];
        (function recurse(d) {
          highlight.push(d);
          for (var k in d.children) recurse(d.children[k]);
        })(d);
        highlight.shift();
        if (ancestors) while (d) highlight.push(d), d = d.parent;
        ribbon.filter(function (d) {
          var active = highlight.indexOf(d.node) >= 0;
          if (active) this.parentNode.appendChild(this);
          return active;
        }).classed("active", true);
      }

      // Unhighlight all nodes.
      function unhighlight() {
        if (dragging) return;
        ribbon.classed("active", false);

        hideTooltip();
      }

      function updateCategories(g) {
        var category = g.selectAll("g.category")
          .data(function (d) { return d.categories; }, function (d) { return d.name; });
        var categoryEnter = category.enter().append("g")
          .attr("class", "category")
          .attr("transform", function (d) { return "translate(" + d.x + ")"; })

        category.exit().remove();

        category.filter(removePresident)
          .on("mousemove.parsets", function (d) {
            ribbon.classed("active", false);
            if (dragging) return;
            d.nodes.forEach(function (d) { highlight(d); });
            showTooltip(categoryTooltip.call(this, d));
            d3.event.stopPropagation();
          })
          .on("mouseout.parsets", unhighlight)
          .on("mousedown.parsets", cancelEvent)
          .call(d3.behavior.drag()
            .origin(identity)
            .on("dragstart", function (d) {
              d3.event.sourceEvent.stopPropagation();//To fix mobile scrolljack issue
              dragging = true;
              d.x0 = d.x;
            })
            .on("drag", function (d) {
              d.x = d3.event.x;
              var categories = d.dimension.categories;
              for (var i = 0, c = categories[0]; ++i < categories.length;) {
                if (c.x + c.dx / 2 > (c = categories[i]).x + c.dx / 2) {
                  categories.sort(function (a, b) { return a.x + a.dx / 2 - b.x - b.dx / 2; });
                  nodes = layout(tree, dimensions, ordinal);
                  updateRibbons();
                  updateCategories(g);
                  highlight(d.node);
                  event.sortCategories();
                  break;
                }
              }
              var x = 0,
                p = spacing / (categories.length - 1);
              categories.forEach(function (e) {
                if (d === e) e.x0 = d3.event.x;
                e.x = x;
                x += e.count / total * (width - spacing) + p;
              });
              d3.select(this)
                .attr("transform", function (d) { return "translate(" + d.x0 + ")"; })
                .transition();
              ribbon.filter(function (r) { return r.source.node === d || r.target.node === d; })
                .attr("d", ribbonPath);
            })
            .on("dragend", function (d) {
              dragging = false;
              unhighlight();
              updateRibbons();
              transition(d3.select(this))
                .attr("transform", "translate(" + d.x + ")")
                .tween("ribbon", ribbonTweenX);
            }))

        category.transition().duration(duration)
          .attr("transform", function (d) { return "translate(" + d.x + ")"; })
          .tween("ribbon", ribbonTweenX);

        categoryEnter.append("rect")
          .attr("width", function (d) { return d.dx; })
          .attr("y", -20)
          .attr("height", 20);
        categoryEnter.append("line")
          .style("stroke-width", 2);
        categoryEnter.append("text")
          .attr("dy", "-.3em")
          .attr("dx", ".2em");
        category.select("rect")
          .attr("width", function (d) { return d.dx; })
          //.attr("class", function (d) {
          //return "category-" + (d.dimension === dimensions[0] ? ordinal(d.name) : "background");
          //})
          .style('fill', globalCustomization.categoryfillcolor || "#000000");
        category.select("line")
          .attr("x2", function (d) { return d.dx; });
        category.select("text")
          .text(truncateText(function (d) { return d.name; }, function (d) { return d.dx; }))
          .style('fill', globalCustomization.categoryfontcolor || "#ffffff");

        //Alok: For custom turn on off feature;
        category.filter(removePresident).on('click', categoryClick)
        // - - 
        //reapply category hides when initial loading too..
        g.selectAll('g.category').each(function (gc) {
          var thisTmp = JSON.stringify([gc.dimension.name, gc.name]);
          if (categoryHidden.indexOf(thisTmp) > -1) {
            categoryHidden.splice(categoryHidden.indexOf(thisTmp), 1);
            categoryClick.bind(this)(gc);
          }
        });
      }
    });
  }


  parsets.dimensionFormat = function (_) {
    if (!arguments.length) return dimensionFormat;
    dimensionFormat = _;
    return parsets;
  };

  parsets.dimensions = function (_) {
    if (!arguments.length) return dimensions_;
    dimensions_ = d3.functor(_);
    return parsets;
  };

  parsets.value = function (_) {
    if (!arguments.length) return value_;
    value_ = d3.functor(_);
    return parsets;
  };

  parsets.width = function (_) {
    if (!arguments.length) return width;
    width = +_;
    return parsets;
  };

  parsets.height = function (_) {
    if (!arguments.length) return height;
    height = +_;
    return parsets;
  };

  parsets.spacing = function (_) {
    if (!arguments.length) return spacing;
    spacing = +_;
    return parsets;
  };

  parsets.tension = function (_) {
    if (!arguments.length) return tension;
    tension = +_;
    return parsets;
  };

  parsets.duration = function (_) {
    if (!arguments.length) return duration;
    duration = +_;
    return parsets;
  };

  parsets.tooltip = function (_) {
    if (!arguments.length) return tooltip;
    tooltip_ = _ == null ? defaultTooltip : _;
    return parsets;
  };

  parsets.categoryTooltip = function (_) {
    if (!arguments.length) return categoryTooltip;
    categoryTooltip = _ == null ? defaultCategoryTooltip : _;
    return parsets;
  };


  var body = d3.select("body");

  return d3.rebind(parsets, event, "on").value(1).width(960).height(600);

  function dimensionFormatName(d, i) {
    return dimensionFormat.call(this, d.name, i);
  }

  var showingTooltip;
  function showTooltip(html, className) {
    var m = d3.mouse(body.node());
    var left = m[0] + 0;
    var top = m[1] - 20;

    globalCustomization.tooltip.show({
      coordinates: [left, top],
      isTouchEvent: false,
      dataItems: [{
        displayName: html[0] + '',
        value: html[1] + '',
      }],
      identities: [],
    })
    clearTimeout(showingTooltip);
    showingTooltip = setTimeout(function () {
      if (showingTooltip) {
        hideTooltip();
      }
    }, 2000)
  }

  function hideTooltip() {
    clearTimeout(showingTooltip);
    globalCustomization.tooltip.hide({
      isTouchEvent: false,
      immediately: true,
    });
  }

  function transition(g) {
    return duration ? g.transition().duration(duration).ease(parsetsEase) : g;
  }

  function layout(tree, dimensions, ordinal) {
    var nodes = [],
      nd = dimensions.length,
      y0 = 20,
      dy = (height - y0 - 2) / (nd - 1);
    dNegOffset = 0;
    if (nd == 2) {
      //When only one is selected regular chart, no change
    } else {
      dNegOffset = d3.min([400 / nd, (height) / (nd)]); //Adjust the height of the first row
      dy = (height - dNegOffset - 2) / (nd - 2); //calculate the height for each other row
    }
    dimensions.forEach(function (d, i) {
      d.categories.forEach(function (c) {
        c.dimension = d;
        c.count = 0;
        c.nodes = [];
      });
      if (nd == 2) {
        d.y = y0 + i * dy;
      } else {
        if (i == 0) {
          d.y = y0;
        } else if (i == 1) {
          d.y = y0 + dNegOffset;
        } else {
          d.y = dNegOffset + ((i - 1) * dy);
        }
      }
    });

    // Compute per-category counts.
    var total = (function rollup(d, i) {
      if (!d.children) return d.count;
      var dim = dimensions[i],
        total = 0;
      dim.categories.forEach(function (c) {
        var child = d.children[c.name];
        if (!child) return;
        c.nodes.push(child);
        var count = rollup(child, i + 1);
        c.count += count;
        total += count;
      });
      return total;
    })(tree, 0);

    // Stack the counts.
    dimensions.forEach(function (d) {
      d.categories = d.categories.filter(function (d) { return d.count; });
      var x = 0,
        p = spacing / (d.categories.length - 1);
      d.categories.forEach(function (c) {
        c.x = x;
        c.dx = c.count / total * (width - spacing);
        //Alok: Added for full width when only one category is present; make the width of bar not consider the padding
        if (d.categories.length == 1) {
          p = 0;
          c.dx = c.count / total * (width);
        }
        //End
        c.in = { dx: 0 };
        c.out = { dx: 0 };
        x += c.dx + p;
      });
    });

    var dim = dimensions[0];
    dim.categories.forEach(function (c) {
      var k = c.name;
      if (tree.children.hasOwnProperty(k)) {
        recurse(c, { node: tree.children[k], path: k }, 1, 0);
      }
    });

    function recurse(p, d, depth, major) {
      var node = d.node,
        dimension = dimensions[depth];
      if (depth == 1) {
        //this is the first interactable dimension..
        dimension.categories = dimension.categories.sort(function (a, b) {
          return b.count - a.count
        })
      }
      dimension.categories.forEach(function (c, i) {
        var k = c.name;
        if (!node.children.hasOwnProperty(k)) return;
        var child = node.children[k];
        child.path = d.path + "\0" + k;
        var target = child.target || { node: c, dimension: dimension };
        target.x = c.in.dx;
        target.dx = child.count / total * (width - spacing);
        c.in.dx += target.dx;
        var source = child.source || { node: p, dimension: dimensions[depth - 1] };
        source.x = p.out.dx;
        source.dx = target.dx;
        //Alok: When only one category is present; make the source offset and width not consider the padding
        if (node.dimension == '___TOP___') {
          source.dx = child.count / total * (width);
          major = ordinal(child.name);
        }
        //End
        p.out.dx += source.dx;

        child.node = child;
        child.source = source;
        child.target = target;
        child.major = major;
        nodes.push(child);
        if (depth + 1 < dimensions.length) recurse(c, child, depth + 1, major);
      });
    }

    return nodes;
  }

  // Dynamic path string for transitions.
  function ribbonPath(d) {
    var s = d.source,
      t = d.target;
    var path = ribbonPathString(s.node.x0 + s.x0, s.dimension.y0, s.dx, t.node.x0 + t.x0, t.dimension.y0, t.dx, tension0)
    if (path == -1) {
      //console.log(d.source.node.name, '->', d.target.node.name, d)
      return " "
    }
    return path;
  }

  // Static path string for mouse handlers.
  function ribbonPathStatic(d) {
    var s = d.source,
      t = d.target;
    return ribbonPathString(s.node.x + s.x, s.dimension.y, s.dx, t.node.x + t.x, t.dimension.y, t.dx, tension);
  }

  function ribbonPathString(sx, sy, sdx, tx, ty, tdx, tension) {
    var m0, m1;
    var string = (tension === 1 ? [
      "M", [sx, sy],
      "L", [tx, ty],
      "h", tdx,
      "L", [sx + sdx, sy],
      "Z"]
      : ["M", [sx, sy],
        "C", [sx, m0 = tension * sy + (1 - tension) * ty], " ",
        [tx, m1 = tension * ty + (1 - tension) * sy], " ", [tx, ty],
        "h", tdx,
        "C", [tx + tdx, m1], " ", [sx + sdx, m0], " ", [sx + sdx, sy],
        "Z"]).join("");
    //TBD: problamatic string paths..
    return (string.indexOf("NaN") > -1) ? -1 : string;
  }

  function compareY(a, b) {
    a = height * a.y, b = height * b.y;
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : a <= a ? -1 : b <= b ? 1 : NaN;
  }
};

d3.parsets.tree = buildTree;

function autoDimensions(d) {
  return d.length ? d3.keys(d[0]).sort() : [];
}

function cancelEvent() {
  d3.event.stopPropagation();
  d3.event.preventDefault();
}

function dimensionName(d) {
  return d.name;
}

function getTotal(dimensions) {
  return dimensions[0].categories.reduce(function (a, d) {
    return a + d.count;
  }, 0);
}

// Given a text function and width function, truncates the text if necessary to
// fit within the given width.
function truncateText(text, width) {
  return function (d, i) {
    var t = this.textContent = text(d, i),
      w = width(d, i);
    if (this.getComputedTextLength() < w) return t;
    this.textContent = "…" + t;
    var lo = 0,
      hi = t.length + 1,
      x;
    while (lo < hi) {
      var mid = lo + hi >> 1;
      if ((x = this.getSubStringLength(0, mid)) < w) lo = mid + 1;
      else hi = mid;
    }
    return lo > 1 ? t.substr(0, lo - 2) + "…" : "";
  };
}

var percent = d3.format("%"),
  comma = d3.format(",f"),
  parsetsEase = "elastic",
  parsetsId = 0;

// Construct tree of all category counts for a given ordered list of
// dimensions.  Similar to d3.nest, except we also set the parent.
function buildTree(root, data, dimensions, value) {
  zeroCounts(root);
  var n = data.length,
    nd = dimensions.length;
  for (var i = 0; i < n; i++) {
    var d = data[i],
      v = +value(d, i),
      node = root;
    for (var j = 0; j < nd; j++) {
      var dimension = dimensions[j],
        category = d[dimension],
        children = node.children;
      node.count += v;
      node = children.hasOwnProperty(category) ? children[category]
        : children[category] = {
          children: j === nd - 1 ? null : {},
          count: 0,
          parent: node,
          dimension: dimension,
          name: category,
          DUPhide: 0
        };
    }
    node.count += v;
  }
  return root;
}

function zeroCounts(d) {
  d.count = 0;
  if (d.children) {
    for (var k in d.children) zeroCounts(d.children[k]);
  }
}

function identity(d) {
  return d;
}

function translateY(d) {
  return "translate(0," + d.y + ")";
}

function defaultTooltip(d) {
  var count = d.count,
    path = [];
  while (d.parent) {
    if (d.name) {
      path.unshift(d.name);
    };
    d = d.parent;
  }
  return [path.join(" → "), comma(count)];
}

function defaultCategoryTooltip(d) {
  return [d.name, comma(d.count)]
}

function removePresident(d) {
  if (typeof d.dimension !== 'undefined') {
    d = d.dimension;
  }
  return d.name !== '___TOP___';
}


////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
///////////////////////                    /////////////////////
////////////////////// CUSTOM CHART LOGIC //////////////////////
/////////////////////                    ///////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

///////////////////////////
// Top level variable space
///////////////////////////
var categoryHidden = [];
var masterList = [];
var globalCustomization;

//////////////////////////////
// Update chart when required
//////////////////////////////
export default function (domNodeSelector, data, customization) {
  d3.select(domNodeSelector).selectAll('*').remove();
  globalCustomization = customization
  masterList = ["___TOP___"];

  var filteredData = data.map(function (d) {
    d['___TOP___'] = customization.overall || "";
    return d;
  });
  Object.keys(filteredData[0]).map(function (d, i) {
    if (d !== "___TOP___" && d !== "___VALUE___") {
      masterList.push(d);
    }
  })
  masterList = masterList.filter((d, i) => i < 11)
  if (data.length == 0 || masterList.length < 2) {
    return -1;
  }
  categoryHidden = globalCustomization.filterHelper.get();

  //Apply a stored list..
  var storedList = (globalCustomization.persist.get() && globalCustomization.persist.get().order) || [];
  var problemDetected = false;
  storedList.map(d => {
    if (masterList.indexOf(d) == -1) {
      problemDetected = true;
    }
  })
  if ((storedList.length == masterList.length) && (problemDetected == false)) {
    masterList = storedList
  }


  var vis = d3.select(domNodeSelector).append("svg");
  var width = d3.select(domNodeSelector).node().getBoundingClientRect().width - 8;
  var height = d3.select(domNodeSelector).node().getBoundingClientRect().height - 8;
  var chart = d3.parsets()
  chart.width(width)
  chart.height(height)
  chart.tension(0.75)
  chart.spacing(50)
  chart.value(function (d) { return d["___VALUE___"] || 1; })//make this optional based on the measure being used..
  chart.dimensions(masterList);
  chart.width(width)
  chart.height(height)
  chart.dimensionFormat((d) => d.replace(/\^\d+$/, ""))
  vis.attr("width", chart.width())
  vis.attr("height", chart.height())
  vis.datum(filteredData)
  vis.call(chart)
}
