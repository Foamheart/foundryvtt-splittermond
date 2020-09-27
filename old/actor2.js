import { ActorDataModel } from "./actor-model.js";

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

    ActorDataModel.instance.update(data); // Update passiert in ActorDataModel

    this.prepareEmbeddedEntities(); // TODO Alle Items des Actors neu erzeugen. Möglicherweise unperformant?
    
  }

}
