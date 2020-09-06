export async function renderAusruestungCompendium(compendium, html, data) {

    data.items = await compendium.getContent();

    html.find('.compendium').empty();
    await renderWaffen(html, data);
    await renderRuestungen(html, data);
    await renderSchilde(html, data);

    // Handle dragdrop.
    const dragDrop = new DragDrop(compendium.options.dragDrop[0]);
    dragDrop.bind(html[0]);  
    
}

async function renderWaffen(html, data) {

    // let newData = duplicate(data);

    // Select the items.
    let waffen = data.items.filter(item => item.data.type == 'waffe');

    // Group the items.
    data.groups = {handgemenge: [], klingenwaffen: [], hiebwaffen: [], stangenwaffen: [], kettenwaffen: [], schusswaffen: [], wurfwaffen: []};
    waffen = waffen.reduce((groups, item) => {
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

    // let newData = duplicate(data);

    // Select the items.
    let ruestungen = data.items.filter(item => item.data.type == 'ruestung');

    // Extract the data.
    data.group = ruestungen.map(item => item.data);

    // Append the markup.
    let template = 'systems/splittermond/templates/apps/ruestungen.html';
    let content = await renderTemplate(template, data);
    html.find('.compendium').append(content);
}

async function renderSchilde(html, data) {

    // let newData = duplicate(data);

    // Select the items.
    let schilde = data.items.filter(item => item.data.type == 'schild');

    // Extract the data.
    data.group = schilde.map(item => item.data);

    // Append the markup.
    let template = 'systems/splittermond/templates/apps/schilde.html';
    let content = await renderTemplate(template, data);
    html.find('.compendium').append(content);
}
