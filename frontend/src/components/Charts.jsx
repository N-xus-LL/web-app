import React from "react";
import { pie, arc, scaleBand, scaleLinear, max } from "d3";

export const DonutChart = ({data, size = 250, centerText = ""}) => {
  var empty = true;
  if (!data?.length) {
    return <div className="chart-empty">No Data</div>;
  }
  for (var i = 0; i < data.length; i++) {
      if (data[i].value > 0) {
        empty = false;
        break;
      }
  }

  if (empty) { return <div className="chart-empty">No Data</div> }

  const radius = size / 2;

  const pieData = pie().value(d => d.value)(data);

  const arcGenerator = arc().innerRadius(radius * 0.55).outerRadius(radius * 0.9);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <svg width={size} height={size}>
      <g transform={`translate(${radius}, ${radius})`}>
        {pieData.map((slice, index) => (
          <path
            key={index}
            d={arcGenerator(slice)}
            fill={slice.data.color}
          />
        ))}

        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="20"
          fontWeight="600"
          fill="var(--text-label)"
        >
          {centerText || total}
        </text>
      </g>
    </svg>
  );
}

export const PieChart = ({ data, width = 250, height = 250 }) => {
  var empty = true;
  if (!data?.length) {
    return <div className="chart-empty">No Data</div>;
  }
  for (var i = 0; i < data.length; i++) {
      if (data[i].value > 0) {
        empty = false;
        break;
      }
  }

  if (empty) { return <div className="chart-empty">No Data</div> }

  const radius = Math.min(width, height) / 2;

  const pieData = pie().value(d => d.value)(data);

  const arcGenerator = arc().innerRadius(0).outerRadius(radius);

  const labelArc = arc().innerRadius(radius - 10).outerRadius(radius - 10);

  return (
    <svg width={width} height={height}>
      <g transform={`translate(${width / 2}, ${height / 2})`}>

        {pieData.map((d, i) => (
          <path
            key={i}
            d={arcGenerator(d)}
            fill={d.data.color}
          />
        ))}

        {pieData.map((d, i) => {
          if (d.endAngle - d.startAngle < 0.2) return null;
          const [x, y] = labelArc.centroid(d);

          return (
            <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="16"
                fontWeight="600"
                fill="var(--text-muted)"
                pointerEvents="none"
            >
              {d.data.value}
            </text>
          );
        })}

      </g>
    </svg>
  );
}

export const BarChart = ({ data, width = 320, height = 220 }) => {
  var empty = true;
  if (!data?.length) {
    return <div className="chart-empty">No Data</div>;
  }
  for (var i = 0; i < data.length; i++) {
      if (data[i].value > 0) {
        empty = false;
        break;
      }
  }

  if (empty) { return <div className="chart-empty">No Data</div> }

  const margin = { top: 30, right: 10, bottom: 30, left: 30 };

  const x = scaleBand()
    .domain(data.map(d => d.label))
    .range([margin.left, width - margin.right])
    .padding(0.25);

  const y = scaleLinear()
    .domain([0, max(data, d => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  return (
    <div className="chart-container">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
        {data.map((d, i) => (
          <g key={i}>
            <rect
              x={x(d.label)}
              y={y(d.value)}
              width={x.bandwidth()}
              height={y(0) - y(d.value)}
              fill={d.color}
              rx={4}
            />

            <text
              x={x(d.label) + x.bandwidth() / 2}
              y={y(d.value) - 6}
              textAnchor="middle"
              fontSize="14"
              fill="var(--text-label)"
            >
              {d.value}
            </text>

            <text
              x={x(d.label) + x.bandwidth() / 2}
              y={height - 10}
              textAnchor="middle"
              fontSize="14"
              fill="var(--text-label)"
            >
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export const ChartLegend = ({ data }) => {
  var empty = true;
  if (!data?.length) {
    return null;
  }
  for (var i = 0; i < data.length; i++) {
      if (data[i].value > 0) {
        empty = false;
      }
  }

  if (empty) { return null }

  return (
    <div className="chart-legend">
      {data.map((d, i) => (
        <div key={i} className="legend-item">
           <div
             style={{
               width: "12px",
               height: "12px",
               borderRadius: "50%",
               backgroundColor: d.color,
               display: "inline-block",
               marginRight: "8px"
             }}
           />
          <span className="legend-text">
            {d.label} ({d.value})
          </span>
        </div>
      ))}
    </div>
  );
}