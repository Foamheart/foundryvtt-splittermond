// Import Modules
import { SplittermondActor } from "./actor/actor.js";
import { SplittermondActorSheet } from "./actor/actor-sheet.js";
import { SplittermondItem } from "./item/item.js";
import { SplittermondItemSheet } from "./item/item-sheet.js";

import { importAusruestung } from "./import/import.js";
import { renderCompendium } from "./compendium.js";
import { initializeHandlebars } from "./handlebars.js";
import { schadenswurfNachProbe } from "./probe/probe.js";

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

  // Individuelles Template für Compendium "Ausrüstung"
  const ausruestung = game.packs.get('splittermond.ausruestung');
  ausruestung.options.resizable = true;
  ausruestung.options.width = 1280;
  ausruestung.options.height = 1000;

});

/* -------------------------------------------- */
/*  RenderCompendium Hook                       */
/* -------------------------------------------- */

Hooks.on("renderCompendium", async (compendium, html, data) => {
  renderCompendium(compendium, html, data);
});

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
