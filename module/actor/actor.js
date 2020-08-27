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
    const data = actorData.data;

    // Rasse
    const rasse = data.rasse;

    // Heldengrad checken (TODO: Ist nur temporär ein Eingabefeld, soll berechnet werden aus EP)
    data.hg = checkValueRange(data.hg, 1, 4);
    const hg = data.hg;
    const maxFP = hg * 3 + 3;

    // Attribute berechnen
    const attribute = data.attribute;
    for (let [key, attribut] of Object.entries(attribute)) {
      attribut.start = checkValueRange(attribut.start, 0, 5);
      attribut.mod = checkValueRange(attribut.mod, 0, hg);
      attribut.wert = attribut.start + attribut.mod;
    }

    // Abgeleitete Werte berechnen
    const awerte = data.abgeleiteteWerte;
    awerte.gk.wert = RASSE_GK[rasse] + awerte.gk.mod + awerte.gk.temp;
    awerte.gsw.wert = awerte.gk.wert + attribute.bew.wert + awerte.gsw.mod + awerte.gsw.temp;
    awerte.ini.wert = 10 - attribute.int.wert + awerte.ini.mod + awerte.ini.temp;
    awerte.lp.wert = awerte.gk.wert + attribute.kon.wert + awerte.lp.mod + awerte.lp.temp;
    awerte.fo.wert = 2 * (attribute.mys.wert + attribute.wil.wert) + awerte.fo.mod + awerte.fo.temp;
    awerte.vtd.wert = 12 + attribute.bew.wert + attribute.sta.wert + vtd_mod(awerte.gk.wert) + awerte.vtd.mod + awerte.vtd.temp;
    awerte.gw.wert = 12 + attribute.ver.wert + attribute.wil.wert + awerte.gw.mod + awerte.gw.temp;
    awerte.kw.wert = 12 + attribute.kon.wert + attribute.wil.wert + awerte.kw.mod + awerte.kw.temp;

    // Fertigkeiten berechnen
    const fertigkeiten = data.fertigkeiten;
    for (let [key, fertigkeit] of Object.entries(fertigkeiten)) {
      const att1_key = FERTIGKEITEN_ATTRIBUTE[key].att1;
      const att2_key = FERTIGKEITEN_ATTRIBUTE[key].att2;
      fertigkeit.att1 = {key: att1_key, wert: attribute[att1_key].wert};
      fertigkeit.att2 = {key: att2_key, wert: attribute[att2_key].wert};
      fertigkeit.fp = checkValueRange(fertigkeit.fp, 0, maxFP);
      fertigkeit.wert = fertigkeit.fp + fertigkeit.att1.wert + fertigkeit.att2.wert + fertigkeit.mod;
    }

    // Kampffertigkeiten checken
    const kampffertigkeiten = data.kampffertigkeiten;
    for (let [key, kampffertigkeit] of Object.entries(kampffertigkeiten)) {
      kampffertigkeit.fp = checkValueRange(kampffertigkeit.fp, 0, maxFP);
    }

    // Magieschulen berechnen
    const magieschulen = data.magieschulen;
    for (let [key, magieschule] of Object.entries(magieschulen)) {
      const att1_key = 'mys';
      const att2_key = MAGIESCHULEN_ATTRIBUT[key];
      magieschule.att1 = {key: att1_key, wert: attribute[att1_key].wert};
      magieschule.att2 = {key: att2_key, wert: attribute[att2_key].wert};
      magieschule.fp = checkValueRange(magieschule.fp, 0, maxFP);
      magieschule.wert = magieschule.fp + magieschule.att1.wert + magieschule.att2.wert + magieschule.mod;
    }

    this.prepareEmbeddedEntities(); // TODO Alle Items des Actors neu erzeugen. Möglicherweise unperformant?
    
  }

}

/****** KONSTANTEN ******/

const RASSE_GK = {
  alb: 5,
  gnom: 3,
  mensch: 5,
  varg: 6,
  zwerg: 4
};

const FERTIGKEITEN_ATTRIBUTE = {
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

const MAGIESCHULEN_ATTRIBUT = {
  bann: 'wil',
  beherrschung: 'wil',
  bewegung: 'bew',
  erkenntnis: 'ver',
  fels: 'kon',
  feuer: 'aus',
  heilung: 'aus',
  illusion: 'aus',
  kampf: 'sta',
  licht: 'aus',
  natur: 'aus',
  schatten: 'int',
  schicksal: 'aus',
  schutz: 'aus',
  staerkung: 'sta',
  tod: 'ver',
  verwandlung: 'kon',
  wasser: 'int',
  wind: 'ver'
}

/****** HILFSFUNKTIONEN ******/

function vtd_mod(gk) {
  return (5 - gk) * 2;
}

function heimlichkeit_mod(gk) {
  return 5 - gk;
}
