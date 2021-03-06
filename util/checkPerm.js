module.exports = function (bot, message, permission) {
  let channel = message.channel
  let guild = bot.guilds.get(channel.guild.id)
  let guildBot = guild.members.get(bot.user.id)
  if (guildBot.permissionsIn(channel).hasPermission('SEND_MESSAGES')) return true;

  if (permission === 'SEND_MESSAGES') {
    channel.sendMessage('An uncaught guild permission error has been found. If you can please, report by screenshotting the current permissions of the bot. I am currently trying to fix thus, but in the meantime try recreating the bot\'s role if it exists, or specifically adding the bot\'s name to permissions.')
    .then(m => console.log('Error: message actually sent.'))
    .catch(err => console.log('Successful block'));

    console.log(`Guild Permissions Error: (${guild.id}, ${guild.name}) => Cannot execute '${message.content}' due to missing send message permission in channel (${channel.id}, ${channel.name})`);
  }
  else if (permission === 'MANAGE_ROLES_OR_PERMISSIONS') console.log(`Self Subscriptions: (${channel.guild.id}, ${channel.guild.nane}) => SS disabled due to missing permission.`);

  return false
}
