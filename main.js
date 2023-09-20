import http from "http";
import url from "url";
import fetch from "node-fetch";
import * as fs from "fs/promises";

const cities = [
  { id: 1, name: "New York", lat: 40.7128, lng: -74.006 },
  { id: 2, name: "London", lat: 51.5074, lng: -0.1278 },
  { id: 3, name: "Paris", lat: 48.8566, lng: 2.3522 },
  { id: 4, name: "Tokyo", lat: 35.6895, lng: 139.6917 },
  { id: 5, name: "Sydney", lat: -33.8651, lng: 151.2099 },
  { id: 6, name: "Rome", lat: 41.9028, lng: 12.4964 },
  { id: 7, name: "Cairo", lat: 30.0444, lng: 31.2357 },
  { id: 8, name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729 },
  { id: 9, name: "Dubai", lat: 25.2048, lng: 55.2708 },
  { id: 10, name: "Rabat", lat: 34.0209, lng: -6.8416 },
];

async function getTemperature(city) {
  try {
    let { lat, lng } = city;
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=733e5f5dc03d7ee328041f754a0508dc&units=metric`
    );
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to fetch temperature data for ${city.name} \n`);
    }
  } catch (Err) {
    throw new Error(
      `Failed to fetch temperature data for ${city.name}: ${Err.message} \n`
    );
  }
}
async function displayTemperature(city, jsonData) {
  try {
    const cityName = city.name;
    const filePath = `weather/${cityName}.txt`;

    // Unlink the file if it exists, or ignore if it doesn't
    try {
      await fs.unlink(filePath);
    } catch (err) {
      if (err.code !== "ENOENT") {
        throw err; // Re-throw the error if it's not a "file not found" error
      }
    }

    for (let i = 0; i < jsonData.length; i++) {
      let dateTimeString = jsonData[i].dt_txt;

      await fs.appendFile(
        filePath,
        `Temperature: ${jsonData[i].main.temp}\ndate: ${dateTimeString}\nDescription: ${jsonData[i].weather[0].description}\nIcon: ${jsonData[i].weather[0].icon}\n\n`
      );
    }
  } catch (Err) {
    throw new Error(
      `Failed to display temperature for ${city.name}: ${Err.message} \n`
    );
  }
}
const server = http
  .createServer(async (req, res) => {
    try {
      let parseUrl = url.parse(req.url, true);
      let path = parseUrl.pathname;
      let query = parseUrl.query;

      if (path == "/weather") {
        if (query.city) {
          let findCity = cities.find((item) => {
            return item.name.toLowerCase() == query.city.toLowerCase();
          });

          if (findCity) {
            try {
              let response = await getTemperature(findCity);
              response = response.list;
              // res.write(JSON.stringify(response));
              await displayTemperature(findCity, response);
            } catch (err) {
              res.statusCode = 404;
              res.write(err.message);
            }
          } else {
            res.statusCode = 404;
            res.write(`City not found: ${query.city}\n`);
          }
        } else {
          res.statusCode = 400;
          res.write("Bad Request! you have to pass a 'city' parameter");
        }
      } else {
        res.statusCode = 404;
        res.write("Not Found!");
      }
      res.end();
    } catch (err) {
      res.statusCode = 500;
      res.write(`Internal Server Error: ${err.message} \n`);
      res.end;
    }
  })
  .listen(5000);
