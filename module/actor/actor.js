import { checkValueRange } from "../utils.js";

const GROESSENKLASSEN = {
  Alb: 5,
  Gnom: 3,
  Mensch: 5,
  Varg: 6,
  Zwerg: 4
};

const FERTIGKEITEN = {
  akrobatik: {att1: 'bew', att2: 'sta'},
  alchemie: {att1: 'mys', att2: 'ver'},
  anfuehren: {att1: 'aus', att2: 'wil'},
  arkaneKunde: {att1: 'mys', att2: 'ver'},
  athletik: {att1: 'bew', att2: 'sta'},
  darbietung: {att1: 'aus', att2: 'wil'},
  diplomatie: {att1: 'aus', att2: 'ver'},
  edelhandwerk: {att1: 'int', att2: 'ver'},
  empathie: {att1: 'int', att2: 'ver'},
  entschlossenheit: {att1: 'aus', att2: 'wil'},
  fingerfertigkeit: {att1: 'aus', att2: 'bew'},
  geschichteUndMythen: {att1: 'mys', att2: 'ver'},
  handwerk: {att1: 'kon', att2: 'ver'},
  heilkunde: {att1: 'int', att2: 'ver'},
  heimlichkeit: {att1: 'bew', att2: 'int'},
  jagdkunst: {att1: 'kon', att2: 'ver'},
  laenderkunde: {att1: 'int', att2: 'ver'},
  naturkunde: {att1: 'int', att2: 'ver'},
  redegewandtheit: {att1: 'aus', att2: 'wil'},
  schloesserUndFallen: {att1: 'int', att2: 'bew'},
  schwimmen: {att1: 'sta', att2: 'kon'},
  seefahrt: {att1: 'bew', att2: 'kon'},
  strassenkunde: {att1: 'aus', att2: 'int'},
  tierfuehrung: {att1: 'aus', att2: 'bew'},
  ueberleben: {att1: 'int', att2: 'kon'},
  wahrnehmung: {att1: 'int', att2: 'wil'},
  zaehigkeit: {att1: 'kon', att2: 'wil'}
}

function groessenklasseModifikatoren(gk) {
  var mod = {};
    mod.vtd = (5 - gk) * 2;
    mod.heimlichkeit = 5 - gk;
  return mod; 
}

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class SplittermondActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    // Make modifications to data here. For example:

    // Loop through ability scores, and add their modifiers to our sheet output.
    /*
    for (let [key, ability] of Object.entries(data.abilities)) {
      // Calculate the modifier using d20 rules.
      ability.mod = Math.floor((ability.value - 10) / 2);
    }
    */

    // Heldengrad checken (TODO: Ist nur temporär ein Eingabefeld, soll berechnet werden aus EP)
    data.hg = checkValueRange(data.hg, 1, 4);

    // Attribut-Werte berechnen.
    const attribute = data.attribute;
    for (let [key, attribut] of Object.entries(attribute)) {
      attribut.start = checkValueRange(attribut.start, 0, 5);
      attribut.mod = checkValueRange(attribut.mod, 0, data.hg);
      attribut.wert = attribut.start + attribut.mod;
    }
  
    // Abgeleitete Werte berechnen
    const awerte = data.abgeleiteteWerte;
    awerte.gk.wert = GROESSENKLASSEN[data.rasse] + awerte.gk.mod + awerte.gk.temp;
    awerte.gsw.wert = awerte.gk.wert + attribute.bew.wert + awerte.gsw.mod + awerte.gsw.temp;
    awerte.ini.wert = 10 - attribute.int.wert + awerte.ini.mod + awerte.ini.temp;
    awerte.lp.wert = awerte.gk.wert + attribute.kon.wert + awerte.lp.mod + awerte.lp.temp;
    awerte.fo.wert = 2 * (attribute.mys.wert + attribute.wil.wert) + awerte.fo.mod + awerte.fo.temp;
    awerte.vtd.wert = 12 + attribute.bew.wert + attribute.sta.wert + groessenklasseModifikatoren(awerte.gk.wert).vtd + awerte.vtd.mod + awerte.vtd.temp;
    awerte.gw.wert = 12 + attribute.ver.wert + attribute.wil.wert + awerte.gw.mod + awerte.gw.temp;
    awerte.kw.wert = 12 + attribute.kon.wert + attribute.wil.wert + awerte.kw.mod + awerte.kw.temp;

    // Fertigkeiten berechnen
    const fertigkeiten = data.fertigkeiten;
    for (let [key, fertigkeit] of Object.entries(fertigkeiten)) {
      const att1key = FERTIGKEITEN[key].att1;
      const att2key = FERTIGKEITEN[key].att2;
      fertigkeit.att1 = {key: att1key, value: attribute[att1key].wert};
      fertigkeit.att2 = {key: att2key, value: attribute[att2key].wert};
      fertigkeit.punkte = checkValueRange(fertigkeit.punkte, 0, data.hg * 3 + 3);
      fertigkeit.wert = fertigkeit.punkte + fertigkeit.att1.value + fertigkeit.att2.value + fertigkeit.mod;
    }

    // Kampffertigkeiten checken
    const kampffertigkeiten = data.kampffertigkeiten;
    for (let [key, kampffertigkeit] of Object.entries(kampffertigkeiten)) {
      kampffertigkeit.punkte = checkValueRange(kampffertigkeit.punkte, 0, data.hg * 3 + 3);
    }

    this.prepareEmbeddedEntities(); // TODO Alle Items des Actors neu erzeugen. Möglicherweise unperformant?
    
  }

}
