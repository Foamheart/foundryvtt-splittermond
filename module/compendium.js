import { KAMPFFERTIGKEITEN } from "./const.js";
import { FERTIGKEITEN } from "./const.js";

export async function renderAusruestungCompendium(compendium, html, data) {

    data.items = await compendium.getContent();

    html.find('.compendium').removeClass('flexcol').addClass('ausruestung').empty();
    await renderWaffen(html, data);
    await renderRuestungen(html, data);
    await renderSchilde(html, data);

    // Handle dragdrop.
    const dragDrop = new DragDrop(compendium.options.dragDrop[0]);
    dragDrop.bind(html[0]);  
    
}

export async function renderMeisterschaftenCompendium(compendium, html, data) {

    data.items = await compendium.getContent();

    html.find('.compendium').removeClass('flexcol').addClass('meisterschaften').empty();
    await renderKampfmeisterschaften(html, data);
    await renderAllgemeineMeisterschaften(html, data);

    // Handle dragdrop.
    const dragDrop = new DragDrop(compendium.options.dragDrop[0]);
    dragDrop.bind(html[0]);  
    
}
async function renderWaffen(html, data) {

    // Select the items.
    let items = data.items.filter(item => item.data.type == 'waffe');

    // Prepare groups
    data.groups = {};
    KAMPFFERTIGKEITEN.forEach((key) => data.groups[key] = []);

    // Group the items.
    items = items.reduce((groups, item) => {
        let dd = item.data.data;
        let groupKey = dd.kampffertigkeit.key;
        groups[groupKey].push(item.data);
        return groups;
    }, data.groups);
  
    // Append the markup.
    let template = 'systems/splittermond/templates/apps/waffen.html';
    let content = await renderTemplate(template, data);
    html.find('.compendium').append(content);

    // Handle folder toggles.
    html.find('.entry-group').on('click', event => {
        event.preventDefault();
        $(event.currentTarget).parent().next().toggleClass('hidden');
    })
}

async function renderRuestungen(html, data) {

    // Select the items.
    let items = data.items.filter(item => item.data.type == 'ruestung');

    // Extract the data.
    data.group = items.map(item => item.data);

    // Append the markup.
    let template = 'systems/splittermond/templates/apps/ruestungen.html';
    let content = await renderTemplate(template, data);
    html.find('.compendium').append(content);
}

async function renderSchilde(html, data) {

    // Select the items.
    let items = data.items.filter(item => item.data.type == 'schild');

    // Extract the data.
    data.group = items.map(item => item.data);

    // Append the markup.
    let template = 'systems/splittermond/templates/apps/schilde.html';
    let content = await renderTemplate(template, data);
    html.find('.compendium').append(content);
}

async function renderKampfmeisterschaften(html, data) {

    // Select the items.
    let items = data.items.filter(item => item.data.type == 'kampfmeisterschaft');

    // Prepare groups.
    data.groups = {};
    KAMPFFERTIGKEITEN.forEach((key) => data.groups[key] = [[],[],[],[],[]]);

    // Group the items.
    items = items.reduce((groups, item) => {
        let dd = item.data.data;
        let groupKey = dd.fertigkeit;
        groups[dd.fertigkeit][dd.schwelle].push(item.data);
        return groups;
    }, data.groups);
  
    // Append the markup.
    let template = 'systems/splittermond/templates/apps/kampfmeisterschaften.html'; 
    let content = await renderTemplate(template, data);
    html.find('.compendium').append(content);

    // Handle folder toggles.
    html.find('.entry-group').on('click', event => {
        event.preventDefault();
        $(event.currentTarget).next().toggleClass('hidden');
    })

    // Handle description toggles.
    html.find('.entry').on('click', event => {
        event.preventDefault();
        $(event.currentTarget).children().toggleClass('hidden');
    })
}

async function renderAllgemeineMeisterschaften(html, data) {

    // Select the items.
    let items = data.items.filter(item => item.data.type == 'allgemeineMeisterschaft');

    // Prepare groups.
    data.groups = {};
    Object.keys(FERTIGKEITEN).forEach((key) => data.groups[key] = [[],[],[],[],[]]);

    // Group the items.
    items = items.reduce((groups, item) => {
        let dd = item.data.data;
        let groupKey = dd.fertigkeit;
        groups[dd.fertigkeit][dd.schwelle].push(item.data);
        return groups;
    }, data.groups);
  
    // Append the markup.
    let template = 'systems/splittermond/templates/apps/allgemeine-meisterschaften.html'; 
    let content = await renderTemplate(template, data);
    html.find('.compendium').append(content);

    // Handle folder toggles.
    html.find('.entry-group').on('click', event => {
        event.preventDefault();
        $(event.currentTarget).next().toggleClass('hidden');
    })

    // Handle description toggles.
    html.find('.entry').on('click', event => {
        event.preventDefault();
        $(event.currentTarget).children().toggleClass('hidden');
    })
}
