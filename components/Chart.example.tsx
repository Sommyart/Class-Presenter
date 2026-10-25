import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "./Chart";

// Sample data
const timeSeriesData = [
  { name: "Jan", value: 400, value2: 240, value3: 320 },
  { name: "Feb", value: 300, value2: 139, value3: 221 },
  { name: "Mar", value: 200, value2: 980, value3: 590 },
  { name: "Apr", value: 278, value2: 390, value3: 480 },
  { name: "May", value: 189, value2: 480, value3: 380 },
];

const categoryData = [
  { name: "Category A", value: 400, value2: 240 },
  { name: "Category B", value: 300, value2: 139 },
  { name: "Category C", value: 200, value2: 980 },
  { name: "Category D", value: 278, value2: 390 },
];

// Chart configurations
const singleLineConfig = {
  value: {
    label: "Sales",
    color: "var(--primary)",
  },
};

const multiLineConfig = {
  value: {
    label: "Sales",
    color: "var(--primary)",
  },
  value2: {
    label: "Revenue",
    color: "var(--secondary)",
  },
  value3: {
    label: "Profit",
    color: "var(--success)",
  },
};

const areaConfig = {
  value: {
    label: "Traffic",
    color: "var(--info)",
  },
};

const barConfig = {
  value: {
    label: "Users",
    color: "var(--chart-color-5)",
  },
  value2: {
    label: "Active Users",
    color: "var(--chart-color-3)",
  },
};

export const SingleLineChartExample = {
  size: "md",
  backdrop: "surface",
  title: "Single Line Chart With No Height Set (default to 100px)",
  component: () => (
    <ChartContainer config={singleLineConfig}>
      <LineChart data={timeSeriesData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={{ fill: "var(--color-value)" }}
        />
      </LineChart>
    </ChartContainer>
  ),
};

export const MultiLineChartExample = {
  size: "md",
  backdrop: "surface",
  title: "Multi Line Chart with Legend",
  component: () => (
    <div style={{ width: "100%" }}>
      <ChartContainer config={multiLineConfig}>
        <LineChart data={timeSeriesData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={{ fill: "var(--color-value)" }}
          />
          <Line
            type="monotone"
            dataKey="value2"
            stroke="var(--color-value2)"
            strokeWidth={2}
            dot={{ fill: "var(--color-value2)" }}
          />
          <Line
            type="monotone"
            dataKey="value3"
            stroke="var(--color-value3)"
            strokeWidth={2}
            dot={{ fill: "var(--color-value3)" }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  ),
};

export const AreaChartExample = {
  size: "md",
  backdrop: "surface",
  title: "Area Chart",
  component: () => (
    <div style={{ width: "100%" }}>
      <ChartContainer config={areaConfig}>
        <AreaChart data={timeSeriesData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            fill="var(--color-value)"
            fillOpacity={0.3}
            dot={{ fill: "var(--color-value)" }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  ),
};

export const BarChartExample = {
  size: "md",
  backdrop: "surface",
  title: "Bar Chart",
  component: () => (
    <div style={{ width: "100%" }}>
      <ChartContainer config={barConfig}>
        <BarChart data={categoryData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="value" fill="var(--color-value)" />
          <Bar dataKey="value2" fill="var(--color-value2)" />
        </BarChart>
      </ChartContainer>
    </div>
  ),
};
