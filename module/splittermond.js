// Import Modules
import { SplittermondActor } from "./actor/actor.js";
import { SplittermondActorSheet } from "./actor/actor-sheet.js";
import { SplittermondItem } from "./item/item.js";
import { SplittermondItemSheet } from "./item/item-sheet.js";

import { schadenswurfNachProbe } from "./probe/probe.js";
import { importWaffen } from "./import/import.js";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  game.splittermond = {
    SplittermondActor,
    SplittermondItem,
    rollItemMacro
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };

  /**
   * Eigenes Dice template setzen.
   */
  CONFIG.Dice.template = "systems/splittermond/templates/dice/roll.html";

  // Define custom Entity classes
  CONFIG.Actor.entityClass = SplittermondActor;
  CONFIG.Item.entityClass = SplittermondItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("splittermond", SplittermondActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("splittermond", SplittermondItemSheet, { makeDefault: true });

  /**
  * Handlebar Helpers
  * If you need to add Handlebars helpers, here are a few useful examples:
  */

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

Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });

});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createBoilerplateMacro(data, slot));

  /***** IMPORT COMPENDIUM PACK */
  // importWaffen();

  // Individuelles Template für Compendium "Waffenliste"
  const waffenliste = game.packs.get('splittermond.waffen');
  // waffenliste.options.template = 'systems/splittermond/templates/apps/waffen1.html'
  waffenliste.options.resizable = true;
  waffenliste.options.width = 700;

});

/* -------------------------------------------- */
/*  RenderCompendium Hook                       */
/* -------------------------------------------- */

Hooks.on("renderCompendium", async (compendium, html, data) => {
  let items = await compendium.getContent();
  items.forEach(item => {
    let indexElement = data.index.find(indexElement => indexElement._id == item._id);
    let itemDD = item.data.data;
    lokalisiereWaffenDaten(itemDD);
    indexElement.data = itemDD;
  }, {});

  // Gruppiere Items
  let groups = {handgemenge: [], klingenwaffen: [], hiebwaffen: [], stangenwaffen: [], kettenwaffen: [], schusswaffen: [], wurfwaffen: []};
  let newData = duplicate(data);
  newData.index = newData.index.reduce((groups, indexElement) => {
    let itemDD = indexElement.data;
    let groupKey = itemDD.kampffertigkeit.key;
    groups[groupKey].push(indexElement);
    return groups;
  }, groups);

  // Replace the markup.
  html.find('.compendium').empty();
  let template = 'systems/splittermond/templates/apps/waffen.html';
  let content = await renderTemplate(template, newData);
  html.find('.compendium').append(content);

  // Handle folder toggles.
  html.find('.entry-group').on('click', event => {
    event.preventDefault();
    $(event.currentTarget).parent().next().toggleClass('hidden');
  })
  
  // Handle dragdrop.
  const dragDrop = new DragDrop(compendium.options.dragDrop[0]);
  dragDrop.bind(html[0]);
});

function lokalisiereWaffenDaten(dd) {

    // Localize Waffenmerkmale
    for (let [key, merkmal] of Object.entries(dd.merkmale)){
      let stufe = merkmal.stufe == 0 ? '' : ' ' + merkmal.stufe;
      merkmal.nameStufe = game.i18n.localize('SPLITTERMOND.Waffenmerkmal.' + merkmal.key) + stufe;
    }    

    /*
    dd.attribut1.abk = game.i18n.localize('SPLITTERMOND.Attribut.' + dd.attribut1.key + '.abk');
    dd.attribut2.abk = game.i18n.localize('SPLITTERMOND.Attribut.' + dd.attribut2.key + '.abk');

    if (dd.minAttribut1) {
      dd.minAttribut1.abk = game.i18n.localize('SPLITTERMOND.Attribut.' + dd.minAttribut1.key + '.abk');
    }

    if (dd.minAttribut2) {
      dd.minAttribut2.abk = game.i18n.localize('SPLITTERMOND.Attribut.' + dd.minAttribut2.key + '.abk');
    }

    dd.verfuegbarkeit.name = game.i18n.localize('SPLITTERMOND.Verfuegbarkeit.' + dd.verfuegbarkeit.normal);
    dd.komplexitaet.abk = game.i18n.localize('SPLITTERMOND.Komplexitaet.' + dd.komplexitaet.normal + '.abk');
    */
}

/* -------------------------------------------- */
/*  RenderChatMessage Hook                      */
/* -------------------------------------------- */

Hooks.on("renderChatMessage", (message, html, data) => {
  if ( message.isRoll && message.isContentVisible) {
    let options = message.roll.dice[0].options;
    let probe = options.probe;
    let schadenswurf = options.schadenswurf;
    if (probe) {
      if (probe.kritisch) {
        html.find(".dice-total").addClass(probe.kritisch);
      } else if (probe.differenz >= 0) {
        html.find(".dice-total").addClass('gelungen');
      }
      // TODO Button: Splitterpunkt einsetzen für 3 Punkte Bonus?
      // TODO Button: Wenn gegnerischer Angriff: Splitterpunkt einsetzen für 3 Punkte auf Widerstandswert?
      // TODO Button: Aktive Abwehr würfeln
      renderSchadenButton(html, probe);
      html.find(".ergebnis").text(probe.ergebnisText);
    } else if (schadenswurf) {
      html.find(".ergebnis").text(schadenswurf.ergebnisText);
    }
  }
});

function renderSchadenButton(html, probe) {
  if (probe.schaden && probe.differenz >= 0) {
    html.find(".dice-buttons").attr("hidden", false);
    html.find(".schaden").attr("hidden", false);
    html.on('click', '.schaden', onClickSchadenButton.bind(probe));
  }
}

function onClickSchadenButton() {
  schadenswurfNachProbe(this);
}

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createBoilerplateMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.splittermond.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "boilerplate.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}
