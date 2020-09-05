function preloadHandlebarsTemplates() {
  const templatePaths = [
    "systems/splittermond/templates/actor/tab/grundwerte.html",
    "systems/splittermond/templates/actor/tab/fertigkeiten.html",
    "systems/splittermond/templates/actor/tab/kampf.html",
    "systems/splittermond/templates/actor/tab/zauber.html"
  ];
  return loadTemplates(templatePaths);
}

function registerHandlebarsHelpers() {

  Handlebars.registerHelper('preisFormat', function (value) {
    let telare = parseInt(value);
    if (telare == 0) {
      return '-'
    }
    let lunare = Math.floor(telare/100);
    telare = telare % 100;
    let solare = Math.floor(lunare/100);
    lunare = lunare % 100;

    solare = solare !== 0 ? (solare + ' S ') : '';
    lunare = lunare !== 0 ? (lunare + ' L ') : '';
    telare = telare !== 0 ? (telare + ' T ') : '';
    return solare + lunare + telare;
  });

  Handlebars.registerHelper('active', function(value) {
    return value ? '' : 'inactive';
  });

  Handlebars.registerHelper('zeroIsEmpty', function(value) {
    return value ? value : '';
  });

  Handlebars.registerHelper('zeroIsDash', function(value) {
    return value ? value : '-';
  });

  Handlebars.registerHelper('smLocalize', function(value) {
    return game.i18n.localize('SPLITTERMOND.' + value);
  });

  Handlebars.registerHelper('smLocalize1', function(prefix, key) {
    return game.i18n.localize('SPLITTERMOND.' + prefix + '.' + key);
  });

  Handlebars.registerHelper('smLocalize2', function(prefix, key, postfix) {
    return game.i18n.localize('SPLITTERMOND.' + prefix + '.' + key + '.' + postfix);
  });

  // TODO unbenutzt?
  Handlebars.registerHelper('concat', function() {
      var outStr = '';
      for (var arg in arguments) {
        if (typeof arguments[arg] != 'object') {
          outStr += arguments[arg];
        }
      }
      return outStr;
    });

  // TODO unbenutzt?
  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });

}

export const initializeHandlebars = () => {
  registerHandlebarsHelpers();
  preloadHandlebarsTemplates();
};
