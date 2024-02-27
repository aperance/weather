import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

const schema = z.object({
  data: z
    .object({
      "time-layout": z.object({
        "start-valid-time": z.array(z.object({ node: z.coerce.date() })),
      }),
      parameters: z.object({
        temperature: z.array(
          z.object({
            value: z.array(z.object({ node: z.number().nullish() })),
            type: z.union([
              z.literal("hourly"),
              z.literal("wind chill"),
              z.literal("dew point"),
            ]),
          })
        ),
        "wind-speed": z.array(
          z.object({
            value: z.array(z.object({ node: z.number().nullish() })),
            type: z.string(),
          })
        ),
        "probability-of-precipitation": z.object({
          value: z.array(z.object({ node: z.number().nullish() })),
        }),
        "cloud-amount": z.object({
          value: z.array(z.object({ node: z.number().nullish() })),
        }),
        humidity: z.object({
          value: z.array(z.object({ node: z.number().nullish() })),
        }),
        direction: z.object({
          value: z.array(z.object({ node: z.number().nullish() })),
        }),
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
    .transform((obj) => {
      const labels = obj["time-layout"]["start-valid-time"];
      const temperature = Object.fromEntries(
        obj.parameters.temperature.map(({ type, value }) => [type, value])
      );
      return labels.map((label, i) => ({
        label: label.node,
        temperature: temperature["hourly"][i].node ?? null,
        windChill:
          obj.parameters.temperature.find(({ type }) => type === "wind chill")
            ?.value[i].node ?? null,
        dewPoint:
          obj.parameters.temperature.find(({ type }) => type === "dew point")
            ?.value[i].node ?? null,
        humidity: obj.parameters.humidity.value[i].node ?? null,
        precipitation:
          obj.parameters["probability-of-precipitation"].value[i].node ?? null,
        cloudCover: obj.parameters["cloud-amount"].value[i].node ?? null,
        windDirection: obj.parameters.direction.value[i].node ?? null,
        windSustained:
          obj.parameters["wind-speed"].find(({ type }) => type === "sustained")
            ?.value[i].node ?? null,
        windGusts:
          obj.parameters["wind-speed"].find(({ type }) => type === "gust")
            ?.value[i].node ?? null,
        rain: obj.parameters.weather["weather-conditions"].map(
          ({ value }) =>
            value.find(({ type }) => type === "rain")?.coverage ?? ""
        )[i],
        thunderstorms: obj.parameters.weather["weather-conditions"].map(
          ({ value }) =>
            value.find(({ type }) => type === "thunderstorms")?.coverage ?? ""
        )[i],
        snow: obj.parameters.weather["weather-conditions"].map(
          ({ value }) =>
            value.find(({ type }) => type === "snow")?.coverage ?? ""
        )[i],
      }));
    })
    .pipe(
      z.array(
        z.object({
          label: z.date(),
          temperature: z.number().nullable(),
          windChill: z.number().nullable(),
          dewPoint: z.number().nullable(),
          humidity: z.number().nullable(),
          precipitation: z.number().nullable(),
          cloudCover: z.number().nullable(),
          windDirection: z.number().nullable(),
          windSustained: z.number().nullable(),
          windGusts: z.number().nullable(),
          rain: z.string(),
          thunderstorms: z.string(),
          snow: z.string(),
        })
      )
    ),
});

const xmlParser = new XMLParser({
  ignoreDeclaration: true,
  ignoreAttributes: false,
  attributeNamePrefix: "",
  alwaysCreateTextNode: true,
  textNodeName: "node",
  isArray: (name) => name === "value",
  transformAttributeName: (name) => (name === "weather-type" ? "type" : name),
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
  console.log(validatedObj);

  return validatedObj;
}
