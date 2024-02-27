"use client";

import React from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export default function Chart(props: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={props.data}>
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Bar dataKey="temperature" label fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
