$( function() {
function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}


$( "#draggable" ).draggable();


var dir_name = getQueryVariable("d");
var filename = getQueryVariable("f")+".json";
console.log("Directory name: ", dir_name);
console.log("Filename: ", filename);
// Set the dimensions and margins of the diagram
var margin = { top: 20, right: 90, bottom: 30, left: 90 },
  width = 4000 - margin.left - margin.right,
  height = 4000 - margin.top - margin.bottom;

var scaleC = d3
.scaleLinear()
.range([d3.rgb("#006400"), d3.rgb("#00FF00")]);

var counter = 2;
// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3
  .select("body")
  .append("svg")
  .attr("width", width + margin.right + margin.left)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var i = 0,
  duration = 750,
  root;

function getColor(d) {
  switch(d.state) {
    case "Infeasible": 
      return d3.rgb("#FF0000");
    case "Integral":
      return d3.rgb("#0000FF");
    case "Branch":
      return d3.rgb("#FFBB00");
    default:
      return scaleC(d.best_bound);
  }
}

function getFill(d) {
  if (d._children) {
    return "lightsteelblue";
  } else if(d.data.step_obj.node.relaxation_state == "Optimal") {
    return "#fb0";
  } else if(d.data.step_obj.node.relaxation_state == "Infeasible") {
    return "#f00";
  } else if(d.data.step_obj.node.relaxation_state == "Error") {
    return "#000";
  } 
  return "#fff";
}

var nodesWithChildren = 1; // for root
function sumNodesWithChildren(d) {
  if (d.data.state == "Done") {
    nodesWithChildren += 1;
  }
}


// declares a tree layout and assigns the size
var treemap = d3.tree().size([width, height]);

// Assigns parent, children, height, depth
d3.json("data/json/"+dir_name+"/"+filename, function(error, jsonData) {


  console.log("sense: ",jsonData.info.sense);
  if (jsonData.info.sense == "Min") {
    scaleC.domain([jsonData.relaxation.objVal,jsonData.solution.objVal]);
  } else {
    scaleC.domain([jsonData.solution.objVal, jsonData.relaxation.objVal]);
  }

  root = d3.hierarchy(jsonData.tree, function(d) {
    return d.children;
  });
  root.x0 = width / 2;
  root.y0 = 0;

  // Collapse after the second level
  // root.children.forEach(collapse);

  update(root);

  // Collapse the node and all it's children
  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  function update(source, var_idx=false, leafs=true) {
    console.log("var_idx: ", var_idx);
    console.log("leafs: ", leafs);

    // Assigns the x and y position for the nodes
    var treeData = treemap(root);
    console.log("treeData: ", treeData)

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);
    // Normalize for fixed-depth.
    nodes.forEach(function(d) {
      d.y = d.depth * 80;
    });

    // ****************** Nodes section ***************************

    // Update the nodes...
    var node = svg.selectAll("g.node").data(nodes, function(d) {
      return d.id || (d.id = ++i);
    });

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", function(d) {
        return "translate(" + source.x0 + "," + source.y0 + ")";
      })
      .on("click", click)
      .on("mouseover", (d) => {
        var html = "";
        if ("counter" in d.data.step_obj) {
          html += "<span>Counter: "+d.data.step_obj.counter+"</span><br>\n";
          html += "<span>Var Idx: "+d.data.step_obj.var_idx+"</span><br>\n";
          html += "<span>Disc Idx: "+jsonData.info.var2disc_idx[d.data.step_obj.var_idx]+"</span><br>\n";
        } else {
          html += "<span>Status: "+d.data.step_obj.node.state+"</span><br>\n";
        }
        html += "<span>Best bound: "+d.data.step_obj.node.best_bound+"</span><br>\n";
        $("#draggable").html(html);
      });

      var items = [
        {
          label: "Everything",
          onClick: function (d) {
            update(root);
          }
        },
        {
          label: "Nodes branched on this var_idx",
          onClick: function (d) {
            update(root, var_idx=d.data.step_obj.var_idx, leafs=false);
          }
        },
        {
          label: "Nodes branched on this var_idx + leafs",
          onClick: function (d) {
            update(root, var_idx=d.data.step_obj.var_idx, leafs=true);
          }
        }
      ];

    // Add Circle for the nodes
    nodeEnter
      .append("circle")
      .attr("class", "node")
      .attr("id", d=>{return "node-"+d.data.step_obj.counter})
      .attr("stroke", d => {
        return getColor(d.data.step_obj.node);
      })
      .attr("data-hash", d => {return d.data.hash})
      .attr("data-status", d => {return d.data.step_obj.node.state})
      .attr("data-rel-status", d => {return d.data.step_obj.node.relaxation_state})
      .attr("data-bound", d => {return d.data.step_obj.node.best_bound})
      .attr("r", 1e-6)
      .style("fill", function(d) {
        return getFill(d);
      })
      .on("contextmenu", d3.contextmenu(items))
      .attr("children-counter", d=>{sumNodesWithChildren(d)})

    // Add labels for the nodes
    nodeEnter
      .append("text")
      .attr("dy", ".35em")
      .attr("x", function(d) {
        return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function(d) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function(d) {
        let bb;
        if (d.data.best_bound == null) {
          bb = "";
        } else {
           bb = d.data.best_bound.toPrecision(3);
        }
        if (d.data.var_idx) {
          return d.data.var_idx+","+bb;
        } else {
          return bb;
        }
      });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate
      .transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    // Update the node attributes and style
    nodeUpdate
      .select("circle.node")
      .attr("r", function(d) {
        // if var_idx is set => display only the corresponding variables
        if (var_idx) {
          if (d.data.step_obj.var_idx == var_idx) {
            return 5;
          } else {
            if (leafs && d.children == null && d.parent.data.step_obj.var_idx == var_idx) {
              return 5;
            }
            return 0;
          }

        } else {  
          return 5;
        }
      })
      .style("fill", function(d) {
        return getFill(d);
      })
      .attr("cursor", "pointer");

    // Remove any exiting nodes
    var nodeExit = node
      .exit()
      .transition()
      .duration(duration)
      .attr("transform", function(d) {
        return "translate(" + source.x + "," + source.y + ")";
      })
      .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select("circle").attr("r", 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select("text").style("fill-opacity", 1e-6);

    // ****************** links section ***************************

    // Update the links...
    var link = svg.selectAll("path.link").data(links, function(d) {
      return d.id;
    });

    // Enter any new links at the parent's previous position.
    var linkEnter = link
      .enter()
      .insert("path", "g")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke","#ccc")
      .attr("stroke-width", "2px")
      .attr("d", function(d) {
        var o = { x: source.x0, y: source.y0 };
        return diagonal(o, o);
      });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate
      .transition()
      .duration(duration)
      .attr("d", function(d) {
        return diagonal(d, d.parent);
      });

    // Remove any exiting links
    var linkExit = link
      .exit()
      .transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = { x: source.x, y: source.y };
        return diagonal(o, o);
      })
      .remove();

    // Store the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {
      path = `M ${d.x} ${d.y}
            C ${s.x} ${(d.y + s.y) / 2},
              ${s.x} ${(d.y + s.y) / 2},
              ${s.x} ${s.y}`;

      return path;
    }

    // Toggle children on click.
    function click(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      console.log("click: ", d);
      update(d, var_idx, leafs);
    }

    function clickNext() {
      for (let node of nodes) {
        if (node.data.step_obj.counter == counter) {
          scrollToElement(document.getElementById("node-"+counter), endCallback = () => {
            click(node);
          });
          counter++;
          break
        }
      }
    }
    // clickNext()
    // setTimeout(clickNext, 1000)
  }

  function scrollToElement(element, duration = 100, delay = 0, easing = "easeLinear", endCallback = () => {}) {
    var offsetTop = window.pageYOffset || document.documentElement.scrollTop
    d3.transition()
      .ease(d3.easeLinear)  
      .duration(duration)
      .tween("scroll", (offset => () => {
        var i = d3.interpolateNumber(offsetTop, offset);
        return t => scrollTo(0, i(t))
      })(offsetTop + element.getBoundingClientRect().top-window.screen.availHeight/2))
      .on("end", endCallback);
  }
});

});