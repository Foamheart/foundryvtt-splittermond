import { checkValueRange } from "../utils.js";

/*******************************************************/

class DataElement {

    constructor(key) {
        this.key = key;
    }

    container() {
        // Parent data container.
        // Needs to be overwritten. 
    }

    update() {
        // do nothing by default
        // should be overwritten if the element has derived values
        // which are visible in the Sheet.
    }

    get value() {
        return this.container()[this.key];
    }
    
}

/*******************************************************/

class Rasse extends DataElement {

    static Groessenklassen = {'alb': 5, 'gnom': 3, 'mensch': 5, 'varg': 6, 'zwerg': 4};

    constructor() {
        super('rasse');
    }

    container() {
      return dm.data;
    }
  
    get gk() {
        return Rasse.Groessenklassen[this.value];
    }
  
  }
  
  /*******************************************************/
  
  class Heldengrad extends DataElement {
  
    constructor() {
      super('hg');
    }

    container() {
      return dm.data;
    }
  
  }
  
  /*******************************************************/

class Attribut extends DataElement {

  container() {
   return dm.data.attribute;
  }
    
  update() {
    this.value.start = checkValueRange(this.start, 0, 5);
    this.value.mod = checkValueRange(this.mod, 0, dm.hg.value);
    this.value.wert = this.wert;
  }

  get start() {
    return this.value.start;
  }

  get mod() {
    return this.value.mod;
  }

  get wert() {
    return this.start + this.mod;
  }

}

/*******************************************************/

class AbgeleiteterWert extends DataElement {

  container() {
    return dm.data.abgeleiteteWerte;
  }

  update() {
    this.value.wert = this.wert;
  }

  get mod() {
    return this.value.mod;
  }

  get temp() {
    return this.value.temp;
  }

  get wert() {
    // needs to be overwritten in subclass
  }

}

/*******************************************************/

class Groessenklasse extends AbgeleiteterWert {

  constructor() {
    super('gk');
  }

  get wert() {
    return dm.rasse.gk + this.mod + this.temp;
  }
  
  get vtdMod() {
    return (5 - this.wert) * 2; 
  }
  
  get heimlichkeitMod() {
    return 5 - this.wert; 
  }
  
}

/*******************************************************/

class Geschwindigkeit extends AbgeleiteterWert {

  constructor() {
    super('gsw');
  }

  get wert() {
    return dm.abgeleiteteWerte.gk.wert + this.mod + this.temp;
  }

}

/*******************************************************/

class Initiative extends AbgeleiteterWert {

  constructor() {
    super('ini');
  }

  get wert() {
    return 10 - dm.attribute.int.wert + this.mod + this.temp;
  }

}

/*******************************************************/

class Lebenspunkte extends AbgeleiteterWert {

  constructor() {
    super('lp');
  }

  get wert() {
    return dm.abgeleiteteWerte.gk.wert + dm.attribute.kon.wert + this.mod + this.temp;
  }

}

/*******************************************************/

class Fokus extends AbgeleiteterWert {

  constructor() {
    super('fo');
  }

  get wert() {
    return 2 * (dm.attribute.mys.wert + dm.attribute.wil.wert) + this.mod + this.temp;
  }

}

/*******************************************************/

class Verteidigung extends AbgeleiteterWert {

  constructor() {
    super('vtd');
  }

  get wert() {
    return 12 + dm.attribute.bew.wert + dm.attribute.sta.wert + dm.abgeleiteteWerte.gk.vtdMod + this.mod + this.temp;
  }

}

/*******************************************************/

class GeistigerWiderstand extends AbgeleiteterWert {

  constructor() {
    super('gw');
  }

  get wert() {
    return 12 + dm.attribute.ver.wert + dm.attribute.wil.wert + this.mod + this.temp;
  }

}

/*******************************************************/

class KoerperlicherWiderstand extends AbgeleiteterWert {

  constructor() {
    super('kw');
  }

  get wert() {
    return 12 + dm.attribute.kon.wert + dm.attribute.wil.wert + this.mod + this.temp;
  }

}

/*******************************************************/

class Fertigkeit extends DataElement {

  update() {
    this.value.fp = checkValueRange(this.fp, 0, dm.hg.value * 3 + 3);
  }

  get fp() {
    return this.value.fp;
  }

}

/*******************************************************/

class AllgemeineFertigkeit extends Fertigkeit {

  constructor(key, attribut1_key, attribut2_key) {
    super(key);
    this.attribut1_key = attribut1_key;
    this.attribut2_key = attribut2_key;
  }

  container() {
    return dm.data.fertigkeiten;
  }

  update() {
    super.update();
    this.value.wert = this.wert;
    this.value.att1 = { key: this.attribut1.key, wert: this.attribut1.wert };
    this.value.att2 = { key: this.attribut2.key, wert: this.attribut2.wert };
  }

  get attribut1() {
    return dm.attribute[this.attribut1_key];
  }

  get attribut2() {
    return dm.attribute[this.attribut2_key];
  }

  get mod() {
    return this.value.mod;
  }

  get wert() {
    return this.fp + this.attribut1.wert + this.attribut2.wert + this.mod;
  }

}

/*******************************************************/

class Kampffertigkeit extends Fertigkeit {

  container() {
    return dm.data.kampffertigkeiten;
  }

}

/*******************************************************/

class Magieschule extends Fertigkeit {

  constructor(key, attribut2_key) {
    super(key);
    this.attribut2_key = attribut2_key;
  }

  container() {
    return dm.data.magieschulen;
  }

  update() {
    this.value.wert = this.wert;
    this.value.att1 = { key: this.attribut1.key, wert: this.attribut1.wert };
    this.value.att2 = { key: this.attribut2.key, wert: this.attribut2.wert };
  }

  get attribut1() {
    return dm.attribute.mys;
  }

  get attribut2() {
    return dm.attribute[this.attribut2_key];
  }

  get mod() {
    return this.value.mod;
  }

  get wert() {
    return this.fp + this.attribut1.wert + this.attribut2.wert + this.mod;
  }

}

/*******************************************************/

export class ActorDataModel {

    static instance = new ActorDataModel();
  
    constructor() {
      this.rasse = new Rasse();
      this.hg = new Heldengrad();
      this.initializeAttribute();
      this.initializeAbgeleiteteWerte();
      this.initializeAllgemeineFertigkeiten();
      this.initializeKampffertigkeiten();
      // this.initializeMagieschulen();
    }
  
    initializeAttribute() {
      this.attribute = {};
      const keys = ['aus', 'bew', 'int', 'kon', 'mys', 'sta', 'ver', 'wil'];
      keys.forEach(key => this.attribute[key] = new Attribut(key));
    }
  
    initializeAbgeleiteteWerte() {
      this.abgeleiteteWerte = {};
      this.abgeleiteteWerte.gk = new Groessenklasse();
      this.abgeleiteteWerte.gsw = new Geschwindigkeit();
      this.abgeleiteteWerte.ini = new Initiative();
      this.abgeleiteteWerte.lp = new Lebenspunkte();
      this.abgeleiteteWerte.fo = new Fokus();
      this.abgeleiteteWerte.vtd = new Verteidigung();
      this.abgeleiteteWerte.gw = new GeistigerWiderstand();
      this.abgeleiteteWerte.kw = new KoerperlicherWiderstand();
    }
  
    initializeAllgemeineFertigkeiten() {
        this.fertigkeiten = {};
        this.createAllgemeineFertigkeit('akrobatik', 'bew', 'sta');
        this.createAllgemeineFertigkeit('alchemie', 'mys', 'ver');
        this.createAllgemeineFertigkeit('anfuehren', 'aus', 'wil');
        this.createAllgemeineFertigkeit('arkaneKunde', 'mys', 'ver');
        this.createAllgemeineFertigkeit('athletik', 'bew', 'sta');
        this.createAllgemeineFertigkeit('darbietung', 'aus', 'wil');
        this.createAllgemeineFertigkeit('diplomatie', 'aus', 'ver');
        this.createAllgemeineFertigkeit('edelhandwerk', 'int', 'ver');
        this.createAllgemeineFertigkeit('empathie', 'int', 'ver');
        this.createAllgemeineFertigkeit('entschlossenheit', 'aus', 'wil');
        this.createAllgemeineFertigkeit('fingerfertigkeit', 'aus', 'bew');
        this.createAllgemeineFertigkeit('geschichteUndMythen', 'mys', 'ver');
        this.createAllgemeineFertigkeit('handwerk', 'kon', 'ver');
        this.createAllgemeineFertigkeit('heilkunde', 'int', 'ver');
        this.createAllgemeineFertigkeit('heimlichkeit', 'bew', 'int');
        this.createAllgemeineFertigkeit('jagdkunst', 'kon', 'ver');
        this.createAllgemeineFertigkeit('laenderkunde', 'int', 'ver');
        this.createAllgemeineFertigkeit('naturkunde', 'int', 'ver');
        this.createAllgemeineFertigkeit('redegewandtheit', 'aus', 'wil');
        this.createAllgemeineFertigkeit('schloesserUndFallen', 'int', 'bew');
        this.createAllgemeineFertigkeit('schwimmen', 'sta', 'kon');
        this.createAllgemeineFertigkeit('seefahrt', 'bew', 'kon');
        this.createAllgemeineFertigkeit('strassenkunde', 'aus', 'int');
        this.createAllgemeineFertigkeit('tierfuehrung', 'aus', 'bew');
        this.createAllgemeineFertigkeit('ueberleben', 'int', 'kon');
        this.createAllgemeineFertigkeit('wahrnehmung', 'int', 'wil');
        this.createAllgemeineFertigkeit('zaehigkeit', 'kon', 'wil');
    }
  
    createAllgemeineFertigkeit(key, attribut1_key, attribut2_key) {
      this.fertigkeiten[key] = new AllgemeineFertigkeit(key, attribut1_key, attribut2_key);
    }
  
    initializeKampffertigkeiten() {
      this.kampffertigkeiten = {};
      this.createKampffertigkeit('handgemenge');
      this.createKampffertigkeit('hiebwaffen');
      this.createKampffertigkeit('kettenwaffen');
      this.createKampffertigkeit('klingenwaffen');
      this.createKampffertigkeit('stangenwaffen');
      this.createKampffertigkeit('schusswaffen');
      this.createKampffertigkeit('wurfwaffen');
    }
  
    createKampffertigkeit(key) {
      this.kampffertigkeiten[key] = new Kampffertigkeit(key);
    }
  
    initializeMagieschulen() {
      this.magieschulen = {};
      this.createMagieschule('bann', 'wil');
      this.createMagieschule('beherrschung', 'wil');
      this.createMagieschule('bewegung', 'bew');
      this.createMagieschule('erkenntnis', 'ver');
      this.createMagieschule('fels', 'kon');
      this.createMagieschule('feuer', 'aus');
      this.createMagieschule('heilung', 'aus');
      this.createMagieschule('illusion', 'aus');
      this.createMagieschule('kampf', 'sta');
      this.createMagieschule('licht', 'aus');
      this.createMagieschule('natur', 'aus');
      this.createMagieschule('schatten', 'int');
      this.createMagieschule('schicksal', 'aus');
      this.createMagieschule('schutz', 'aus');
      this.createMagieschule('staerkung', 'sta');
      this.createMagieschule('tod', 'ver');
      this.createMagieschule('verwandlung', 'kon');
      this.createMagieschule('wasser', 'int');
      this.createMagieschule('wind', 'ver');
    }
  
    createMagieschule(key, attribut_key) {
      this.magieschulen[key] = new Magieschule(key, attribut_key);
    }
  
    update(data) {
      this.data = data; // Hier wird der Datencontainer bereitgestellt, auf den alle DataElements während des Updates mittels dm.data zugreifen.
      this.rasse.update();
      this.hg.update();
      for (let [key, value] of Object.entries(this.attribute)) { value.update() }    
      for (let [key, value] of Object.entries(this.abgeleiteteWerte)) { value.update() }    
      for (let [key, value] of Object.entries(this.fertigkeiten)) { value.update() }    
      for (let [key, value] of Object.entries(this.kampffertigkeiten)) { value.update() }    
      // for (let [key, value] of Object.entries(this.magieschulen)) { value.update() }    
    }
  
  }
  
  /*******************************************************/

const dm = ActorDataModel.instance; // Singleton

