export const RASSEN = {
    alb: {gk: 5},
    gnom: {gk: 3},
    mensch: {gk: 5},
    varg: {gk: 6},
    zwerg: {gk: 4}
};

export const KAMPFFERTIGKEITEN = [
    'handgemenge', 'hiebwaffen', 'kettenwaffen', 'klingenwaffen', 'stangenwaffen', 'schusswaffen', 'wurfwaffen'
]

export const NAHKAMPFFERTIGKEITEN = [
    'handgemenge', 'hiebwaffen', 'kettenwaffen', 'klingenwaffen', 'stangenwaffen'
]

export const FERTIGKEITEN = {
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

export const MAGIESCHULEN = {
    bann: {att2: 'wil'},
    beherrschung: {att2: 'wil'},
    bewegung: {att2: 'bew'},
    erkenntnis: {att2: 'ver'},
    fels: {att2: 'kon'},
    feuer: {att2: 'aus'},
    heilung: {att2: 'aus'},
    illusion: {att2: 'aus'},
    kampf: {att2: 'sta'},
    licht: {att2: 'aus'},
    natur: {att2: 'aus'},
    schatten: {att2: 'int'},
    schicksal: {att2: 'aus'},
    schutz: {att2: 'aus'},
    staerkung: {att2: 'sta'},
    tod: {att2: 'ver'},
    verwandlung: {att2: 'kon'},
    wasser: {att2: 'int'},
    wind: {att2: 'ver'}
}

export const VERFUEGBARKEIT = ['dorf', 'kleinstadt', 'grossstadt', 'metropole'];
export const PREIS_AUFSCHLAG = [0, 1500, 3000, 6000, 9000, 15000, 21000];
export const KOMPLEXITAET = ['u', 'g', 'f', 'm', 'a'];
