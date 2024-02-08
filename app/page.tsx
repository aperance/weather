import Image from "next/image";
import getForecast from "./lib/getForecast";
import Chart from "./components/Chart";

export default async function Home() {
  const forecast = await getForecast();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Chart
        labels={forecast.data.labels.map((date) =>
          date.toLocaleString("en-US", {
            timeStyle: "short",
          })
        )}
        datasets={[
          {
            data: forecast.data.temperature,
            label: "Temperature",
            borderColor: "green",
            // yAxisID: "yAxisID",
          },
          {
            data: forecast.data.windChill,
            label: "Wind Chill",
            borderColor: "blue",
            // yAxisID: "yAxisID",
          },
        ]}
      />
    </main>
  );
}
