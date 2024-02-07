import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

const schema = z.object({
  data: z
    .object({
      "time-layout": z.object({
        "start-valid-time": z.array(z.coerce.date()),
      }),
      parameters: z.object({
        temperature: z
          .array(z.object({ value: z.array(z.number()), type: z.string() }))
          .transform((arr) =>
            Object.fromEntries(arr.map(({ type, value }) => [type, value]))
          )
          .pipe(
            z.object({
              hourly: z.array(z.number()),
              "wind chill": z.array(z.number()),
              "dew point": z.array(z.number()),
            })
          ),
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
    })
    .transform((obj) => ({
      labels: obj["time-layout"]["start-valid-time"],
      temperature: obj.parameters.temperature.hourly,
      windChill: obj.parameters.temperature["wind chill"],
      dewPoint: obj.parameters.temperature["dew point"],
      thunderstorms: obj.parameters.weather["weather-conditions"].map(
        ({ value }) =>
          value.find(({ type }) => type === "thunderstorms")?.coverage ?? ""
      ),
      snow: obj.parameters.weather["weather-conditions"].map(
        ({ value }) => value.find(({ type }) => type === "snow")?.coverage ?? ""
      ),
    })),
});

const xmlParser = new XMLParser({
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
  const obj = xmlParser.parse(xmlText, true).dwml;
  console.log(obj.data);
  const validatedObj = schema.parse(obj);
  console.log({ validatedObj });
}
