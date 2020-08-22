import { modifikatorString } from "../utils.js";

export async function oeffneDialogFertigkeitsprobe(actor, dataset) {

    let dialogData = {
        fertigkeitWert: Number(dataset.wert),
        modifikator: 0,
        schwierigkeit: 15,
        rollMode: game.settings.get("core", "rollMode"),
        rollModes: CONFIG.Dice.rollModes,
       };
    
    const title = actor.name + ': ' + game.i18n.localize('SPLITTERMOND.Label.Probe') + ' ' + game.i18n.localize('SPLITTERMOND.Label.auf') + ' ' + dataset.name;
    const html = await renderTemplate('systems/splittermond/templates/dialog/roll-dialog.html', dialogData);

    let d = new Dialog({
        title: title,
        content: html,
        buttons: {
         standard: {
          label: '<b>' + game.i18n.localize('SPLITTERMOND.Label.Standardwurf') + '</b>',
          callback: html => new Standardwurf(actor, dataset, html[0].querySelector("form")).execute()
         },
         risiko: {
          label: game.i18n.localize('SPLITTERMOND.Label.Risikowurf'),
          callback: html => new Risikowurf(actor, dataset, html[0].querySelector("form")).execute()
         },
        sicherheit: {
         label: game.i18n.localize('SPLITTERMOND.Label.Sicherheitswurf'),
         callback: html => new Sicherheitswurf(actor, dataset, html[0].querySelector("form")).execute()
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

    constructor(actor, dataset, form) {
        this.actor = actor;
        this.fertigkeitName = dataset.name;
        this.fertigkeitWert = Number(dataset.wert);
        this.fertigkeitPunkte = Number(dataset.punkte);
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
        this.probenergebnisText = text + ' ' + this.erfolgsgrade + ' ' + erfolgsgradText;
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
