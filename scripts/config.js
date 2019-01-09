const inquirer = require('inquirer');
const fs = require('fs');
const readline = require('readline');
const chalk = require('chalk');

const mandatoryVariables = [
  {
    type: 'input',
    name: 'REACT_APP_SHARETRIBE_SDK_CLIENT_ID',
    message: `What is your Flex client id?`,
  },
  {
    type: 'input',
    name: 'REACT_APP_STRIPE_PUBLISHABLE_KEY',
    message: `What is your Stripe publishable key?`,
  },
  {
    type: 'input',
    name: 'REACT_APP_MAPBOX_ACCESS_TOKEN',
    message: `What is your Mapbox access token?`,
  },
];

const defaultVariables = [
  {
    type: 'input',
    name: 'REACT_APP_SHARETRIBE_MARKETPLACE_CURRENCY',
    message: `What is your marketplace currency?`,
    default: function() {
      return 'USD';
    },
  },
  {
    type: 'input',
    name: 'REACT_APP_CANONICAL_ROOT_URL',
    message: `Canonical root url if used e.g. for SEO`,
    default: function() {
      return 'http://localhost:3000';
    },
  },
  {
    type: 'input',
    name: 'REACT_APP_AVAILABILITY_ENABLED',
    message: `Enable avalability`,
    default: function() {
      return 'true';
    },
  },
  {
    type: 'input',
    name: 'REACT_APP_DEFAULT_SEARCHES_ENABLED',
    message: `Enable default searches`,
    default: function() {
      return 'true';
    },
  },
];

const updateEnvFile = data => {
  // Empty the existing .env file so appending lines will not add duplicates.
  fs.writeFileSync('./.env', '');

  let content = '';
  data.map(line => {
    content = content + line;
    fs.appendFileSync('./.env', line.toString());
  });
};

const checkIfSameLine = (answers, line) => {
  let foundKey;
  if (answers) {
    Object.keys(answers).map(key => {
      if (line.includes(key)) {
        foundKey = key;
      }
    });
  }
  return foundKey;
};

const readLines = answers => {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: require('fs').createReadStream('./.env'),
    });

    // Read all lines from existing .env file to array. If line matches one of the keys in user's answers update add value to that line. Otherwise keep the original line.
    const data = [];
    rl.on('line', function(line) {
      const key = checkIfSameLine(answers, line);
      if (key) {
        data.push(`${key}=${answers[key]}\n`);
      } else {
        data.push(`${line}\n`);
      }
    });

    rl.on('close', () => {
      resolve(data);
    });
  });
};

// Create new .env file using .env-template
const createEnvFile = () => {
  fs.copyFileSync('./.env-template', './.env', err => {
    if (err) throw err;
  });
};

const run = () => {
  if (process.argv[2] && process.argv[2] === '--check') {
    if (!fs.existsSync(`./.env`)) {
      process.on('exit', code => {
        console.log(
          `Required environment variables are missing. These need to be set before starting the app. You can create the .env file and set the variables by running ${chalk.cyan(
            'yarn run config'
          )}`
        );
      });

      process.exit(1);
    }
  } else if (fs.existsSync(`./.env`)) {
    console.log(
      `.env file already exists. You can edit the variables directly in that file. Remember to restart the application after editing the environment variables!`
    );
  } else {
    console.log(`
You don't have .env file yet. With this tool you can configure required enviroment variables and create .env file automatically.
      
      `);

    createEnvFile();

    console.log(chalk.bold('Mandatory variables'));
    inquirer
      .prompt(mandatoryVariables)
      .then(answers => {
        return readLines(answers);
      })
      .then(data => {
        updateEnvFile(data);

        console.log(chalk.bold('Default variables'));
        inquirer
          .prompt(defaultVariables)
          .then(answers => {
            return readLines(answers);
          })
          .then(data => {
            updateEnvFile(data);
            console.log(`
.env file was created succesfully! 

Note that the .env file is a hidden file so it might not be visible directly in directory listing. If you want to update the environment variables you need to edit the file. Remember to restart the application after editing the environment variables! 

Start the Flex template application by running ${chalk.cyan('yarn run dev')}
            `);
          });
      })
      .catch(err => {
        console.log(chalk.red(`An error occurred due to: ${err.message}`));
      });
  }
};

run();
