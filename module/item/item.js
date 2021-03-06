import { NAHKAMPFFERTIGKEITEN } from "../const.js";
import { VERFUEGBARKEIT } from "../const.js";
import { PREIS_AUFSCHLAG } from "../const.js";
import { KOMPLEXITAET } from "../const.js";
import { checkValueRange } from "../utils.js";
import { modifikatorString } from "../utils.js";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class SplittermondItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};

    // Make separate methods for each Item type (waffe, ruestung, etc.) to keep
    // things organized.
    if (itemData.type === 'waffe') this._prepareWaffeData(itemData, actorData);
    if (itemData.type === 'ruestung') this._prepareRuestungData(itemData, actorData);
    if (itemData.type === 'schild') this._prepareSchildData(itemData, actorData);
    if (itemData.type === 'meisterschaft') this._prepareMeisterschaftData(itemData, actorData);
  }

  /**
   * Prepare Waffe type specific data
   */
  _prepareWaffeData(itemData, actorData) {
    const itemDD = itemData.data;
    const actorDD = actorData.data;

    // Verbesserungen und Qualität der Waffe (siehe GRW 142)

    // Negative Qualität?
    const qpos = !itemDD.negativeQualitaet;

    // Fertigkeitswert berechnen
    itemDD.kampffertigkeit.mod = qpos ? checkValueRange(itemDD.kampffertigkeit.mod, 0, 3) : checkValueRange(itemDD.kampffertigkeit.mod, -3, 0);
    if (actorDD) {
      const kampffertigkeit = itemDD.kampffertigkeit.key;
      const fp = actorDD.kampffertigkeiten[kampffertigkeit].fp;
      const attribut1 = actorDD.attribute[itemDD.attribut1.key];
      const attribut2 = actorDD.attribute[itemDD.attribut2.key];
      itemDD.attribut1.wert = attribut1.wert;
      itemDD.attribut2.wert = attribut2.wert;
      itemDD.minAttributAbzug = mindestAttributAbzugBerechnen(itemDD, actorDD);
      itemDD.kampffertigkeit.wert = fp + itemDD.attribut1.wert + itemDD.attribut2.wert + itemDD.kampffertigkeit.mod - itemDD.minAttributAbzug;
      itemDD.kampffertigkeit.fp = fp;
    } else {
      itemDD.kampffertigkeit.wert = '???';
    }
    
    // Schaden berechnen
    itemDD.schaden.mod = qpos ? checkValueRange(itemDD.schaden.mod, 0, 2) : checkValueRange(itemDD.schaden.mod, -2, 0);
    itemDD.schaden.wert = modifiziereSchadenswurf(itemDD.schaden.normal, itemDD.schaden.mod);

    // WGS berechnen
    itemDD.wgs.mod = qpos ? checkValueRange(itemDD.wgs.mod, -1, 0) : checkValueRange(itemDD.wgs.mod, 0, 1);
    itemDD.wgs.wert = itemDD.wgs.normal + itemDD.wgs.mod + (itemDD.minAttributAbzug ? itemDD.minAttributAbzug : 0);

    // Qualität berechnen (siehe GRW 142 unten)
    const qfunction = (itemDD) => itemDD.kampffertigkeit.mod * 2 + itemDD.schaden.mod - itemDD.wgs.mod * 2 - itemDD.last.mod + itemDD.haerte.mod;
    allgemeineAusruestungswerteBerechnen(itemDD, qpos, qfunction);
  }

  /**
   * Prepare Rüstung type specific data
   */
  _prepareRuestungData(itemData, actorData) {
    const itemDD = itemData.data;
    const actorDD = actorData.data;

    // Verbesserungen und Qualität der Waffe (siehe GRW 142)

    // Negative Qualität?
    const qpos = !itemDD.negativeQualitaet;

    if (actorDD) {
      itemDD.minAttributAbzug = mindestAttributAbzugBerechnen(itemDD, actorDD);
    }
    
    // SR berechnen
    itemDD.sr.mod = qpos ? checkValueRange(itemDD.sr.mod, 0, 1) : checkValueRange(itemDD.schaden.mod, -1, 0);
    itemDD.sr.wert = itemDD.sr.normal + itemDD.sr.mod;

    // Behinderung berechnen
    itemDD.behinderung.mod = qpos ? checkValueRange(itemDD.behinderung.mod, -1, 0) : checkValueRange(itemDD.wgs.mod, 0, 1);
    itemDD.behinderung.wert = itemDD.behinderung.normal + itemDD.behinderung.mod + (itemDD.minAttributAbzug ? itemDD.minAttributAbzug : 0);

    // Tickzuschlag berechnen
    itemDD.tickzuschlag.mod = qpos ? checkValueRange(itemDD.tickzuschlag.mod, -1, 0) : checkValueRange(itemDD.tickzuschlag.mod, 0, 1);
    itemDD.tickzuschlag.wert = itemDD.tickzuschlag.normal + itemDD.tickzuschlag.mod + (itemDD.minAttributAbzug ? itemDD.minAttributAbzug : 0);

    // Qualität berechnen (siehe GRW 142 unten)
    const qfunction = (itemDD) => itemDD.sr.mod * 2 - itemDD.behinderung.mod * 2 - itemDD.tickzuschlag.mod * 2 - itemDD.last.mod + itemDD.haerte.mod;
    allgemeineAusruestungswerteBerechnen(itemDD, qpos, qfunction);
  }

  /**
   * Prepare Schild type specific data
   */
  _prepareSchildData(itemData, actorData) {
    const itemDD = itemData.data;
    const actorDD = actorData.data;

    // Verbesserungen und Qualität der Waffe (siehe GRW 142)

    // Negative Qualität?
    const qpos = !itemDD.negativeQualitaet;

    // Fertigkeitswert berechnen
    itemDD.kampffertigkeit.mod = qpos ? checkValueRange(itemDD.kampffertigkeit.mod, 0, 3) : checkValueRange(itemDD.kampffertigkeit.mod, -3, 0);
    if (actorDD) {
      const kampffertigkeit = itemDD.kampffertigkeit.key = ermittleSchildKampffertigkeit(actorDD);
      const fp = actorDD.kampffertigkeiten[kampffertigkeit].fp;
      const attribut1 = actorDD.attribute.bew; // BEW
      const attribut2 = actorDD.attribute.sta; // STÄ
      itemDD.attribut1.wert = attribut1.wert;
      itemDD.attribut2.wert = attribut2.wert;
      itemDD.minAttributAbzug = mindestAttributAbzugBerechnen(itemDD, actorDD);
      itemDD.kampffertigkeit.wert = fp + itemDD.attribut1.wert + itemDD.attribut2.wert + itemDD.kampffertigkeit.mod;
      itemDD.kampffertigkeit.fp = fp;
    } else {
      itemDD.kampffertigkeit.wert = '???';
    }
    
    // Behinderung berechnen
    itemDD.behinderung.mod = qpos ? checkValueRange(itemDD.behinderung.mod, -1, 0) : checkValueRange(itemDD.wgs.mod, 0, 1);
    itemDD.behinderung.wert = itemDD.behinderung.normal + itemDD.behinderung.mod + (itemDD.minAttributAbzug ? itemDD.minAttributAbzug : 0);

    // Tickzuschlag berechnen
    itemDD.tickzuschlag.mod = qpos ? checkValueRange(itemDD.tickzuschlag.mod, -1, 0) : checkValueRange(itemDD.tickzuschlag.mod, 0, 1);
    itemDD.tickzuschlag.wert = itemDD.tickzuschlag.normal + itemDD.tickzuschlag.mod + (itemDD.minAttributAbzug ? itemDD.minAttributAbzug : 0);

    // Qualität berechnen (siehe GRW 142 unten)
    const qfunction = (itemDD) => itemDD.kampffertigkeit.mod * 2 + itemDD.behinderung.mod * 2 - itemDD.tickzuschlag.mod * 2 - itemDD.last.mod + itemDD.haerte.mod;
    allgemeineAusruestungswerteBerechnen(itemDD, qpos, qfunction);
  }

  /**
   * Prepare Schild type specific data
   */
  _prepareMeisterschaftData(itemData, actorData) {
    const itemDD = itemData.data;
    const actorDD = actorData.data;

    // TODO Machen wir hier irgendwas?

  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */

   /*
  async roll() {
    // Basic template rendering data
    const token = this.actor.token;
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;

    // Define the roll formula.
    let roll = new Roll('d20+@abilities.str.mod', actorData);
    let label = `Rolling ${item.name}`;
    // Roll and send to chat.
    roll.roll().toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: label
    });
  }
  */
}

function allgemeineAusruestungswerteBerechnen(itemDD, qpos, qfunction) {

  // Last berechnen
  itemDD.last.mod = qpos ? checkValueRange(itemDD.last.mod, -itemDD.last.normal/2, 0) : checkValueRange(itemDD.last.mod, 0, itemDD.last.normal/2);
  itemDD.last.wert= itemDD.last.normal + itemDD.last.mod;

  // Härte berechnen
  itemDD.haerte.mod = qpos ? checkValueRange(itemDD.haerte.mod, 0, 2) : checkValueRange(itemDD.haerte.mod, -2, 0);
  itemDD.haerte.wert = itemDD.haerte.normal + itemDD.haerte.mod;

  // Qualität berechnen (siehe GRW 142 unten)
  itemDD.qualitaet = qfunction(itemDD);

  // Verfügbarkeit berechnen (siehe GRW 181 links unten)
  var verfuegbarkeitStufe = VERFUEGBARKEIT.indexOf(itemDD.verfuegbarkeit.normal);
  if (itemDD.qualitaet > 0) {
    verfuegbarkeitStufe = Math.min(verfuegbarkeitStufe + Math.floor(itemDD.qualitaet/2), 3);
  }
  itemDD.verfuegbarkeit.berechnet = VERFUEGBARKEIT[verfuegbarkeitStufe];

  // Preis berechnen
  itemDD.preis.berechnet = berechnePreis(itemDD.preis.normal, itemDD.qualitaet);

  // Komplexitaet berechnen
  itemDD.komplexitaet.berechnet = berechneKomplexitaet(itemDD.komplexitaet.normal, itemDD.qualitaet);
}

// (siehe GRW 161 links oben)
function ermittleSchildKampffertigkeit(actorDD) {
  return NAHKAMPFFERTIGKEITEN.reduce((resultKey, currentKey) =>
      actorDD.kampffertigkeiten[currentKey].fp > actorDD.kampffertigkeiten[resultKey].fp ? currentKey : resultKey, 'handgemenge');
}

// (siehe GRW 186 links oben)
function mindestAttributAbzugBerechnen(itemDD, actorDD) {
  var abzug = 0, minAttribut, attribut;

  if (!itemDD.minAttribut1) {
    return 0;
  }
  minAttribut = itemDD.minAttribut1;
  attribut = actorDD.attribute[minAttribut.key];
  minAttribut.abzug = Math.max(minAttribut.wert - attribut.wert, 0);
  abzug = minAttribut.abzug;

  if (!itemDD.minAttribut2) {
    return abzug;
  }
  minAttribut = itemDD.minAttribut2;
  attribut = actorDD.attribute[minAttribut.key];
  minAttribut.abzug = Math.max(minAttribut.wert - attribut.wert, 0);
  abzug += minAttribut.abzug;

  return abzug;
}

function modifiziereSchadenswurf(formula, mod) {
  let exp = /([1-9])W(6|10)([\+-][0-9]+)?/;
  let groups = formula.match(exp);
  let newMod = groups[3] ? Number(groups[3]) : 0;
  newMod += mod;
  return groups[1] + 'W' + groups[2] + modifikatorString(newMod);
}

// (siehe GRW 181 links unten)
function berechnePreis(normalpreis, qualitaet) {
  if (qualitaet < 0) {
    return Math.round(normalpreis * (1 + Math.max(-10, qualitaet) * 0.1));
  } else if (qualitaet <= 6) {
    return normalpreis + PREIS_AUFSCHLAG[qualitaet];
  }
  return normalpreis + PREIS_AUFSCHLAG[6] + (qualitaet - 6) * 7500;
}

// (siehe GRW 141 rechts unten)
function berechneKomplexitaet(normalkomplexitaet, qualitaet) {
  let index1 = KOMPLEXITAET.indexOf(normalkomplexitaet);
  let index2 = Math.min(Math.ceil(qualitaet/2), 4);
  return KOMPLEXITAET[Math.max(index1, index2)];
}

/**
 * 
 * bonusMod -3 bis +3
 * lastMod 0.5*last bis 1.5*last
 * schadenMod -2 bis +2
 * wgsMod -1 bis +1
 * srMod -1 bis +1
 * behinderungMod -1 bis +1
 * tickzuschlagMod -1 bis +1
 * haerteMod -2 bis +2
 * 
 * qualitaet = bonusMod*2 +schadenMod -wgsMod*2 +srMod*2 -behinderungMod*2 -tickzuschlagMod*2 -lastMod +haerteMod
 * 
 * MODIFIZIERBAR
 * Fertigkeitswert/VTD+ bonusMod              Waffe bzw. Rüstung
 * Schaden              schadenMod            Waffe
 * WGS                  wgsMod                Waffe
 * SR                   srMod                 Rüstung
 * Behinderung          behinderungMod        Rüstung
 * Tickzuschlag         tickZuschlagMod       Rüstung
 * Last                 lastMod               IMMER
 * Härte                haerteMod             IMMER
 * 
 * CHECKBOX Negative Qualität
 * 
 * BERECHNET
 * Qualität
 * Verfügbarkeit
 * Preis
 * 
 * UNBEEINFLUSST
 * Attribute
 * Mindestattribute
 * Komplexität
 * Merkmale
 * 
 * U = Qu 0
 * G = Qu 1-2
 * F = Qu 2-4
 * M = Qu 5-6
 * 
 *  
 */

