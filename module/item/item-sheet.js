
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class SplittermondItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["splittermond", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ 
        navSelector: ".sheet-tabs", 
        contentSelector: ".sheet-body", 
        initial: "werte" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/splittermond/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;
    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.

    return `${path}/${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    const dd = data.data;
    data.dtypes = ["String", "Number", "Boolean"];

    // Localize Waffenmerkmale
    for (let [key, merkmal] of Object.entries(dd.merkmale)){
      let stufe = merkmal.stufe === undefined ? '' : ' ' + merkmal.stufe;
      merkmal.nameStufe = game.i18n.localize('SPLITTERMOND.Waffenmerkmal.' + merkmal.key) + stufe;
    }    

    // Localize Waffe labels
    dd.kampffertigkeit.name = game.i18n.localize('SPLITTERMOND.Kampffertigkeit.' + dd.kampffertigkeit.key + '.name');
    dd.attribut1.abk = game.i18n.localize('SPLITTERMOND.Attribut.' + dd.attribut1.key + '.abk');
    dd.attribut2.abk = game.i18n.localize('SPLITTERMOND.Attribut.' + dd.attribut2.key + '.abk');

    if (dd.minAttribut1) {
      dd.minAttribut1.abk = game.i18n.localize('SPLITTERMOND.Attribut.' + dd.minAttribut1.key + '.abk');
    }

    if (dd.minAttribut2) {
      dd.minAttribut2.abk = game.i18n.localize('SPLITTERMOND.Attribut.' + dd.minAttribut2.key + '.abk');
    }

    dd.verfuegbarkeit.name = game.i18n.localize('SPLITTERMOND.Verfuegbarkeit.' + dd.verfuegbarkeit.berechnet);
    dd.komplexitaet.name = game.i18n.localize('SPLITTERMOND.Komplexitaet.' + dd.komplexitaet.berechnet + '.name');

    dd.kampffertigkeit.mod = dd.kampffertigkeit.mod == 0 ? '' : dd.kampffertigkeit.mod;
    dd.schaden.mod = dd.schaden.mod == 0 ? '' : dd.schaden.mod;
    dd.wgs.mod = dd.wgs.mod == 0 ? '' : dd.wgs.mod;
    dd.last.mod = dd.last.mod == 0 ? '' : dd.last.mod;
    dd.haerte.mod = dd.haerte.mod == 0 ? '' : dd.haerte.mod;
    
    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Roll handlers, click handlers, etc. would go here.
  }
}
