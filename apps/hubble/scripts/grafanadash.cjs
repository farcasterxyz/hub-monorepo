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

module.exports = function grafana() {
  const filePath = path.join(__dirname, "../grafana/grafana-dashboard.json");

  function checkDataSource(lineArray) {
    let lineNumber = 0;

    for (const line of lineArray) {
      lineNumber++;

      // Check if the current line contains the undesired datasource entry
      if (line.includes('"datasource":') && !line.replace(/ /g, "").includes('"datasource":"Graphite"')) {
        return lineNumber;
      }
    }

    return null;
  }

  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        console.error(`Error reading ${filePath}:`, err);
        process.exit(1);
      }

      // Split the content into lines
      const lineArray = data.split("\n");
      const errorLine = checkDataSource(lineArray);

      if (errorLine !== null) {
        console.error(`line ${errorLine}: ${lineArray[errorLine - 1]}`);
        console.error(`Error: "datasource" has to be "Graphite"`);
        console.error(`Replace with: "datasource": "Graphite"`);
        console.error(`Error: ${filePath}`);

        process.exit(1);
      } else {
        console.log("✨ Grafana Dashboard linter passed");
        resolve();
      }
    });
  });
};
