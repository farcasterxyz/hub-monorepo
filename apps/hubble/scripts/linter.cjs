/**
 * This is a custom linter that checks for the presence of a "datasource" property
 * in the Grafana dashboard JSON file. If the property is present, it must be set
 * to "Graphite". This is to ensure that the dashboard is not using any other
 * datasource.
 *
 * It runs as a part of "yarn lint"
 */

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../grafana/grafana-dashboard.json");

function checkDataSource(obj) {
  // If the object is an array, iterate over its elements
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (!checkDataSource(item)) {
        return false;
      }
    }
  }
  // If the object is an actual object, check for the "datasource" property
  else if (typeof obj === "object" && obj !== null) {
    if (obj.datasource && obj.datasource !== "Graphite") {
      console.error(`The "datasource" property HAS TO BE  "Graphite" but it is "${JSON.stringify(obj.datasource)}"`);
      return false;
    }

    // Recursively check other properties
    for (const key in obj) {
      if (!checkDataSource(obj[key])) {
        return false;
      }
    }
  }

  return true;
}

fs.readFile(filePath, "utf-8", (err, data) => {
  if (err) {
    console.error(`Error reading ${filePath}:`, err);
    process.exit(1);
  }

  const jsonData = JSON.parse(data);

  if (!checkDataSource(jsonData)) {
    console.error(`Error: ${filePath} contains a "datasource" that is not "Graphite"`);
    process.exit(1);
  } else {
    console.log("✨ Custom linter passed");
  }
});
