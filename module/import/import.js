import { SplittermondItem } from "../item/item.js";

export async function importWaffen() {

    const pack = await createWaffenCompendium();

    const response = await fetch("systems/splittermond/module/import/waffen-raw.json");
    const rawArray = await response.json();
    
    for (let rawData of rawArray) {
        let itemData = {name: rawData.name, type: 'waffe', img: 'modules/game-icons-net/whitetransparent/axe-sword.svg'};
        let waffe = await SplittermondItem.create(itemData, {temporary: true});
        let data = waffe.data.data;

        data.kampffertigkeit.key = rawData.kampffertigkeit;
        data.verfuegbarkeit.normal = rawData.verfuegbarkeit;
        data.preis.normal = rawData.preis;
        data.last.normal = rawData.last;
        data.haerte.normal = rawData.haerte;
        data.komplexitaet.normal = rawData.komplexitaet;
        data.schaden.normal = rawData.schaden;
        data.wgs.normal = rawData.wgs;
        data.attribut1.key = rawData.attribut1;
        data.attribut2.key = rawData.attribut2;
        createMinAttribut(data, rawData, 'minAttribut1');
        createMinAttribut(data, rawData, 'minAttribut2');
        createMerkmale(data, rawData);
        data.reichweite = Number(rawData.reichweite);
            
        await pack.importEntity(waffe);

        console.log('>>> Waffe importiert: ' + itemData.name);
    }

}

async function createWaffenCompendium() {
    const systemName = 'splittermond';
    const packName = 'waffen';
    const metadata = {
        name: packName,
        label: 'Waffenliste',
        system: systemName,
        path: `./packs/${packName}.db`,
        entity: 'Item'
    }
  
    // Delete old pack if it already exists
    let pack = game.packs.get(`world.${packName}`);
    if (pack) {
        pack.delete();
    }
    
    // Create new pack
    pack = await Compendium.create(metadata);
    return pack;
}

function createMinAttribut(data, rawData, key) {
    if (rawData[key].length > 0) {
        let groups = rawData[key].split('_');
        data[key] = {key: groups[0], wert: Number(groups[1])};
    }
}

function createMerkmale(data, rawData) {
    data.merkmale = [];
    if (rawData.merkmale.length > 0) {
        let rawMerkmale = rawData.merkmale.split(',');
        for(let rawMerkmal of rawMerkmale) {
            let groups = rawMerkmal.split('_');
            let stufe = groups.length > 1 ? Number(groups[1]) : 0;
            data.merkmale.push({key: groups[0], stufe: stufe});
        }
    }
}