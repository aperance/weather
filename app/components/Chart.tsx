"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Chart(
  data: ChartData<"line", (number | null)[], unknown>
) {
  return (
    <Line
      options={{
        responsive: true,
        scales: {
          yAxisID: {
            type: "linear",
            position: "left",
            title: {
              display: true,
              text: "Temperature (F)",
            },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
          },
          title: {
            display: true,
            text: "Chart.js Line Chart",
          },
        },
      }}
      data={data}
    />
  );
}
