import React from "react";
import { pie, arc } from "d3";

export const PieChart = ({ data, width = 250, height = 250 }) => {
  var empty = true;
  if (!data?.length) {
    return <div className="chart-empty">No Data</div>;
  }
  for (var i = 0; i < data.length; i++) {
      if (data[i].value > 0) {
        empty = false;
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

export const PieLegend = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="pie-legend">
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