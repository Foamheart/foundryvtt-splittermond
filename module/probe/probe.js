import { modifikatorString } from "../utils.js";

export async function oeffneDialogFertigkeitsprobe(actor, dataset) {

    if (dataset.probe === 'fertigkeit') {
        oeffneDialogAllgemeineFertigkeitsprobe(actor, dataset);
    } else if (dataset.probe === 'kampffertigkeit') {
        oeffneDialogKampffertigkeitsprobe(actor, dataset);
    }
    
}

async function oeffneDialogAllgemeineFertigkeitsprobe(actor, dataset) {

    // TODO Modifikator aufgrund von Behinderung berücksichtigen (siehe GRW 165 links)
    
    let dialogData = {
        fertigkeitWert: Number(dataset.wert),
        modifikator: 0,
        schwierigkeit: 15,
        rollMode: game.settings.get("core", "rollMode"),
        rollModes: CONFIG.Dice.rollModes,
       };

    const title = actor.name + ': ' + game.i18n.localize('SPLITTERMOND.Label.Probe') + ' ' + game.i18n.localize('SPLITTERMOND.Label.auf') + ' ' + dataset.name;
    const html = await renderTemplate('systems/splittermond/templates/dialog/fertigkeitsprobe-dialog.html', dialogData);
    oeffneDialog(actor, null, dataset, title, html);
}

async function oeffneDialogKampffertigkeitsprobe(actor, dataset) {

    // TODO Tickzuschlag berücksichtigen (siehe GRW 165 links)
    
    const targets = Array.from(game.user.targets);
    if (targets.length !== 1) {
        ui.notifications.info("Bitte erst genau 1 Ziel für den Angriff markieren.");
        return;
    }

    const target = targets[0].actor.data;

    let dialogData = {
        fertigkeitWert: Number(dataset.wert),
        modifikator: 0,
        gegner: target.name,
        schwierigkeit: target.data.abgeleiteteWerte.vtd.wert,
        rollMode: game.settings.get("core", "rollMode"),
        rollModes: CONFIG.Dice.rollModes,
       };
    
    const title = actor.name + ': ' + game.i18n.localize('SPLITTERMOND.Label.Angriff') + ' ' + game.i18n.localize('SPLITTERMOND.Label.mit') + ' ' + dataset.name;
    const html = await renderTemplate('systems/splittermond/templates/dialog/kampffertigkeitsprobe-dialog.html', dialogData);
    oeffneDialog(actor, target, dataset, title, html);
}

function oeffneDialog(actor, target, dataset, title, html) {
    let d = new Dialog({
        title: title,
        content: html,
        buttons: {
         standard: {
          label: '<b>' + game.i18n.localize('SPLITTERMOND.Label.Standardwurf') + '</b>',
          callback: html => new Standardwurf(actor, target, dataset, html[0].querySelector("form")).execute()
         },
         risiko: {
          label: game.i18n.localize('SPLITTERMOND.Label.Risikowurf'),
          callback: html => new Risikowurf(actor, target, dataset, html[0].querySelector("form")).execute()
         },
        sicherheit: {
         label: game.i18n.localize('SPLITTERMOND.Label.Sicherheitswurf'),
         callback: html => new Sicherheitswurf(actor, target, dataset, html[0].querySelector("form")).execute()
        }
       },
        default: 'standard'
       });
    d.render(true);
}

/**
 *  Probenarten
 */

class Probe {

    constructor(actor, target, dataset, form) {
        this.actor = actor;
        this.target = target;
        this.fertigkeitName = dataset.name;
        this.fertigkeitWert = Number(dataset.wert);
        this.fertigkeitPunkte = Number(dataset.punkte);
        this.wgs = Number(dataset.wgs);
        this.schaden = dataset.schaden;
        this.modifikator = Number(form.modifikator.value);
        this.schwierigkeit = Number(form.schwierigkeit.value);
        this.rollMode = form.rollMode.value;
    }

    execute() {
        let messageData = this.wuerfeln();

        messageData.speaker = ChatMessage.getSpeaker({ actor: this.actor });
        let auf = game.i18n.localize('SPLITTERMOND.Label.auf');
        let gegen = game.i18n.localize('SPLITTERMOND.Label.gegen')
        messageData.flavor = `${this.wurfartString()} ` + auf + ` <b>${this.fertigkeitName}</b> ` + gegen + ` ${this.schwierigkeit}.`;
        
        // Erfolgsgrade (GRW 17)
        this.differenz = this.probenergebnis - this.schwierigkeit;
        this.erfolgsgrade = Math.floor(this.differenz/3);
    
        // Probe ohne Fertigkeitspunkte (GRW 18 links oben)
        if (this.fertigkeitPunkte == 0) {
            this.erfolgsgrade = Math.min(this.erfolgsgrade, 0);
        }
    
        this.patzerUndTriumphBehandeln();
        this.probenergebnisTextErmitteln();

        messageData.roll.dice[0].options.probe = this;
        ChatMessage.create(messageData, {rollMode: this.rollMode});
    }

    wuerfeln() {
        // In Unterklasse implementiert.
    }

    wurfartString() {
        // In Unterklasse implementiert.
    }

    patzerUndTriumphBehandeln() {
        // Patzer und Triumph (GRW 18)
        if (this.niedrigeWuerfelsumme <= 3) {
            this.kritisch = 'patzer';
            this.erfolgsgrade -= 3;
            this.erfolgsgrade = Math.min(this.erfolgsgrade, -1);
        } else if (this.hoheWuerfelsumme >= 19) {
            this.kritisch = 'triumph';
            if (this.differenz >= 0) {
                this.erfolgsgrade += 3;
            }
        }
    }

    probenergebnisTextErmitteln() {
        let text = '';
        if (this.kritisch == 'patzer') {
          text = game.i18n.localize('SPLITTERMOND.Label.Patzer') + '!';
        } else if (this.kritisch == 'triumph') {
          text = game.i18n.localize('SPLITTERMOND.Label.Triumph') + '!';
        } else if (this.erfolgsgrade >= 5) {
          text = game.i18n.localize('SPLITTERMOND.Label.HerausragendGelungen') + '.';
        } else if (this.erfolgsgrade >= 3) {
          text = game.i18n.localize('SPLITTERMOND.Label.GutGelungen') + '.';
        } else if (this.erfolgsgrade >= 1) {
          text = game.i18n.localize('SPLITTERMOND.Label.Gelungen') + '.';
        } else if (this.erfolgsgrade == 0 && this.differenz >= 0) {
          text = game.i18n.localize('SPLITTERMOND.Label.KnappGelungen') + '.';
        } else if (this.erfolgsgrade == 0) {
          text = game.i18n.localize('SPLITTERMOND.Label.KnappMisslungen') + '.';
        } else if (this.erfolgsgrade >= -2) {
          text = game.i18n.localize('SPLITTERMOND.Label.Misslungen') + '.';
        } else if (this.erfolgsgrade >= -4) {
          text = game.i18n.localize('SPLITTERMOND.Label.SchwerMisslungen') + '.';
        } else {
          text = game.i18n.localize('SPLITTERMOND.Label.VerheerendMisslungen') + '.';
        }
        let erfolgsgradText = (Math.abs(this.erfolgsgrade) == 1 ? game.i18n.localize('SPLITTERMOND.Label.Erfolgsgrad') : game.i18n.localize('SPLITTERMOND.Label.Erfolgsgrade')) + '.';
        this.ergebnisText = text + ' ' + this.erfolgsgrade + ' ' + erfolgsgradText;
      }
      
}

class Standardwurf extends Probe {

    wuerfeln() {
        let fertigkeitWertUndModifikator = `${this.fertigkeitWert}${modifikatorString(this.modifikator)}`;
        let roll = new Roll(`2d10+${fertigkeitWertUndModifikator}`).roll();
        this.hoheWuerfelsumme = this.niedrigeWuerfelsumme = roll.total - this.fertigkeitWert - this.modifikator;
        this.probenergebnis = roll.total;
        return roll.toMessage({}, {create: false});
    }

    wurfartString() {
        return game.i18n.localize('SPLITTERMOND.Label.Standardwurf');
    }
}

class Risikowurf extends Probe {

    wuerfeln() {
        let fertigkeitWertUndModifikator = `${this.fertigkeitWert}${modifikatorString(this.modifikator)}`;
        let seed = twist.int();
        twist.seed(seed);
        let roll = new Roll(`4d10kh2+${fertigkeitWertUndModifikator}`).roll();
        twist.seed(seed);
        let roll2 = new Roll(`4d10kl2+${fertigkeitWertUndModifikator}`).roll();
        this.hoheWuerfelsumme = roll.total - this.fertigkeitWert - this.modifikator;
        this.niedrigeWuerfelsumme = roll2.total - this.fertigkeitWert - this.modifikator;
        this.probenergebnis = roll.total;
        return roll.toMessage({}, {create: false});
    }

    wurfartString() {
        return game.i18n.localize('SPLITTERMOND.Label.Risikowurf');
    }
}

class Sicherheitswurf extends Probe {

    wuerfeln() {
        let fertigkeitWertUndModifikator = `${this.fertigkeitWert}${modifikatorString(this.modifikator)}`;
        let roll = new Roll(`2d10kh+${fertigkeitWertUndModifikator}`).roll();
        this.hoheWuerfelsumme = this.niedrigeWuerfelsumme = roll.total - this.fertigkeitWert - this.modifikator;
        this.probenergebnis = roll.total;
        return roll.toMessage({}, {create: false});
    }

    wurfartString() {
        return game.i18n.localize('SPLITTERMOND.Label.Sicherheitswurf');
    }

    patzerUndTriumphBehandeln(options) {
        // Kein Patzer oder Triumph beim Sicherheitswurf (GRW 20 links oben).
    }
}

/***** Schadenswurf *****/

export function schadenswurfNachProbe(probe) {
        console.log('>>>>>> schadenswurfNachProbe: ' + probe.fertigkeitName + ' wgs:' + probe.wgs + ' schaden:' + probe.schaden);
        let formula = probe.schaden.replace(/w/gi, 'd');
        let roll = new Roll(formula).roll();
        const messageData = roll.toMessage({}, {create: false});

        messageData.speaker = ChatMessage.getSpeaker({ actor: probe.actor });
        let schadenswurf = game.i18n.localize('SPLITTERMOND.Label.Schadenswurf');
        let mit = game.i18n.localize('SPLITTERMOND.Label.mit');
        messageData.flavor = `${schadenswurf} ${mit} <b>${probe.fertigkeitName}</b>.`;
        // TODO Schadensreduktion von target berücksichtigen
        messageData.roll.dice[0].options.schadenswurf = {ergebnisText: probe.target.name + ' nimmt ' + roll.total + ' Schaden.'};
        ChatMessage.create(messageData, {rollMode: probe.rollMode});
        // TODO Schaden vom target abziehen
}


/******* Angriff ******/

/**
 * Ein Angriff wird durch Bestätigen des Angriffsdialogs erzeugt.
 * Ein Angriff hat einen Zustand, der bestimmt, was als nächstes passiert.
 * 
 * Einfacher Fall des Ablaufs eines Angriffs:
 * Angriffsprobe ---> (Aktive Abwehr Probe) ---> Schadenswurf
 * 
 */

/*
const AngriffState = { IN_VORBEREITUNG: 0, PROBE_GEWUERFELT: 1, AKTIVE_ABWEHR_GEWUERFELT: 2, SCHADEN_GEWUERFELT: 3 };

class Angriff {

    constructor(actor, waffe, target, form) {
        this.state = AngriffState.IN_VORBEREITUNG;
    }

    continue() {

        switch(this.state) {
            case AngriffState.IN_VORBEREITUNG: {

            }
            default: {

            }            
        }
    }
}

*/
