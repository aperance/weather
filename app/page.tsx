import Chart from "./components/Chart";
import getForecast from "./lib/getForecast";

export default async function Home() {
  const forecast = await getForecast();

  const temperature = forecast.data.slice(0, 30);

  return (
    <main className="flex flex-col h-screen p-24 gap-10">
      <Chart data={temperature} />
    </main>
  );
}
