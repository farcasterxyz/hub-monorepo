const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = function clidocs() {
  const docFileName = "www/docs/docs/cli.md";

  try {
    // Step 1: Get the list of all options from the CLI
    const helpOutput = execSync("node --no-warnings build/cli.js start --help").toString();

    const optionNames = [];
    const regex = /--\w+(-\w+)*/g;
    let match;

    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    while ((match = regex.exec(helpOutput)) !== null) {
      optionNames.push(match[0]);
    }

    // Step 2: Read the contents of the cli.md file
    const cliDocPath = path.resolve(__dirname, "..", docFileName);
    const cliDocContent = fs.readFileSync(cliDocPath, "utf-8");

    // Step 3: Check that each option name appears in the cli.md file
    let anyError = false;
    optionNames.forEach((optionName) => {
      if (!cliDocContent.includes(optionName)) {
        console.warn(`Documentation for option "${optionName}" is missing in ${docFileName}`);
        anyError = true;
      }
    });

    if (anyError) {
      process.exit(1);
    } else {
      console.log("✨ CLI docs are up to date");
    }
  } catch (error) {
    console.error("Error executing command:", error);
    process.exit(1);
  }
};
