import { RASSEN } from "../const.js";
import { FERTIGKEITEN } from "../const.js";
import { NAHKAMPFFERTIGKEITEN } from "../const.js";
import { MAGIESCHULEN } from "../const.js";
import { checkValueRange } from "../utils.js";

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class SplittermondActor extends Actor {

  constructor(...args) {
    super(...args);
  }
  
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
    const actorDD = actorData.data;

    // Rasse
    const rasse = actorDD.rasse;

    // Heldengrad checken (TODO: Ist nur temporär ein Eingabefeld, soll berechnet werden aus EP)
    actorDD.hg = checkValueRange(actorDD.hg, 1, 4);
    const hg = actorDD.hg;
    const maxFP = hg * 3 + 3; // (siehe GRW 88 links)
    const widerstandsbonus = (hg - 1) * 2; // (siehe GRW 89 links oben)

    // Attribute berechnen
    const attribute = actorDD.attribute;
    for (let [key, attribut] of Object.entries(attribute)) {
      attribut.start = checkValueRange(attribut.start, 0, 5);
      attribut.mod = checkValueRange(attribut.mod, 0, hg);
      attribut.wert = attribut.start + attribut.mod;
    }

    // TODO Sind mod- und/oder temp-Werte keine Eingabefelder, sondern werden alle berechnet??

    // Abgeleitete Werte berechnen
    const awerte = actorDD.abgeleiteteWerte;
    awerte.gk.wert = RASSEN[rasse].gk + awerte.gk.mod;
    awerte.gsw.wert = awerte.gk.wert + attribute.bew.wert + awerte.gsw.mod;
    awerte.ini.wert = 10 - attribute.int.wert + awerte.ini.mod;
    awerte.lp.wert = awerte.gk.wert + attribute.kon.wert + awerte.lp.mod;
    awerte.fo.wert = 2 * (attribute.mys.wert + attribute.wil.wert) + awerte.fo.mod;
    awerte.vtd.wert = 12 + attribute.bew.wert + attribute.sta.wert + vtd_mod(awerte.gk.wert) + awerte.vtd.mod + widerstandsbonus;
    awerte.gw.wert = 12 + attribute.ver.wert + attribute.wil.wert + awerte.gw.mod + widerstandsbonus;
    awerte.kw.wert = 12 + attribute.kon.wert + attribute.wil.wert + awerte.kw.mod + widerstandsbonus;

    // Fertigkeiten berechnen
    const fertigkeiten = actorDD.fertigkeiten;
    for (let [key, fertigkeit] of Object.entries(fertigkeiten)) {
      const att1_key = FERTIGKEITEN[key].att1;
      const att2_key = FERTIGKEITEN[key].att2;
      fertigkeit.att1 = {key: att1_key, wert: attribute[att1_key].wert};
      fertigkeit.att2 = {key: att2_key, wert: attribute[att2_key].wert};
      fertigkeit.fp = checkValueRange(fertigkeit.fp, 0, maxFP);
      fertigkeit.wert = fertigkeit.fp + fertigkeit.att1.wert + fertigkeit.att2.wert + fertigkeit.mod;
    }

    // Kampffertigkeiten checken
    const kampffertigkeiten = actorDD.kampffertigkeiten;
    for (let [key, kampffertigkeit] of Object.entries(kampffertigkeiten)) {
      kampffertigkeit.fp = checkValueRange(kampffertigkeit.fp, 0, maxFP);
    }

    // Magieschulen berechnen
    const magieschulen = actorDD.magieschulen;
    for (let [key, magieschule] of Object.entries(magieschulen)) {
      const att1_key = 'mys';
      const att2_key = MAGIESCHULEN[key].att2;
      magieschule.att1 = {key: att1_key, wert: attribute[att1_key].wert};
      magieschule.att2 = {key: att2_key, wert: attribute[att2_key].wert};
      magieschule.fp = checkValueRange(magieschule.fp, 0, maxFP);
      magieschule.wert = magieschule.fp + magieschule.att1.wert + magieschule.att2.wert + magieschule.mod;
    }

    // Alle Items des Actors neu erzeugen
    this.prepareEmbeddedEntities(); // TODO Möglicherweise unperformant?
    
    // Rüstungssumme berechnen
    actorDD.vtdPlus = 0;
    actorDD.sr = 0;
    actorDD.behinderung = 0;
    actorDD.tickzuschlag = 0;
    let ruestungen = actorData.items.filter(item => item.data.ausgeruestet && (item.type == 'ruestung' || item.type == 'schild'));
    ruestungen.forEach(item => {
      actorDD.vtdPlus += item.data.vtdPlus;
      if (item.data.sr) { // Schilde haben keine SR
        actorDD.sr += item.data.sr.wert;
      }
      actorDD.behinderung += item.data.behinderung.wert;
      actorDD.tickzuschlag += item.data.tickzuschlag.wert;
    });

    // VTD korrigieren wegen getragener Rüstung
    awerte.vtd.temp = actorDD.vtdPlus;
    awerte.vtd.wert += awerte.vtd.temp;

    // GSW korrigieren wegen getragener Rüstung
    awerte.gsw.temp = -Math.floor(actorDD.behinderung/2);
    awerte.gsw.wert += awerte.gsw.temp;

  }

  // Wird für Aktive Abwehr benötigt
  nahkampfItems() {
    return this.data.items.filter(item => item.data.ausgeruestet && (item.type == 'waffe' || item.type == 'schild') && NAHKAMPFFERTIGKEITEN.includes(item.data.kampffertigkeit.key));
  }

}

/****** HILFSFUNKTIONEN ******/

function vtd_mod(gk) {
  return (5 - gk) * 2;
}

function heimlichkeit_mod(gk) {
  return 5 - gk;
}
