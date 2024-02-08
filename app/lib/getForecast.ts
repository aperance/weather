import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

const valuesSchema = (type: z.ZodTypeAny) =>
  z.array(z.object({ node: type }).transform((o) => o.node));

const valueArrayToObject = (arr: any[]) =>
  Object.fromEntries(arr.map(({ type, value }) => [type, value]));

const schema = z.object({
  data: z
    .object({
      "time-layout": z.object({
        "start-valid-time": valuesSchema(z.coerce.date()),
      }),
      parameters: z.object({
        temperature: z
          .array(
            z.object({
              value: valuesSchema(z.number().nullable().default(null)),
              type: z.string(),
            })
          )
          .transform(valueArrayToObject),
        "wind-speed": z
          .array(
            z.object({
              value: valuesSchema(z.number().optional()),
              type: z.string(),
            })
          )
          .transform(valueArrayToObject),
        "probability-of-precipitation": z.object({
          value: valuesSchema(z.number().optional()),
        }),
        "cloud-amount": z.object({
          value: valuesSchema(z.number().optional()),
        }),
        humidity: z.object({
          value: valuesSchema(z.number().optional()),
        }),
        direction: z.object({
          value: valuesSchema(z.number().optional()),
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
    .transform((obj) => ({
      labels: obj["time-layout"]["start-valid-time"],
      temperature: obj.parameters.temperature.hourly,
      windChill: obj.parameters.temperature["wind chill"],
      dewPoint: obj.parameters.temperature["dew point"],
      humidity: obj.parameters.humidity.value,
      precipitation: obj.parameters["probability-of-precipitation"].value,
      cloudCover: obj.parameters["cloud-amount"].value,
      windDirection: obj.parameters.direction.value,
      windSustained: obj.parameters["wind-speed"].sustained,
      windGusts: obj.parameters["wind-speed"].gust,
      rain: obj.parameters.weather["weather-conditions"].map(
        ({ value }) => value.find(({ type }) => type === "rain")?.coverage ?? ""
      ),
      thunderstorms: obj.parameters.weather["weather-conditions"].map(
        ({ value }) =>
          value.find(({ type }) => type === "thunderstorms")?.coverage ?? ""
      ),
      snow: obj.parameters.weather["weather-conditions"].map(
        ({ value }) => value.find(({ type }) => type === "snow")?.coverage ?? ""
      ),
    }))
    .pipe(
      z.object({
        labels: z.array(z.date()),
        temperature: z.array(z.number().nullable()),
        windChill: z.array(z.number().nullable()),
        dewPoint: z.array(z.number().nullable()),
        humidity: z.array(z.number().optional()),
        precipitation: z.array(z.number().optional()),
        cloudCover: z.array(z.number().optional()),
        windDirection: z.array(z.number().optional()),
        windSustained: z.array(z.number().optional()),
        windGusts: z.array(z.number().optional()),
        rain: z.array(z.string()),
        thunderstorms: z.array(z.string()),
        snow: z.array(z.string()),
      })
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
