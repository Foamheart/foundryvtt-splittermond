import { oeffneDialogFertigkeitsprobe } from "../probe/probe.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class SplittermondActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["splittermond", "sheet", "actor"],
      template: "systems/splittermond/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "grundwerte",
        },
      ],
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];
    
    /*
    for (let attr of Object.values(data.data.attributes)) {
      attr.isCheckbox = attr.dtype === "Boolean";
    }
    */
   
    // Localize Attribute labels
    for (let [key, attribut] of Object.entries(data.data.attribute)){
      attribut.name = game.i18n.localize('SPLITTERMOND.Attribut.' + key + '.name');
      attribut.abk = game.i18n.localize('SPLITTERMOND.Attribut.' + key + '.abk');
      attribut.mod = attribut.mod == 0 ? "" : attribut.mod;
    }    
    
    // Localize Abgeleitete Werte labels
    for (let [key, abgeleiteterWert] of Object.entries(data.data.abgeleiteteWerte)){
      abgeleiteterWert.name = game.i18n.localize('SPLITTERMOND.AbgeleiteterWert.' + key + '.name');
      abgeleiteterWert.abk = game.i18n.localize('SPLITTERMOND.AbgeleiteterWert.' + key + '.abk');
      abgeleiteterWert.formel = game.i18n.localize('SPLITTERMOND.AbgeleiteterWert.' + key + '.formel');
      abgeleiteterWert.mod = abgeleiteterWert.mod == 0 ? "" : abgeleiteterWert.mod;
      abgeleiteterWert.temp = abgeleiteterWert.temp == 0 ? "" : abgeleiteterWert.temp;
    }    

    // Localize Fertigkeiten labels
    for (let [key, fertigkeit] of Object.entries(data.data.fertigkeiten)){
      fertigkeit.name = game.i18n.localize('SPLITTERMOND.Fertigkeit.' + key + '.name');
      fertigkeit.att1.abk = game.i18n.localize('SPLITTERMOND.Attribut.' + fertigkeit.att1.key + '.abk');
      fertigkeit.att2.abk = game.i18n.localize('SPLITTERMOND.Attribut.' + fertigkeit.att2.key + '.abk');
      fertigkeit.punkte = fertigkeit.punkte == 0 ? "" : fertigkeit.punkte;
      fertigkeit.mod = fertigkeit.mod == 0 ? "" : fertigkeit.mod;
    }    

    // Localize Kampffertigkeiten labels
    for (let [key, kampffertigkeit] of Object.entries(data.data.kampffertigkeiten)){
      kampffertigkeit.name = game.i18n.localize('SPLITTERMOND.Kampffertigkeit.' + key + '.name');
      kampffertigkeit.punkte = kampffertigkeit.punkte == 0 ? "" : kampffertigkeit.punkte;
    }    

    // Prepare items.
    if (this.actor.data.type == "character") {
      this._prepareCharacterItems(data);
    }
    return data;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    // Initialize containers.
    const waffen = [];
    const gear = [];
    const features = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
    };

    // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;
      // Append to waffen.
      if (i.type === "waffe") {
        waffen.push(i);
      }
      // Append to gear.
      else if (i.type === "item") {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === "feature") {
        features.push(i);
      }
      // Append to spells.
      else if (i.type === "spell") {
        if (i.data.spellLevel != undefined) {
          spells[i.data.spellLevel].push(i);
        }
      }
    }

    // Assign and return
    actorData.waffen = waffen; 
    actorData.gear = gear;
    actorData.features = features;
    actorData.spells = spells;

    // Lokalisierung der Waffenliste
    for (let [key, waffe] of Object.entries(waffen)){
      waffe.data.kampffertigkeit.abk = game.i18n.localize('SPLITTERMOND.Kampffertigkeit.' + waffe.data.kampffertigkeit.key + '.abk');
      waffe.data.attribut1.abk = game.i18n.localize('SPLITTERMOND.Attribut.' + waffe.data.attribut1.key + '.abk');
      waffe.data.attribut2.abk = game.i18n.localize('SPLITTERMOND.Attribut.' + waffe.data.attribut2.key + '.abk');
    }    

  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Update Waffe Item
    html.find(".waffe-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".waffe");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Waffe Item
    html.find(".waffe-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".waffe");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Add Inventory Item
    html.find(".item-create").click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find(".item-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Drag&Drop für Waffenliste
    /*
    const dragDrop = new DragDrop({
       dragSelector: ".item",
       dropSelector: ".items",
       permissions: { dragstart: this._canDragStart.bind(this), drop: this._canDragDrop.bind(this) },
       callbacks: { dragstart: this._onDragStart.bind(this), drop: this._onDragDrop.bind(this) }
     });
    dragDrop.bind(html);
    */

    // Rollable abilities.
    html.find(".rollable").click(this._onRoll.bind(this));
  
    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragItemStart(ev);
      // Find all items on the character sheet.
      html.find('li.item').each((i, li) => {
        // Ignore for the header row.
        if (li.classList.contains("item-header")) return;
        // Add draggable attribute and dragstart listener.
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  /**
   * Handle toggling the state of an Owned Item within the Actor
   * @param {Event} event   The triggering click event
   * @private
   */
  _onToggleWaffe(event) {
    event.preventDefault();
    const itemId = event.currentTarget.closest('.waffe').dataset.itemId;
    const item = this.actor.getOwnedItem(itemId);
    const attr = 'data.ausgeruestet';
    return item.update({[attr]: !getProperty(item.data, attr)});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  /*
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (dataset.roll) {
      let roll = new Roll(dataset.roll, this.actor.data.data);
      let label = dataset.label ? `würfelt ${dataset.label}` : "";
      roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
      });
    }
  }
  */
 
  /**
   * Fertigkeitsprobe abhandeln.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    oeffneDialogFertigkeitsprobe(this.actor, dataset);
  }

}
