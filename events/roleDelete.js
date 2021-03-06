const fileOps = require('../util/fileOps.js')

function isEmptyObject(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
    return JSON.stringify(obj) === JSON.stringify({});
}

module.exports = function (bot, role) {

  try {var guildRss = require(`../sources/${role.guild.id}.json`)} catch (e) {return}
  var rssList = guildRss.sources
  var found = false

  //delete from global role subscriptions if exists
  for (var rssName in rssList) {
    let source = rssList[rssName]
    if (source.roleSubscriptions) {
      var globalSubList = source.roleSubscriptions;
      for (var globalSub in globalSubList) {
        if (globalSubList[globalSub].roleID == role.id) {
          globalSubList.splice(globalSub, 1);
          found = true;
        }
      }
    }

    //delete from filtered role subscriptions if exists
    if (source.filters && source.filters.roleSubscriptions && source.filters.roleSubscriptions[role.id]) {
      delete source.filters.roleSubscriptions[role.id];
      found = true;
    }
    if (source.filters && isEmptyObject(source.filters.roleSubscriptions)) delete source.filters.roleSubscriptions;

    //cleanup
    if (source.filters && isEmptyObject(source.filters)) delete source.filters;
    if (source.roleSubscriptions && source.roleSubscriptions.length === 0) delete source.roleSubscriptions;
  }

  if (found) {
    console.log(`Guild Info: (${role.guild.id}, ${role.guild.name}) => Role (${role.id}, ${role.name}) has been deleted. Removing.`);
    return fileOps.updateFile(role.guild.id, guildRss, `../sources/${role.guild.id}.json`);
  }

}
