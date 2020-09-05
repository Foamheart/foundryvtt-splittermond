import { SplittermondItem } from "../item/item.js";

export async function importAusruestung() {

    const pack = await createCompendium('ausruestung', 'Ausrüstung');
    
    await importWaffen(pack);
    await importRuestung(pack);
}

async function createCompendium(packName, packLabel) {
    const systemName = 'splittermond';
    const metadata = {
        name: packName,
        label: packLabel,
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

async function importWaffen(pack) {

    const response = await fetch("systems/splittermond/module/import/waffen-raw.json");
    const rawArray = await response.json();
    
    for (let rawData of rawArray) {
        let itemData = {name: rawData.name, type: 'waffe', img: ITEM_IMG.waffe};
        let item = await SplittermondItem.create(itemData, {temporary: true});
        let data = item.data.data;

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
            
        await pack.importEntity(item);

        console.log('>>> Item importiert: ' + itemData.name);
    }

}

async function importRuestung(pack) {

    const response = await fetch("systems/splittermond/module/import/ruestung-raw.json");
    const rawArray = await response.json();
    
    for (let rawData of rawArray) {
        let type = rawData.type;
        let itemData = {name: rawData.name, type: type , img: ITEM_IMG[type]};
        let item = await SplittermondItem.create(itemData, {temporary: true});
        let data = item.data.data;

        data.verfuegbarkeit.normal = rawData.verfuegbarkeit;
        data.preis.normal = rawData.preis;
        data.last.normal = rawData.last;
        data.haerte.normal = rawData.haerte;
        data.komplexitaet.normal = rawData.komplexitaet;
        data.vtdPlus = rawData.vtdPlus;
        if (type == 'ruestung') {
            data.sr.normal = rawData.sr;
        }
        data.behinderung.normal = rawData.behinderung;
        data.tickzuschlag.normal = rawData.tickzuschlag;
        createMinAttribut(data, rawData, 'minAttribut1');
        createMerkmale(data, rawData);
            
        await pack.importEntity(item);

        console.log('>>> Item importiert: ' + itemData.name);
    }

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
            if (groups.length > 1) {
                data.merkmale.push({key: groups[0], stufe: Number(groups[1])});
            } else {
                data.merkmale.push({key: groups[0]});
            }
        }
    }
}

const ITEM_IMG = {
    waffe: 'modules/game-icons-net/whitetransparent/axe-sword.svg',
    ruestung: 'modules/game-icons-net/whitetransparent/chest-armor.svg',
    schild: 'modules/game-icons-net/whitetransparent/attached-shield.svg'
}