import { KAMPFFERTIGKEITEN } from "../const.js";
import { NAHKAMPFFERTIGKEITEN } from "../const.js";
import { FERTIGKEITEN } from "../const.js";
import { SplittermondItem } from "../item/item.js";

export async function importAusruestung() {
    const pack = await createCompendium('ausruestung', 'Ausrüstung');
    await importWaffen(pack);
    await importRuestung(pack);
}

export async function importMeisterschaften() {
    const pack = await createCompendium('meisterschaften', 'Meisterschaften');
    await importKampfmeisterschaften(pack);
    await importAllgemeineMeisterschaften(pack);
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

        console.log('>>> Waffe importiert: ' + itemData.name);
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

        console.log('>>> Ruestung/Schild importiert: ' + itemData.name);
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

async function importKampfmeisterschaften(pack) {

    const response = await fetch("systems/splittermond/module/import/kampfmeisterschaften-raw.json");
    const rawArray = await response.json();
    
    for (let rawData of rawArray) {
        const fertigkeit = rawData.fertigkeit;
        if (fertigkeit == 'nahkampf') {
            NAHKAMPFFERTIGKEITEN.forEach((key) => {
                importKampfmeisterschaft(pack, rawData, key);
            });
        } else if (fertigkeit == 'alle') {
            KAMPFFERTIGKEITEN.forEach((key) => {
                importKampfmeisterschaft(pack, rawData, key);
            });
        } else {
            importKampfmeisterschaft(pack, rawData, fertigkeit);
        }
    }
}

async function importKampfmeisterschaft(pack, rawData, fertigkeit) {
    let itemData = {name: rawData.name, type: 'kampfmeisterschaft', img: ITEM_IMG.kampfmeisterschaft};
    let item = await SplittermondItem.create(itemData, {temporary: true});
    let data = item.data.data;

    data.key = rawData.key;
    data.fertigkeit = fertigkeit;
    data.schwerpunkt = false;
    data.schwelle = Number(rawData.schwelle);
    data.manoever = rawData.manoever == 'manoever';
    data.voraussetzung = rawData.voraussetzung;
    data.beschreibung = rawData.beschreibung;

    await pack.importEntity(item);
    console.log('>>> Kampfmeisterschaft importiert: ' + fertigkeit + ' ' + itemData.name);
}

async function importAllgemeineMeisterschaften(pack) {

    const response = await fetch("systems/splittermond/module/import/allgemeine-meisterschaften-raw.json");
    const rawArray = await response.json();
    
    for (let rawData of rawArray) {
        const fertigkeit = rawData.fertigkeit;
        if (fertigkeit == 'alle') {
            Object.keys(FERTIGKEITEN).forEach((key) => {
                importAllgemeineMeisterschaft(pack, rawData, key);
            });
        } else {
            importAllgemeineMeisterschaft(pack, rawData, fertigkeit);
        }
    }
}

async function importAllgemeineMeisterschaft(pack, rawData, fertigkeit) {
    let itemData = {name: rawData.name, type: 'allgemeineMeisterschaft', img: ITEM_IMG.allgemeineMeisterschaft};
    let item = await SplittermondItem.create(itemData, {temporary: true});
    let data = item.data.data;

    data.key = rawData.key;
    data.fertigkeit = fertigkeit;
    data.schwerpunkt = rawData.key == 'schwerpunkt';
    data.schwelle = Number(rawData.schwelle);
    data.voraussetzung = rawData.voraussetzung;
    data.beschreibung = rawData.beschreibung;

    await pack.importEntity(item);
    console.log('>>> Allgemeine Meisterschaft importiert: ' + fertigkeit + ' ' + itemData.name);
}

const ITEM_IMG = {
    waffe: 'modules/game-icons-net/whitetransparent/axe-sword.svg',
    ruestung: 'modules/game-icons-net/whitetransparent/chest-armor.svg',
    schild: 'modules/game-icons-net/whitetransparent/attached-shield.svg',
    kampfmeisterschaft: 'modules/game-icons-net/whitetransparent/master-of-arms.svg',
    allgemeineMeisterschaft: 'modules/game-icons-net/whitetransparent/master-of-arms.svg'
}
