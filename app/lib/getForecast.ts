import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

const schema = z.object({
  data: z.object({
    "time-layout": z.object({
      "start-valid-time": z.array(z.coerce.date()),
    }),
    parameters: z.object({
      weather: z.object({
        "weather-conditions": z.array(
          z.object({
            value: z
              .array(
                z.object({
                  type: z.string(),
                  coverage: z.string(),
                })
              )
              .default([]),
          })
        ),
      }),
    }),
  }),
});

const parser = new XMLParser({
  ignoreDeclaration: true,
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (name) => name === "value",
  transformAttributeName: (name) => {
    return name === "weather-type" ? "type" : name;
  },
});

export default async function getForecast() {
  const xmlFetch = await fetch(
    "https://forecast.weather.gov/MapClick.php?lat=38.8443&lon=-106.3136&FcstType=digitalDWML",
    { cache: "no-cache" }
  );
  const xmlText = await xmlFetch.text();
  const obj = parser.parse(xmlText, true).dwml;
  const validatedObj = schema.parse(obj);

  const timestamps = validatedObj.data["time-layout"]["start-valid-time"];
  const weatherConditions =
    validatedObj.data.parameters.weather["weather-conditions"];

  const y = timestamps.map((timestamp, i) => {
    return {
      timestamp,
      values: weatherConditions[i].value,
    };
  });

  console.log(obj);
  console.log(y);
}
