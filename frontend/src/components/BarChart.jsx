import { scaleBand, scaleLinear, max } from "d3";

export const BarChart = ({ data, width = 320, height = 220 }) => {
  var empty = true;
  if (!data?.length) {
    return <div className="chart-empty">No Data</div>;
  }
  for (var i = 0; i < data.length; i++) {
      if (data[i].value > 0) {
        empty = false;
      }
  }

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