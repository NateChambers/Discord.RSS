const Discord = require('discord.js')
const startInit = require('./util/initFeeds.js')
const config = require('./config.json')
const fetchInterval = require('./util/fetchInterval.js')
const startFeedSchedule = require('./util/startFeedSchedule.js')
if (config.logging.logDates) require('./util/logDates.js')();

if (!config.botSettings.token) throw 'Warning! Vital config missing: token undefined in config.';
else if (!config.botSettings.prefix) throw 'Warning! Vital config missing: prefix undefined in config';
else if (!config.feedManagement.databaseName) throw 'Warning! Vital config missing: databaseName undefined in config.';
else if (!config.feedManagement.sqlType || typeof config.feedManagement.sqlType !== 'string' || (config.feedManagement.sqlType !== 'mysql' && config.feedManagement !== 'sqlite3')) throw 'Warning! Vital config missing: sqlType incorrectly defined in config.';
else if (!config.feedSettings.defaultMessage) throw 'Warning! Vital config missing: defaultMssage undefined in config.';

Object.defineProperty(Object.prototype, 'size', {
    value: function() {
      let c = 0
      for (var x in this) if (this.hasOwnProperty(x)) c++;
      return c
    },
    enumerable: false,
    writable: true
})

fetchInterval.changedGuilds = {}
var initialized = false
var bot

function beginFeedCycle (deleteCache) {
  if (deleteCache) delete require.cache[require.resolve(`./util/startFeedSchedule.js`)];
  require('./util/startFeedSchedule.js')(bot)
}

function startCmdServer () {
  initialized = true
  const cmdServer = require('child_process').fork('./cmdServer.js', {env: {isCmdServer: true} })

  cmdServer.on('message', function (guildFile) {
    if (guildFile === 'kill') process.exit();
    fetchInterval.changedGuilds[guildFile.id] = guildFile.contents
    if (fetchInterval.cycleInProgress) return;
    try {
      delete require.cache[require.resolve(`../sources/${guildId}.json`)]
      console.log('RSS Module deleted cache for profile of guild ID: ' + guildId)
      delete fetchInterval.changedGuilds[guildId]
    } catch (e) {}
  })

  process.on('uncaughtException', function (err) {
    console.log(`Fatal Error for RSS Module! Stopping bot, printing error:\n\n`, err.stack)
    cmdServer.send('kill')
    process.exit(1)
  })
  beginFeedCycle()
}

(function login () {
  bot = new Discord.Client()
  bot.login(config.botSettings.token)
  .catch(err => {
    console.log(`Discord.RSS RSS module could not login, retrying...`)
    setTimeout(login, 1000)
  })
  bot.once('ready', function() {
    console.log('Discord.RSS RSS Module has started.');
    if (!initialized) startInit(bot, startCmdServer);
    else beginFeedCycle(true);
  })
  bot.once('disconnect', function (e) {
    console.log('Error: RSS Module Disconnected from Discord. Attempting to reconnect and restart feed cycle.')
    var timer = setInterval(function () {
      if (fetchInterval.cycleInProgress) return console.log('Feed retrieval cycle currently in progress. Waiting until cycle ends to reconnect.');
      fetchInterval.stopSchedule()
      clearInterval(timer)
      login()
    }, 10000)
  })
})()

process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Rejection at: Promise', promise, 'reason:', err)
})
