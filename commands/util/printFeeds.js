const Discord = require('discord.js')
const config = require('../../config.json')
const commandList = require('../../util/commandList.json')
const channelTracker = require('../../util/channelTracker.js')

module.exports = function(bot, message, command, callback) {
  var rssList = {}
  try {rssList = require(`../../sources/${message.guild.id}.json`).sources} catch(e) {}
  if (rssList.size() === 0) return message.channel.sendMessage('There are no existing feeds.').catch(err => console.log(`Promise Warning: printFeeds 2: ${err}`));

  function isCurrentChannel(channel) {
    if (isNaN(parseInt(channel,10))) return message.channel.name == channel;
    else return message.channel.id == channel;
  }

  var maxFeedsAllowed = (!config.feedSettings.maxFeeds || isNaN(parseInt(config.feedSettings.maxFeeds))) ? 'Unlimited' : (config.feedSettings.maxFeeds == 0) ? 'Unlimited' : config.feedSettings.maxFeeds
  var embedMsg = new Discord.RichEmbed().setColor(config.botSettings.menuColor)

  var currentRSSList = []
  for (var rssName in rssList) {
    if (isCurrentChannel(rssList[rssName].channel)) currentRSSList.push( [rssList[rssName].link, rssName, rssList[rssName].title] );
  }


  if (currentRSSList.length === 0) return message.channel.sendMessage('No feeds assigned to this channel.').catch(err => console.log(`Promise Warning: printFeeds 1: ${err}`));

  for (var x in currentRSSList) {
    let count = parseInt(x,10) + 1;
    let link = currentRSSList[x][0];
    let title =  currentRSSList[x][2];
    let channelName = currentRSSList[x][3];

    embedMsg.addField(`${count})  ${title}`, `Link: ${link}`);
  }

    var error = false;
    embedMsg.setAuthor('Feed Selection Menu');
    embedMsg.setDescription(`**Server Limit:** ${rssList.size()}/${maxFeedsAllowed}\n**Channel:** #${message.channel.name}\n**Action**: ${commandList[command].action}\n\nChoose a feed to from this channel by typing the number to execute your requested action on. Type **exit** to cancel.\n_____`);
    message.channel.sendEmbed(embedMsg)
    .catch(err => {
      error = true;
      message.channel.sendMessage(`An error has occured an could not send the feed selection list. This is currently an issue that has yet to be resolved - you can try readding the feed/bot, or if it persists please ask me to come into your server and debug.`).catch(err => console.log(`Promise Warning: printFeeds 3: ${err}`));
      console.log(`Message Error: (${message.guild.id}, ${message.guild.name}) => Could not send message of embed feed selection list. Reason: ${err.response.body.message}, embed is: `, embedMsg)
    });

  if (error) return console.log('print feeds returning due to error');

  const filter = m => m.author.id == message.author.id
  const collector = message.channel.createCollector(filter,{time:60000})
  channelTracker.addCollector(message.channel.id)

  collector.on('message', function (m) {
    let chosenOption = m.content
    if (chosenOption.toLowerCase() === 'exit') return collector.stop('RSS Feed selection menu closed.');
    let index = parseInt(chosenOption, 10) - 1

    if (isNaN(index) || chosenOption > currentRSSList.length || chosenOption < 1) return message.channel.sendMessage('That is not a valid number.').catch(err => console.log(`Promise Warning: printFeeds 4: ${err}`));

    collector.stop()
    callback(currentRSSList[index][1])

  })
  collector.on('end', (collected, reason) => {
    channelTracker.removeCollector(message.channel.id)
    if (reason === 'time') return message.channel.sendMessage(`I have closed the menu due to inactivity.`);
    else if (reason !== 'user') return message.channel.sendMessage(reason);
  })

}
