// Import Modules
import { SplittermondActor } from "./actor/actor.js";
import { SplittermondActorSheet } from "./actor/actor-sheet.js";
import { SplittermondItem } from "./item/item.js";
import { SplittermondItemSheet } from "./item/item-sheet.js";

import { importAusruestung } from "./import/import.js";
import { importMeisterschaften } from "./import/import.js";
import { renderAusruestungCompendium } from "./compendium.js";
import { renderMeisterschaftenCompendium } from "./compendium.js";
import { initializeHandlebars } from "./handlebars.js";
import { createProbenkontext } from "./probe.js";

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

  // Handlebars are registered in handlebars.js
  initializeHandlebars();

});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createBoilerplateMacro(data, slot));

  /***** IMPORT COMPENDIUM PACK */
  // importAusruestung();
  // importMeisterschaften();

  // Individuelle Einstellungen für Compendium "Ausrüstung"
  const ausruestung = game.packs.get('splittermond.ausruestung');
  ausruestung.options.resizable = true;
  // TODO Größenangaben funktionieren noch nicht
  ausruestung.options.width = 1280;
  ausruestung.options.height = 1000;

  // Individuelle Einstellungen für Compendium "Ausrüstung"
  const meisterschaften = game.packs.get('splittermond.meisterschaften');
  meisterschaften.options.resizable = true;
  meisterschaften.options.width = 1280;
  meisterschaften.options.height = 1000;
});

/* -------------------------------------------- */
/*  RenderCompendium Hook                       */
/* -------------------------------------------- */

Hooks.on("renderCompendium", async (compendium, html, data) => {

  if (data.collection == 'splittermond.ausruestung') {
    renderAusruestungCompendium(compendium, html, data);
  } else if (data.collection == 'splittermond.meisterschaften') {
    renderMeisterschaftenCompendium(compendium, html, data);
  }

});

/* -------------------------------------------- */
/*  RenderChatMessage Hook                      */
/* -------------------------------------------- */

/*
Hooks.on('createChatMessage', (data, options, id) => {
  console.log('>>>>> createChatMessage');
  // Holen der Probenkontext data aus den options.
  if (options.kontext) {
    data.data.kontext = options.kontext;
  }
});
*/

Hooks.on("renderChatMessage", (message, html, data) => {
  console.log('>>>>> renderChatMessage');
  if ( message.isRoll && message.isContentVisible) {
    const wurfart = message.getFlag('splittermond', 'wurfart');
    const kontextData = message.getFlag('splittermond', 'kontext');
    if (kontextData) {
        // Wiederbeleben der Probenkontext-Instanz.
        const probenkontext = createProbenkontext(kontextData, message);
        probenkontext.renderChatMessage(html, wurfart);
    }
  }
});

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
