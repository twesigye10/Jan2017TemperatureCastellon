
    //This design is based on the amazing work of http://www.weather-radials.com/
    //And is only meant as a nice example of how you can use an SVG gradient as a legend

    ///////////////////////////////////////////////////
    //////////////// Set the Scales ///////////////////

    //Set the dimensions of the chart
    var margin = {
            top: 30,
            right: 30,
            bottom: 30,
            left: 50
        },
        width = 600 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    //Set the minimum inner radius and max outer radius of the chart
    var innerRadius = 80,
        outerRadius = 200;

    //Base the color scale on average temperature extremes
    var colorScale = d3.scale.linear()
        .domain([-5, 20])
        .range(["#0D00FF", "#FF4300"]);

    var colorScaleCl = d3.scale.linear()
        .domain([-5, 20])
        .range(["#0D00FF", "#00FF0A"]);
    //Scale for the heights of the bar, not starting at zero to give the bars an initial offset outward
    var barScale = d3.scale.linear()
        .range([innerRadius, outerRadius]);

    //Scale to turn the date into an angle of 360 degrees in total
    //With the first datapoint (1st summary) on top
    var angle = d3.scale.linear()
        .range([-180, 170]);

    // tip showing the date
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            var m = new Date(d.epochTime * 1000);
            return "<strong>Date: </strong> <span style='color:cyan'>" + m.toUTCString() + "</span>" +
                "<br><strong>Conditions: </strong><span style='color:yellow'>" + d.summary + "</span><br><strong>Min temp: </strong><span style='color:cyan'>" + Math.round(d.min_temp) + "°C</span><br><strong>Mean temp: </strong><span style='color:cyan'>" + Math.round(d.mean_temp) + "°C</span><br><strong>Max temp: </strong><span style='color:cyan'>" + Math.round(d.max_temp) + "°C </span>";
        });

    ////////////// Initialize the SVG /////////////////

    //Add the svg canvas for the line chart
    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + (margin.left + width / 2) + "," + margin.top + ")");

    svg.call(tip);

    //Add a title to explain the gradient   
    svg.append("text")
        .attr("class", "title")
        .attr("x", 0)
        .attr("y", -5)
        .text("Temperature around Castellon");

    //////// Get data for castellon january 2017 /////////////////

    var p = [];

    for (var j = 1483228800; j < 1485907200; j += 86400) {
        var jsonDataString = $.ajax({      
            url: "https://api.darksky.net/forecast/eef550a62063b0ccf63bce6134585800/39.9864,-0.0513," + j + "?units=si",
                  dataType: "json",
                  async: false     
        }).responseText; 
        var jsonDataObject = JSON.parse(jsonDataString);         
        p.push(jsonDataObject);
    }

    var tempData = [];

    for (var i = 0; i < p.length; i++) {
        var a = p[i].daily.data[0];  
        var tonedata = {
            epochTime: p[i].currently.time,
            summary: a.summary,
            min_temp: a.temperatureMin,
            mean_temp: (a.temperatureMin + a.temperatureMax) / 2,
            max_temp: a.temperatureMax
        };
        tempData.push(tonedata);
    }

    ///////// Create the Temperature circle ///////////

    //Turn strings into actual numbers
    tempData.forEach(function(d) {
        d.min_temp = +d.min_temp;
        d.max_temp = +d.max_temp;
        d.epochTime = parseInt(d.epochTime);
    });

    //Set the bar and angle domains
    barScale.domain([d3.min(tempData, function(d) {
        return d.min_temp;
    }), d3.max(tempData, function(d) {
        return d.max_temp;
    })]);
    angle.domain(d3.extent(tempData, function(d) {
        return d.epochTime;
    }));

    //Wrapper for the bars and to position it downward
    var nineColorBarWrapper = svg.append("g")
        .attr("transform", "translate(" + 0 + "," + (outerRadius + 10) + ")");

    //Draw gridlines below the bars
    var axes = nineColorBarWrapper.selectAll(".gridCircles")
        .data([-5, 0, 5, 10, 15, 20])
        .enter().append("g");
    //Draw the circles
    axes.append("circle")
        .attr("class", "axisCircles")
        .attr("r", function(d) {
            return barScale(d);
        });
    //Draw the axis labels
    axes.append("text")
        .attr("class", "axisText")
        .attr("y", function(d) {
            return barScale(d);
        })
        .attr("dy", "0.3em")
        .text(function(d) {
            return (d + "°C");
        });

    //Add a small title to explain  
    nineColorBarWrapper.append("text")
        .attr("class", "city")
        .attr("x", 0)
        .attr("y", 0)
        .text("CASTELLON");
    //Add subtitle for stn
    nineColorBarWrapper.append("text")
        .attr("class", "stn")
        .attr("x", 0)
        .attr("y", 22)
        .text("January 2017");

    //Add startstn for reference
    nineColorBarWrapper.append("text")
        .attr("class", "startstn")
        .attr("x", 5)
        .attr("y", -outerRadius * 0.91)
        .text("1st");
    //Add a line to split the stn
    nineColorBarWrapper.append("line")
        .attr("class", "stnLine")
        .attr("x1", 0)
        .attr("y1", -innerRadius * 0.9)
        .attr("x2", 0)
        .attr("y2", -outerRadius * 0.95);

    //Draw a bar per day were the height is the difference between the minimum and maximum temperature
    //And the color is based on the mean temperature
    nineColorBarWrapper.selectAll(".tempBar")
        .data(tempData)
        .enter().append("rect")
        .attr("class", "tempBar")
        .attr("transform", function(d, i) {
            return "rotate(" + (angle(d.epochTime)) + ")";
        })
        .attr("width", 7.5)
        .attr("height", function(d, i) {
            return barScale(d.max_temp) - barScale(d.min_temp);
        })
        .attr("x", -2)
        .attr("y", function(d, i) {
            return barScale(d.min_temp);
        })
        .style("fill", function(d) {
            return colorScale(d.mean_temp);
        });

    ///////////// Create the gradient ////////////////

    //Create a linear gradient with multiple colors 
    svg.append("defs")
        .append("linearGradient")
        .attr("id", "legendGradientTwo")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%")
        .selectAll("stop")
        .data([{
            offset: "0%",
            color: "#0D00FF",
        }, {
            offset: "100%",
            color: "#FF4300"
        }])
        .enter().append("stop")
        .attr("offset", function(d) {
            return d.offset;
        })
        .attr("stop-color", function(d) {
            return d.color;
        });

    svg.append("defs")
        .append("linearGradient")
        .attr("id", "legendGradientTwo1")
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "100%").attr("y2", "0%")
        .selectAll("stop")
        .data([{
            offset: "0%",
            color: "#0D00FF",
        }, {
            offset: "100%",
            color: "#00FF0A"
        }])
        .enter().append("stop")
        .attr("offset", function(d) {
            return d.offset;
        })
        .attr("stop-color", function(d) {
            return d.color;
        });

    /////////////// Create the Legend /////////////////

    var legendWidth = 150;

    //Create a wrapper for the legend
    var legendWrapper = svg.append("g")
        .attr("class", "legendWrapper")
        .attr("transform", "translate(0," + (2 * outerRadius + 40) + ")");

    //Data for the legend text
    var legendText = [{
        x: -legendWidth / 2,
        y: 30,
        text: "-5°C",
        anchor: "start"
    }, {
        x: 0,
        y: 0,
        text: "Daily temperature",
        anchor: "middle"
    }, {
        x: legendWidth / 2,
        y: 30,
        text: "20°C",
        anchor: "end"
    }];

    //Draw the rectangle and fill with the gradient
    legendWrapper.append("rect")
        .attr("class", "legend")
        .attr("x", -legendWidth / 2)
        .attr("y", 10)
        .attr("rx", 4)
        .attr("width", legendWidth)
        .attr("height", 8)
        .style("fill", "url(#legendGradientTwo)");


    //Append the text along the legend
    legendWrapper.selectAll(".legendText")
        .data(legendText)
        .enter().append("text")
        .attr("class", "legendText")
        .attr("x", function(d) {
            return d.x;
        })
        .attr("y", function(d) {
            return d.y;
        })
        .style("text-anchor", function(d) {
            return d.anchor;
        })
        .text(function(d) {
            return d.text;
        });

    // mouse events to show the tip and changing the color on click for both the bars and the legend 
    d3.selectAll("rect")
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide)
        .on("click", function() {
            legendWrapper.append("rect")
                .attr("class", "legend")
                .attr("x", -legendWidth / 2)
                .attr("y", 10)
                .attr("rx", 4)
                .attr("width", legendWidth)
                .attr("height", 8)
                .style("fill", "url(#legendGradientTwo1)");

            d3.selectAll("rect")
                .transition()
                .duration(5000)
                .style("fill", function(d) {
                    return colorScaleCl(d.max_temp);
                });

        });