import React, { useMemo } from 'react';

const AdvancedHeatMap = ({
  data = [],
  width = 600,
  height = 400,
  margin = { top: 40, right: 40, bottom: 60, left: 60 },
  colorScale = ['#E5E7EB', '#3B82F6', '#1E40AF'],
  title = '',
  xAxisLabel = '',
  yAxisLabel = '',
  cellSize = 'auto',
  showValues = false,
  showTooltip = true,
  onClick = null,
  formatValue = (value) => value,
  formatTooltip = (x, y, value) => `${x}, ${y}: ${formatValue(value)}`
}) => {
  // Process data to get x and y labels and create matrix
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { matrix: [], xLabels: [], yLabels: [], min: 0, max: 0 };
    
    // Extract unique x and y labels
    const xLabels = [...new Set(data.map(d => d.x))].sort();
    const yLabels = [...new Set(data.map(d => d.y))].sort();
    
    // Create matrix
    const matrix = yLabels.map(y => 
      xLabels.map(x => {
        const point = data.find(d => d.x === x && d.y === y);
        return point ? point.value : 0;
      })
    );
    
    // Find min and max values for color scaling
    const allValues = data.map(d => d.value);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    
    return { matrix, xLabels, yLabels, min, max };
  }, [data]);

  const { matrix, xLabels, yLabels, min, max } = processedData;

  // Calculate cell dimensions
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const cellWidth = cellSize === 'auto' ? chartWidth / xLabels.length : cellSize;
  const cellHeight = cellSize === 'auto' ? chartHeight / yLabels.length : cellSize;

  // Get color for value
  const getColor = (value) => {
    if (max === min) return colorScale[0];
    
    const normalized = (value - min) / (max - min);
    
    if (normalized <= 0) return colorScale[0];
    if (normalized >= 1) return colorScale[colorScale.length - 1];
    
    // Interpolate between colors
    const segmentIndex = Math.floor(normalized * (colorScale.length - 1));
    const segmentProgress = (normalized * (colorScale.length - 1)) - segmentIndex;
    
    const color1 = colorScale[segmentIndex];
    const color2 = colorScale[Math.min(segmentIndex + 1, colorScale.length - 1)];
    
    // Simple color interpolation (assuming hex colors)
    if (segmentProgress === 0) return color1;
    
    return interpolateColor(color1, color2, segmentProgress);
  };

  // Simple hex color interpolation
  const interpolateColor = (color1, color2, factor) => {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.slice(0, 2), 16);
    const g1 = parseInt(hex1.slice(2, 4), 16);
    const b1 = parseInt(hex1.slice(4, 6), 16);
    
    const r2 = parseInt(hex2.slice(0, 2), 16);
    const g2 = parseInt(hex2.slice(2, 4), 16);
    const b2 = parseInt(hex2.slice(4, 6), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Tooltip state
  const [tooltip, setTooltip] = React.useState({ show: false, x: 0, y: 0, content: '' });

  const handleCellHover = (event, x, y, value) => {
    if (!showTooltip) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      x: event.clientX,
      y: event.clientY - 10,
      content: formatTooltip(x, y, value)
    });
  };

  const handleCellLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, content: '' });
  };

  const handleCellClick = (x, y, value) => {
    if (onClick) {
      onClick({ x, y, value });
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <div className="text-gray-500 dark:text-gray-400">No data available</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {title && (
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}
      
      <svg width={width} height={height} className="overflow-visible">
        {/* Chart area */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Heatmap cells */}
          {matrix.map((row, yIndex) =>
            row.map((value, xIndex) => (
              <rect
                key={`${xIndex}-${yIndex}`}
                x={xIndex * cellWidth}
                y={yIndex * cellHeight}
                width={cellWidth}
                height={cellHeight}
                fill={getColor(value)}
                stroke="#ffffff"
                strokeWidth={1}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={(e) => handleCellHover(e, xLabels[xIndex], yLabels[yIndex], value)}
                onMouseLeave={handleCellLeave}
                onClick={() => handleCellClick(xLabels[xIndex], yLabels[yIndex], value)}
              />
            ))
          )}
          
          {/* Cell values */}
          {showValues && matrix.map((row, yIndex) =>
            row.map((value, xIndex) => (
              <text
                key={`text-${xIndex}-${yIndex}`}
                x={xIndex * cellWidth + cellWidth / 2}
                y={yIndex * cellHeight + cellHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-medium fill-current pointer-events-none"
                fill={value > (max - min) * 0.5 + min ? '#ffffff' : '#000000'}
              >
                {formatValue(value)}
              </text>
            ))
          )}
        </g>
        
        {/* X-axis labels */}
        <g transform={`translate(${margin.left}, ${height - margin.bottom + 15})`}>
          {xLabels.map((label, index) => (
            <text
              key={`x-label-${index}`}
              x={index * cellWidth + cellWidth / 2}
              y={0}
              textAnchor="middle"
              className="text-xs fill-gray-600 dark:fill-gray-400"
            >
              {label}
            </text>
          ))}
          {xAxisLabel && (
            <text
              x={chartWidth / 2}
              y={30}
              textAnchor="middle"
              className="text-sm font-medium fill-gray-700 dark:fill-gray-300"
            >
              {xAxisLabel}
            </text>
          )}
        </g>
        
        {/* Y-axis labels */}
        <g transform={`translate(${margin.left - 10}, ${margin.top})`}>
          {yLabels.map((label, index) => (
            <text
              key={`y-label-${index}`}
              x={0}
              y={index * cellHeight + cellHeight / 2}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-xs fill-gray-600 dark:fill-gray-400"
            >
              {label}
            </text>
          ))}
          {yAxisLabel && (
            <text
              x={-30}
              y={chartHeight / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(-90, -30, ${chartHeight / 2})`}
              className="text-sm font-medium fill-gray-700 dark:fill-gray-300"
            >
              {yAxisLabel}
            </text>
          )}
        </g>
      </svg>
      
      {/* Color scale legend */}
      <div className="flex items-center justify-center mt-4 space-x-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatValue(min)}
        </span>
        <div className="flex">
          {colorScale.map((color, index) => (
            <div
              key={index}
              className="w-6 h-4"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {formatValue(max)}
        </span>
      </div>
      
      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="absolute z-50 bg-gray-900 text-white text-sm rounded px-2 py-1 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%)'
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default AdvancedHeatMap;
