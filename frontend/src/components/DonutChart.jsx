import { pie, arc } from "d3";

export const DonutChart = ({data, size = 250, centerText = ""}) => {
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


export const DonutLegend = ({ data }) => {
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