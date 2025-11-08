const chalk = require('chalk');
const app = require('./app'); // Imports the configured app
const config = require('./src/config/config');
const port = config.PORT;
const fig = require('./src/figlet'); // Assuming this is for your ASCII art startup message

app.listen(port, () => {
    console.log(chalk.blue(`SERVER RUNNING  ON PORT ${chalk.red(port)}`));
});