function preloadPartialsTemplates() {
  const templatePaths = [
    "systems/splittermond/templates/actor/tab/grundwerte.html",
    "systems/splittermond/templates/actor/tab/fertigkeiten.html",
    "systems/splittermond/templates/actor/tab/kampf.html",
    "systems/splittermond/templates/actor/tab/zauber.html"
  ];
  return loadTemplates(templatePaths);
}

function registerHandlebarsHelpers() {

  /*** Lokalisierung  ***/

  Handlebars.registerHelper('label', function(value) {
    return game.i18n.localize('SPLITTERMOND.Label.' + value);
  });

  Handlebars.registerHelper('loc', function(value) {
    return game.i18n.localize('SPLITTERMOND.' + value);
  });

  Handlebars.registerHelper('loc1', function(prefix, key) {
    return game.i18n.localize('SPLITTERMOND.' + prefix + '.' + key);
  });

  Handlebars.registerHelper('loc2', function(prefix, key, postfix) {
    return game.i18n.localize('SPLITTERMOND.' + prefix + '.' + key + '.' + postfix);
  });

  Handlebars.registerHelper('waffenmerkmal', function(merkmal) {
    let stufe = merkmal.stufe === undefined ? '' : ' ' + merkmal.stufe;
    return game.i18n.localize('SPLITTERMOND.Waffenmerkmal.' + merkmal.key) + stufe;
  });

  /*** Formatierung ***/

  Handlebars.registerHelper('zeroIsEmpty', function(value) {
    return value ? value : '';
  });

  Handlebars.registerHelper('zeroIsDash', function(value) {
    return value ? value : '-';
  });

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

  /*** CSS ***/

  Handlebars.registerHelper('active', function(value) {
    return value ? '' : 'inactive';
  });

  /*** Sonstiges ***/

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
  preloadPartialsTemplates();
};
