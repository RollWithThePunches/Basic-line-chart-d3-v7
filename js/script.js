;(function() {
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this,
        args = arguments;
      var later = function() {
        timeout = null
        if (!immediate) func.apply(context, args);
      }
      var callNow = immediate && !timeout
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    }
  }

const margin = { top: 20, right: 20, bottom: 20, left: 50 };
const wrap = d3.select('#chart--wrap');
let wrapWidth = parseInt(wrap.style('width'));
let width = wrapWidth - margin.left - margin.right;
let height = 300 - margin.top - margin.bottom;
const src = 'data/data.csv';
const parseDate = d3.timeParse('%Y');
const xTicks = 5;
const catConfig = [{
  column: 'amountA',
  color: '#5626C4',
  legendText: 'Item A'
},
{
  column: 'amountB',
  color: '#E60576',
  legendText: 'Item B'
}];

// Axes and scales
  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);
  const xAxis = d3.axisBottom(x).ticks(xTicks);
  const yAxis = d3.axisLeft(y).ticks(3);

  // Horizontal grid lines
  const gridLines = () => {
    return d3.axisLeft(y).ticks(3)
  }

  // Colors
  let colors = [];
  catConfig.forEach(d => { colors.push(d.color); });
  colors = d3.scaleOrdinal().range(colors);

  // Line
  const line = d3.line()
    .x(d => { return x(d.year); })
    .y(d => { return y(d.number); })
    .curve(d3.curveCardinal);

  // Legend
  const legendWrap = wrap.append('div')
    .attr('class', 'legend');

  const legend = legendWrap.append('ul')
  .attr('class', 'legend--ul')

  const key = legend.selectAll('key')
    .data(catConfig)
    .enter()
    .append('li')
    .attr('class', 'legend--ul-li')

  key.append('span')
    .attr('class', 'legend--span-line')
    .style('background-color', d => {
      return colors(d.color)
    })

  key.insert('span')
    .attr('class', 'legend--span-label')
    .text(d => { return d.legendText });

  // SVG 
  const svg = wrap.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);
    
  const group = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);   


  // Import data and create lines
  async function drawLine() {
    const data = await d3.csv(src);

    data.forEach(d => {
      d.year = parseDate(d.year);
    });

    const prodCat = Object.keys(data[0]).filter(key => {
      return key !== 'year';
    });
    colors.domain(prodCat);

    const numbers = prodCat.map(cat => {
      return {
        category: cat,
        datapoints: data.map(d => {
          return { year: d.year, number: +d[cat] }
        })
      }
    });

    // Axis domains
    x.domain(d3.extent(data, d => { return d.year; }));
    y.domain([0, 6000]);
    
    // Y axis
    group.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)

    // Grid lines
    group.append('g')
      .attr('class', 'grid')
      .attr('stroke-width', .75)
      .call(gridLines().tickSize(-width).tickFormat(''));

    // X axis
    group.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis.tickFormat(d3.timeFormat('%Y')));

    // Create lines
    group.selectAll('.cat')
      .data(numbers)
      .enter()
      .append('g')
      .attr('class', 'cat')
      .append('path')
      .attr('class', 'line')
      .attr('d', d => { return line(d.datapoints) })
      .style('stroke', d => { return colors(d.category) })
      .style('stroke-width', '2')
      .style('fill', 'none');

  }
  drawLine();

  // Resize
  const resize = () => {
    let wrapWidth = parseInt(wrap.style('width'));
    let width = wrapWidth - margin.left - margin.right;
    let height = 300 - margin.top - margin.bottom;

    x.range([0, width]);
    y.range([height, 0]);

    svg.attr('width', width + margin.left + margin.right);

    group.select('.x-axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis);

    group.select('.y-axis').call(yAxis);

    group.select('.grid')
      .call(gridLines().tickSize(-width).tickFormat(''));

    group.selectAll('.line')
      .attr('d', d => { return line(d.datapoints) })
  }

  d3.select(window).on('resize', debounce(function() {
    resize();
  }, 250));
 })();