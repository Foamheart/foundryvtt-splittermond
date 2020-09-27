import { NAHKAMPFFERTIGKEITEN } from "./const.js";
import { modifikatorString } from "./utils.js";
import { SplittermondActor } from "./actor/actor.js";

/**
 * Öffne einen Dialog zur Parametereingabe für eine Fertigkeitsprobe des Actors.
 * 
 * @param {Object} actor     der gewählte Actor 
 * @param {Object} dataset   dataset aus Charakterbogen des Actors
 */
export function oeffneDialogFertigkeitsprobe(actor, dataset) {

    if (dataset.probe === 'fertigkeit') {
        starteFertigkeitsprobe(actor, dataset);
    } else if (dataset.probe === 'kampffertigkeit') {
        starteAngriff(actor, dataset);
    }
}

/**
 * Wiederbelebung des Probenkontext aus dem Chat.
 * 
 * @param {Object} data     JSON-Datenobjekt
 */
export function createProbenkontext(data, message) {
    const probenkontext = Probenkontext.fromData(duplicate(data));
    probenkontext.message = message;
    return probenkontext;
}

// Einfache Probe gegen festzulegende Schwierigkeit (ohne Gegner)
// TODO Fertigkeitsprobe mit Gegner (Duell)
function starteFertigkeitsprobe(actor, dataset) {

    // TODO Behinderung berücksichtigen (siehe GRW 165 links)
    const fertigkeit = {key: dataset.fertigkeit, name: dataset.name, wert: Number(dataset.wert), punkte: Number(dataset.fp)};
    new Fertigkeitenprobe(actor, fertigkeit).start();
}

function starteAngriff(actor, dataset) {

    // TODO Tickzuschlag berücksichtigen (siehe GRW 165 links)
    
    const targets = Array.from(game.user.targets);
    if (targets.length !== 1) {
        ui.notifications.info("Bitte erst genau 1 Ziel für den Angriff markieren."); // TODO Localize
        return;
    }
    const target = targets[0].actor;
    const fertigkeit = {key: dataset.fertigkeit, wert: Number(dataset.wert), punkte: Number(dataset.fp)};
    const waffe = {name: dataset.name, wgs: Number(dataset.wgs), schaden: dataset.schaden};

    const angriff = new Angriff(actor, target, fertigkeit, waffe);
    angriff.start();
}

const WURFART = {
    PROBE: 0,
    SCHADENSWURF: 1,
    PATZERWURF: 2
}

/**
 * 
 * Kontext in dem eine Probenwurf absolviert wird.
 * Hat einen eigenen Dialog zur Parametrisierung der Probe.
 * Bestimmt welche Konsequenzen aus der Probe entstehen 
 * und verarbeitet das Probenergebnis.
 * 
 */
class Probenkontext { // "Abstrakte" Oberklasse

    constructor() {
        this._buttons = {};
    }

    get actor() {
        return this._actor;
    }

    get actorDD() {
        return this.actor.data.data;
    }

    
    /**
     * Die ChatMessage welche diese Probenkontext-Instanz wiederbelebt hat.
     * Erhält bei einer Änderung des Probenkontext ein Update.
     * 
     * @param {ChatMessage} message
     */
    set message(message) {
        this._message = message;
    }

    async _updateMessage() {
        await this._message.setFlag('splittermond', 'kontext', this.toJSON());
    }

    start() {
        this._baueUndOeffneDialog();
    }

    async _baueUndOeffneDialog() {
        // In Unterklasse überschreiben.
    }
    
    _oeffneDialog(title, html) {
        let d = new Dialog({
            title: title,
            content: html,
            buttons: {
             standard: {
              label: '<b>' + game.i18n.localize('SPLITTERMOND.Label.Standardwurf') + '</b>',
              callback: html => this._wuerfleProbe(Standardwurf, html[0].querySelector("form"))
             },
             risiko: {
              label: game.i18n.localize('SPLITTERMOND.Label.Risikowurf'),
              callback: html => this._wuerfleProbe(Risikowurf, html[0].querySelector("form"))
             },
            sicherheit: {
             label: game.i18n.localize('SPLITTERMOND.Label.Sicherheitswurf'),
             callback: html => this._wuerfleProbe(Sicherheitswurf, html[0].querySelector("form"))
            }
           },
            default: 'standard',
            close: () => this._onDialogClosed()
           });
        d.render(true);
    }

    _wuerfleProbe(className, form) {
        this._probenwurfVorbereiten(form)
        this._probeAusfuehren(className);
        this._probenergebnisVerarbeiten();                
    }

    _probenwurfVorbereiten(form) {
        // In Unterklasse überschreiben.
    }

    _probeAusfuehren(className) {
        this._probe = new className(this._fertigkeit.wert, this._fertigkeit.fp, this._modifikator);
        this._probe.wuerfeln();
    }

    get probenergebnis() {
        return this._probe.ergebnis(this._schwierigkeit);
    }

    _probenergebnisVerarbeiten() {
        // In Unterklasse überschreiben.
    }

    _createRollMessage(roll, flavor, wurfart) {
        const messageData = roll.toMessage({}, {create: false});
        messageData.speaker = ChatMessage.getSpeaker({ actor: this.actor });
        messageData.flavor = flavor; 
        // Übergabe des Probenkontext an die ChatMessage.
        setProperty(messageData, 'flags.splittermond.wurfart', wurfart);
        setProperty(messageData, 'flags.splittermond.kontext', this.toJSON());
        ChatMessage.create(messageData, {rollMode: this.rollMode});
    }
    
    _createRollTableMessage(table, roll, results) {
        const messageData = {};
        messageData.speaker = ChatMessage.getSpeaker({ actor: this.actor });
        messageData.flavor = `Wurf auf <b>${table.name}</b>.`;
        setProperty(messageData, 'flags.splittermond.wurfart', WURFART.PATZERWURF);
        setProperty(messageData, 'flags.splittermond.kontext', this.toJSON());
        table.data.description = null;
        table.toMessage(results, {roll: roll, messageData: messageData, messageOptions: {rollMode: this.rollMode}});
    }

    _renderChatMessage(html, wurfart) {
        // In Unterklasse überschreiben.
    }

    _renderProbeChatMessage(html) {
        const ergebnis = this.probenergebnis;

        // Einfärbung des Probenergebnisses
        if (ergebnis.kritisch) {
            html.find(".dice-total").addClass(ergebnis.kritisch); 
        } else if (ergebnis.isGelungen) {
            html.find(".dice-total").addClass('gelungen');
        }
        html.find(".ergebnis").text(ergebnis.text);
    }

    // TODO Buttons nur enabled für GM und User des Actor

    _renderButton(html, buttonName, clickFunction) {
        const cssClass = '.' + buttonName;
        const visible = this._buttons[buttonName].visible;
        const disabled = this._buttons[buttonName].clicked;
        const buttonLabel = game.i18n.localize('SPLITTERMOND.Button.' + buttonName);
        html.find('.dice-buttons').append(`<button class="dice-button ${buttonName}">${buttonLabel}</button>`);
        html.find(cssClass).toggle(visible).attr('disabled', disabled).on('click', clickFunction.bind(this, html));
    }

    _renderButtonClicked(html, buttonName) {
        const cssClass = '.' + buttonName;
        html.find(cssClass).attr("disabled", true);
        this._buttons[buttonName].clicked = true;
    }

    _renderButtonVisible(html, buttonName, visible) {
        const cssClass = '.' + buttonName;
        html.find(cssClass).toggle(visible);
        this._buttons[buttonName].visible = visible;

    }

    _onDialogClosed() {
        if (this._probe === undefined) {
            this._onDialogAborted();
        }
    }

    _onDialogAborted() {
        // Kann in Unterklasse überschrieben werden.
    }

    toJSON() {
        return {
            class: this.constructor.name,
            probe: this._probe.toJSON(),
            rollMode: this._rollMode,
            buttons: this._buttons
        }
    }

    static fromData(data) {
        const kontext = PROBENKONTEXTE[data.class]._fromData(data);
        kontext._probe = Probe.fromData(data.probe);
        kontext._rollMode = data.rollMode,
        kontext._buttons = data.buttons;
        return kontext;
    }
}

/**
 * 
 * Einfache Probe gegen festzulegende Schwierigkeit (ohne Gegner)
 * 
 */
class Fertigkeitenprobe extends Probenkontext {

    constructor(actor, fertigkeit) {
        super();
        this._actor = actor;
        this._fertigkeit = fertigkeit;
    }

    async _baueUndOeffneDialog() {
        let dialogData = {
            fertigkeitWert: this._fertigkeit.wert,
            modifikator: 0,
            schwierigkeit: 15,
            rollMode: game.settings.get("core", "rollMode"),
            rollModes: CONFIG.Dice.rollModes,
           };
        
        const title = this.actor.name + ': ' + game.i18n.localize('SPLITTERMOND.Label.Probe') + ' ' + game.i18n.localize('SPLITTERMOND.Label.auf') + ' ' + this._fertigkeit.name;
        const html = await renderTemplate('systems/splittermond/templates/dialog/fertigkeitsprobe-dialog.html', dialogData);
        this._oeffneDialog(title, html);
    }
    
    _probenwurfVorbereiten(form) {
        this._modifikator = Number(form.modifikator.value);
        this._schwierigkeit = Number(form.schwierigkeit.value);
        this._rollMode = form.rollMode.value;
    }

    get rollMode() {
        return this._rollMode;
    }

    // TODO Button für Splitterpunkt aktivieren, wenn <= 3 Punkte zum Erfolg fehlen.

    _probenergebnisVerarbeiten() {
        // TODO Auswirkungen berücksichtigen je nach Fertigkeit (GRW 101 ff) 
        this._createRollMessage(this._probe.roll, this._probeFlavor(), WURFART.PROBE);
    }

    _probeFlavor() {
        let auf = game.i18n.localize('SPLITTERMOND.Label.auf');
        let gegen = game.i18n.localize('SPLITTERMOND.Label.gegen');
        return `${this._probe.wurfartLabel} ${auf} <b>${this._fertigkeit.name}</b> ${gegen} <b>${this._schwierigkeit}</b>.`;
    }

    /*** ChatMessage Rendering ***/

    // Wird aufgerufen von Hook "renderChatMessage"
    renderChatMessage(html) {
        this._renderProbeChatMessage(html);
    }

    toJSON() {
        return mergeObject(super.toJSON(), {
            actor: this._actor.toJSON(),
            fertigkeit: this._fertigkeit,
            modifikator: this._modifikator,
            schwierigkeit: this._schwierigkeit
        });
    }

    static _fromData(data) {
        const kontext = new this();
        kontext._actor = new SplittermondActor(data.actor);
        kontext._fertigkeit = data.fertigkeit;
        kontext._modifikator = data.modifikator;
        kontext._schwierigkeit = data.schwierigkeit;
        return kontext;
    }
}

/**
 * 
 * Ein Angriff wird durch Bestätigen des Angriffsdialogs erzeugt.
 * 
 * Einfacher Fall des Ablaufs eines Angriffs:
 * Angriffsprobe ---> (Aktive Abwehr Probe) ---> Schadenswurf
 * 
 */
class Angriff extends Probenkontext {

    constructor(actor, target, fertigkeit, waffe) {
        super();
        this._actor = actor;
        this._target = target;
        this._fertigkeit = fertigkeit;
        this._waffe = waffe;
    }

    get target() {
        return this._target;
    }

    get targetDD() {
        return this._target.data.data;
    }

    async _baueUndOeffneDialog() {
        let dialogData = {
            fertigkeitWert: this._fertigkeit.wert,
            modifikator: 0,
            gegner: this.target.name,
            rollMode: game.settings.get("core", "rollMode"),
            rollModes: CONFIG.Dice.rollModes,
           };
        
        // TODO Auswahl von Meisterschaftsmanövern im Dialog

        const title = this.actor.name + ': ' + game.i18n.localize('SPLITTERMOND.Label.Angriff') + ' ' + game.i18n.localize('SPLITTERMOND.Label.mit') + ' ' + this._waffe.name;
        const html = await renderTemplate('systems/splittermond/templates/dialog/kampffertigkeitsprobe-dialog.html', dialogData);
        this._oeffneDialog(title, html);
    }
    
    _probenwurfVorbereiten(form) {
        this._modifikator = Number(form.modifikator.value);
        this._schwierigkeit = this.targetDD.abgeleiteteWerte.vtd.wert;
        this._rollMode = form.rollMode.value; 
    }

    get rollMode() {
        return this._rollMode; // TODO RollMode des Angriffs bestimmt den RollMode aller weiteren Rolls. Sinnvoll?
    }

    // TODO Button für Splitterpunkt aktivieren, wenn <= 3 Punkte zum Erfolg fehlen.

    _probenergebnisVerarbeiten() {
        // TODO Auswirkungen berücksichtigen (GRW 95) 
        const ergebnis = this.probenergebnis;
        const angriffGelungen = ergebnis.isGelungen;
        this._buttons.patzer = {visible: ergebnis.isPatzer, clicked: false};
        this._buttons.aktiveAbwehr = {visible: angriffGelungen, clicked: false};
        this._buttons.weiter = {visible: angriffGelungen, clicked: false};
        this._buttons.schaden = {visible: false, clicked: false};

        this._createRollMessage(this._probe.roll, this._probeFlavor(), WURFART.PROBE);
        if (!angriffGelungen) {
            this._onAngriffBeendet();
        }
    }

    get probenergebnisNachAbwehr() {
        return this._probe.ergebnis(this._schwierigkeitNachAbwehr);
    }

    _probeFlavor() {
        let angriff = game.i18n.localize('SPLITTERMOND.Label.Angriff')
        let auf = game.i18n.localize('SPLITTERMOND.Label.auf');
        let gegen = game.i18n.localize('SPLITTERMOND.Label.gegen');
        return `${angriff} ${gegen} <b>${this.target.name}</b>: ${this._probe.wurfartLabel} ${auf} <b>${this._waffe.name}</b> ${gegen} <b>${this._schwierigkeit}</b>.`;
    }

    _isNahkampfangriff() {
        return NAHKAMPFFERTIGKEITEN.includes(this._fertigkeit.key);
    }

    _wuerflePatzer() {
        const tableName = this._isNahkampfangriff() ? 'Patzertabelle Nahkampf' : 'Patzertabelle Fernkampf';
        const table = game.tables.entities.find(t => t.name === tableName);
        const {roll, results} = table.roll();

        // TODO Auswirkungen des Patzer verarbeiten

        this._createRollTableMessage(table, roll, results);
        this._onAngriffBeendet();
    }

    _wuerfleSchaden() {
        // TODO Freie Manöver Auswahldialog (falls Erfolgsgrade übrig sind)
        // TODO Angesagte Meisterschaftsmanöver verarbeiten (mit Erfolgsgraden verrechnen)
        // TODO Prüfen, ob probenergebnisNachAbwehr vorliegt

        const formula = this._waffe.schaden.replace(/w/gi, 'd');
        const roll = new Roll(formula).roll();

        this._verursachterSchaden = Math.max(0, roll.total - this.targetDD.sr);
        // TODO Schaden vom target abziehen

        this._createRollMessage(roll, this._schadenFlavor(), WURFART.SCHADENSWURF);
        this._onAngriffBeendet();
    }

    _schadenFlavor() {
        const schadenswurf = game.i18n.localize('SPLITTERMOND.Label.Schadenswurf');
        const mit = game.i18n.localize('SPLITTERMOND.Label.mit');
        return `${schadenswurf} ${mit} <b>${this._waffe.name}</b>.`;
    }

    _onAngriffBeendet() {
        // TODO Abschließende Dinge tun
        // TODO wgs auf Tickleiste addieren
    }

    /*** ChatMessage Rendering ***/

    // Wird aufgerufen von Hook "renderChatMessage"
    renderChatMessage(html, wurfart) {
        switch(wurfart) {
            case WURFART.PROBE: {
                this._renderProbeChatMessage(html);
                break;
            }
            case WURFART.SCHADENSWURF: {
                this._renderSchadenswurfChatMessage(html);
                break;
            }
            case WURFART.PATZERWURF: {
                this._renderPatzerwurfChatMessage(html);
                break;
            }
            default: {
                console.log(`>>> Error in Angriff.renderChatMessage wurfart=${wurfart}`);
            }
        }
    }

    _renderProbeChatMessage(html) {
        super._renderProbeChatMessage(html);
        this._renderButton(html, 'patzer', this._onClickPatzer);
        this._renderButton(html, 'aktiveAbwehr', this._onClickAktiveAbwehr);
        this._renderButton(html, 'weiter', this._onClickWeiter);
        this._renderButton(html, 'schaden', this._onClickSchaden);
    }

    _renderPatzerwurfChatMessage(html) {
        // TODO Zusätzliche Textausgabe?
    }

    _renderSchadenswurfChatMessage(html) {
        // TODO Localize
        const text = this.target.name + ' nimmt ' + this._verursachterSchaden + ' Schaden.'; 
        html.find(".konsequenz").toggle(true).text(text);        
    }

    // TODO Button: Splitterpunkt einsetzen für 3 Punkte Bonus auf Angriff?
    // TODO Button: Splitterpunkt einsetzen für 3 Punkte Bonus auf Widerstandswert?
    
    _onClickPatzer(html) {
        this._renderButtonClicked(html, 'patzer');
        this._updateMessage();
        this._wuerflePatzer();
    }
      
    _onClickAktiveAbwehr(html) {
        this._renderButtonClicked(html, 'aktiveAbwehr');
        this._renderButtonVisible(html, 'weiter', false);
        this._updateMessage();
        const aktiveAbwehr = new AktiveAbwehr(this);
        aktiveAbwehr.start();
    }
      
    _onClickWeiter(html) {
        this._renderButtonClicked(html, 'weiter');
        this._renderButtonVisible(html, 'aktiveAbwehr', false);
        this._renderButtonVisible(html, 'schaden', true);
        this._updateMessage();
    }
    
    _onClickSchaden(html) {
        this._renderButtonClicked(html, 'schaden');
        this._updateMessage();
        this._wuerfleSchaden();
    }
    
    toJSON() {
        return mergeObject(super.toJSON(), {
            actor: this._actor.toJSON(),
            target: this._target.toJSON(),
            fertigkeit: this._fertigkeit,
            waffe: this._waffe,
            modifikator: this._modifikator,
            schwierigkeit: this._schwierigkeit,
            schwierigkeitNachAbwehr: this._schwierigkeitNachAbwehr,
            verursachterSchaden: this._verursachterSchaden
        });
    }

    static _fromData(data) {
        const kontext = new this();
        kontext._actor = new SplittermondActor(data.actor);
        kontext._target = new SplittermondActor(data.target);
        kontext._fertigkeit = data.fertigkeit;
        kontext._waffe = data.waffe;
        kontext._modifikator = data.modifikator;
        kontext._schwierigkeit = data.schwierigkeit;
        kontext._schwierigkeitNachAbwehr = data.schwierigkeitNachAbwehr;
        kontext._verursachterSchaden = data.verursachterSchaden;
        return kontext;
    }
}

const AKTIVE_ABWEHR_SCHWIERIGKEIT = 15;
const AKTIVE_ABWEHR_DAUER = 3;
const AKTIVE_ABWEHR_KONSEQUENZ = {
    ABWEHR_MISSLUNGEN: 0,
    ABWEHR_GELUNGEN: 1,
    ANGRIFF_PARIERT: 2
}

/**
 * 
 * Aktive Abwehr als Folge eines Angriffs.
 * 
 */
class AktiveAbwehr extends Probenkontext {

    constructor(angriff) {
        super();
        this._angriff = angriff;
    }

    get actor() {
        return this._angriff.target;
    }

    get target() {
        return this._angriff.actor;
    }

    get rollMode() {
        return this._angriff.rollMode
    }
    
    async _baueUndOeffneDialog() {
        let dialogData = {
            verteidigungsarten: this._ermittleVerteidigungsarten(),
            modifikator: 0,
            schwierigkeit: AKTIVE_ABWEHR_SCHWIERIGKEIT
           };
        
        const title = this.actor.name + ': ' + game.i18n.localize('SPLITTERMOND.Label.AktiveAbwehr');
        const html = await renderTemplate('systems/splittermond/templates/dialog/aktive-abwehr-dialog.html', dialogData);
        this._oeffneDialog(title, html);
    }

    _ermittleVerteidigungsarten() {
        this._verteidigungsarten = []; 
        // TODO Verteidigung gegen Fernkampf und Zauber nur mit Schild oder Akrobatik möglich (GRW 163 rechts)
        let items = this.actor.nahkampfItems(); 
        items.forEach(item => this._verteidigungsarten.push(item));
        this._verteidigungsarten.push({type: 'akrobatik', name: game.i18n.localize('SPLITTERMOND.Fertigkeit.akrobatik.name')});
        return this._verteidigungsarten;
    }

    _onDialogAborted() {
        // Kann vorkommen, wenn z.B. aus Versehen geklickt wurde.
        // TODO Am besten den "Aktive Abwehr"-Button in der Angriff-Message wieder aktivieren.
        // TODO Können wir uns das Message-DOM im Probenkontext speichern? Oder besser einen Pointer auf die Message? 
    }

    _probenwurfVorbereiten(form) {
        this._fertigkeit = {};
        const verteidigungsart = this._verteidigungsarten[form.verteidigungsart.selectedIndex];
        if (verteidigungsart.type === 'akrobatik') {
            this._fertigkeit.key = 'akrobatik';
            this._fertigkeit.name = game.i18n.localize('SPLITTERMOND.Fertigkeit.akrobatik.name');
            this._fertigkeit.wert = this.actorDD.fertigkeiten.akrobatik.wert;
            this._fertigkeit.fp = this.actorDD.fertigkeiten.akrobatik.fp;
        } else if (verteidigungsart.type === 'schild') {
            let item = verteidigungsart;
            const kampffertigkeit = item.data.kampffertigkeit.key;
            const fp = item.data.kampffertigkeit.fp;
            const attribut1 = this.actorDD.attribute.int; // INT
            const attribut2 = this.actorDD.attribute.sta; // STÄ
            this._fertigkeit.key = kampffertigkeit;
            this._fertigkeit.name = item.name;
            this._fertigkeit.wert = fp + attribut1.wert + attribut2.wert + item.data.kampffertigkeit.mod;
            this._fertigkeit.fp = fp;
        } else { // Verteidigung mit Waffe
            const item = verteidigungsart;
            this._fertigkeit.key = item.data.kampffertigkeit.key;
            this._fertigkeit.name = item.name;
            this._fertigkeit.wert = item.data.kampffertigkeit.wert;
            this._fertigkeit.fp = item.data.kampffertigkeit.fp;
        }
        this._modifikator = Number(form.modifikator.value);
        this._schwierigkeit = AKTIVE_ABWEHR_SCHWIERIGKEIT;
        this._dauer = AKTIVE_ABWEHR_DAUER;
    }

    // (siehe GRW 163 rechts)
    _probenergebnisVerarbeiten() {
        
        const ergebnis = this.probenergebnis;
        this._buttons.aktiveAbwehr = {visible: false, clicked: false};
        this._buttons.weiter = {visible: false, clicked: false};
        this._buttons.patzer = {visible: ergebnis.isPatzer, clicked: false};
        this._buttons.schaden = {visible: false, clicked: false};

        this._angriff._schwierigkeitNachAbwehr = this._angriff._schwierigkeit;

        // (siehe GRW 138 links)
        switch(ergebnis.auswirkung) {
            case PROBENAUSWIRKUNG.VERHEEREND_MISSLUNGEN: {
                if (this._fertigkeit.key == 'akrobatik') {
                    // Der Abenteurer stürzt hart auf empfindliche Körperteile (2W6 Schaden) und gilt als liegend
                    // TODO Schaden und Zustand
                } else {
                    // Die Aktive Abwehr misslingt nicht nur, darüber hinaus muss auf der Patzertabelle (S. 172) gewürfelt werden.
                    this._buttons.patzer.visible = true;
                }
                break;
            }
            case PROBENAUSWIRKUNG.SCHWER_MISSLUNGEN:
            case PROBENAUSWIRKUNG.MISSLUNGEN: {
                // Die Aktive Abwehr misslingt.
                break;
            }
            case PROBENAUSWIRKUNG.KNAPP_MISSLUNGEN: {
                // Der Abenteurer erhält einen Bonus in Höhe von 1 Punkt auf seinen Widerstandswert, 
                // überanstrengt sich aber dabei und erleidet 1W6 Punkte Betäubungsschaden.
                this._angriff._schwierigkeitNachAbwehr += 1;
                // TODO Betäubungsschaden abziehen
                break;
            }
            case PROBENAUSWIRKUNG.KNAPP_GELUNGEN:
            case PROBENAUSWIRKUNG.GELUNGEN:
            case PROBENAUSWIRKUNG.GUT_GELUNGEN: {
                // Der Abenteurer erhält einen Bonus in Höhe von 1 Punkt auf seinen Widerstandswert und 1 weiteren Punkt für jeden erzielten Erfolgsgrad.
                this._angriff._schwierigkeitNachAbwehr += 1 + this._probe._erfolgsgrade;
                break;
            }
            case PROBENAUSWIRKUNG.HERAUSRAGEND_GELUNGEN: {
                // Der Abenteurer erhält nicht nur den erzielten Bonus, sondern spart 1 Tick bei der Reaktion ein (sie dauert also nur 2 statt wie üblich 3 Ticks).
                this._angriff._schwierigkeitNachAbwehr += 1 + this._probe._erfolgsgrade;
                this._dauer -= 1;
                break;
            }
            default: {
                console.log(">>> Error in AktiveAbwehr._probenergebnisVerarbeiten()");
                return;
            }
        }

        console.log('Neue Angriff-Schwierigkeit: ' + this._angriff._schwierigkeitNachAbwehr);

        // TODO Buttons für Splitterpunkte aktivieren: "Bonus auf Probe" und "Widerstandswert erhöhen" wenn <= 6 Punkte zum Erfolg fehlen

        // TODO: (GRW 138 links unten) Durch eine Aktive Abwehr kann nie ein Wurf auf eine Patzertabelle erzwungen werden. Bedeutet?
        if (ergebnis.isGelungen) {
            // Eine gelungene AktiveAbwehr hat die Schwierigkeit des Angriffs erhöht. Deshalb muss die Angriffsprobe neu ausgewertet werden:
            const angriff_ergebnis = this._angriff.probenergebnisNachAbwehr;
            // TODO 'Neue Verteidigung: X'
            if (angriff_ergebnis.isGelungen) {
                this._konsequenz = AKTIVE_ABWEHR_KONSEQUENZ.ABWEHR_GELUNGEN;
                this._buttons.schaden.visible = true;
            } else {
                this._konsequenz = AKTIVE_ABWEHR_KONSEQUENZ.ANGRIFF_PARIERT;
            }
        } else  {
            this._konsequenz = AKTIVE_ABWEHR_KONSEQUENZ.ABWEHR_MISSLUNGEN;
            this._buttons.schaden.visible = true;
        }
        this._createRollMessage(this._probe.roll, this._probeFlavor(), WURFART.PROBE);
    }

    _konsequenzText() {
        var text;
        switch(this._konsequenz) {
            case AKTIVE_ABWEHR_KONSEQUENZ.ABWEHR_GELUNGEN: {
                text = 'Neue Verteidigung: ' + this._angriff._schwierigkeitNachAbwehr;
                break;
            }
            case AKTIVE_ABWEHR_KONSEQUENZ.ANGRIFF_PARIERT: {
                text = 'Angriff pariert!';
                break;
            }
            default: {
                text = 'Abwehr fehlgeschlagen.';
            }
        }
        return text;
    }

    _probeFlavor() {
        let aktiveAbwehr = game.i18n.localize('SPLITTERMOND.Label.AktiveAbwehr');
        let auf = game.i18n.localize('SPLITTERMOND.Label.auf');
        let gegen = game.i18n.localize('SPLITTERMOND.Label.gegen');
        return `${aktiveAbwehr} ${gegen} <b>${this.target.name}</b>: ${this._probe.wurfartLabel} ${auf} <b>${this._fertigkeit.name}</b> ${gegen} <b>${this._schwierigkeit}</b>.`;
    }

    _wuerflePatzer() {
        const tableName = 'Patzertabelle Nahkampf';
        const table = game.tables.entities.find(t => t.name === tableName);
        const {roll, results} = table.roll();

        // TODO Auswirkungen des Patzer verarbeiten

        this._createRollTableMessage(table, roll, results);
    }

    /*** ChatMessage Rendering ***/

    // Wird aufgerufen von Hook "renderChatMessage"
    renderChatMessage(html, wurfart) {
        switch(wurfart) {
            case WURFART.PROBE: {
                this._renderProbeChatMessage(html);
                break;
            }
            case WURFART.PATZERWURF: {
                this._renderPatzerwurfChatMessage(html);
                break;
            }
            default: {
                console.log(`>>> Error in AktiveAbwehr.renderChatMessage wurfart=${wurfart}`);
            }
        }
    }

    _renderProbeChatMessage(html) {
        super._renderProbeChatMessage(html);
        html.find(".konsequenz").toggle(true).text(this._konsequenzText());        
        this._renderButton(html, 'patzer', this._onClickPatzer);
        this._renderButton(html, 'schaden', this._onClickSchaden);
    }

    _renderPatzerwurfChatMessage(html) {
        // TODO Zusätzliche Textausgabe?
    }

    _onClickPatzer(html) {
        this._renderButtonClicked(html, 'patzer');
        this._updateMessage();
        this._wuerflePatzer();
    }
      
    _onClickSchaden(html) {
        this._renderButtonClicked(html, 'schaden');
        this._updateMessage();
        this._angriff._wuerfleSchaden(); // Kontrollfluss geht zurück an Angriff
    }
    
    toJSON() {
        return mergeObject(super.toJSON(), {
            angriff: this._angriff.toJSON(),
            fertigkeit: this._fertigkeit,
            modifikator: this._modifikator,
            schwierigkeit: this._schwierigkeit,
            dauer: this._dauer,
            konsequenz: this._konsequenz
        });
    }

    static _fromData(data) {
        const angriff = Angriff.fromData(data.angriff);
        const kontext = new this(angriff);
        kontext._fertigkeit = data.fertigkeit;
        kontext._modifikator = data.modifikator;
        kontext._schwierigkeit = data.schwierigkeit;
        kontext._dauer = data.dauer;
        kontext._konsequenz = data.konsequenz;
        return kontext;
    }
}

const PROBENKONTEXTE = {Fertigkeitenprobe, Angriff, AktiveAbwehr}

/**
 * 
 *  Probenarten
 * 
 */

class Probe { // "Abstrakte" Oberklasse

    constructor(fertigkeitWert, fertigkeitPunkte, modifikator) {
        this._fertigkeitWert = fertigkeitWert;
        this._fertigkeitPunkte = fertigkeitPunkte;
        this._modifikator = modifikator;
    }

    wuerfeln() {
        this._roll = this._wuerfeln();
    }

    get roll() {
        return this._roll;
    }

    // Eigene Methode, damit das Probenergebnis nach aktiver Abwehr neu berechnet werden kann
    ergebnis(schwierigkeit) {
        // Erfolgsgrade (GRW 17)
        this._differenz = this._roll.total - schwierigkeit;
        this._erfolgsgrade = Math.floor(this._differenz/3);
    
        // Probe ohne Fertigkeitspunkte (GRW 18 links oben)
        if (this._fertigkeitPunkte == 0) {
            this._erfolgsgrade = Math.min(this._erfolgsgrade, 0);
        }
    
        this._patzerUndTriumphBehandeln();

        return new Probenergebnis(this._kritisch, this._differenz, this._erfolgsgrade);
    }

    _wuerfeln() {
        // In Unterklasse implementiert. Liefert eine Roll-Instanz zurück.
    }

    get wurfartLabel() {
        return game.i18n.localize('SPLITTERMOND.Label.' + this.constructor.name);
    }

    _patzerUndTriumphBehandeln() {
        // Patzer und Triumph (GRW 18)
        if (this._niedrigeWuerfelsumme <= 3) {
            this._kritisch = 'patzer';
            this._erfolgsgrade -= 3;
            this._erfolgsgrade = Math.min(this._erfolgsgrade, -1);
        } else if (this._hoheWuerfelsumme >= 19) {
            this._kritisch = 'triumph';
            if (this._differenz >= 0) {
                this._erfolgsgrade += 3;
            }
        }
    }

    // Für Splitterpunkteinsatz (nur NACH dem Würfeln!)
    addProbenbonus(bonus) {
        this._roll.formula += modifikatorString(bonus);
        this._roll.total += bonus;
    }

    toJSON() {
        return {
            class: this.constructor.name,
            fertigkeitWert: this._fertigkeitWert,
            fertigkeitPunkte: this._fertigkeitPunkte,
            modifikator: this._modifikator,
            roll: this._roll.toJSON(),
            niedrigeWuerfelsumme: this._niedrigeWuerfelsumme,
            hoheWuerfelsumme: this._hoheWuerfelsumme,
            kritisch: this._kritisch,
            differenz: this._differenz,
            erfolgsgrade: this._erfolgsgrade,
        }
    }

    static fromData(data) {
        const probe = new PROBENARTEN[data.class](data.fertigkeitWert, data.fertigkeitPunkte, data.modifikator);
        probe._roll = Roll.fromData(data.roll);
        probe._niedrigeWuerfelsumme = data.niedrigeWuerfelsumme;
        probe._hoheWuerfelsumme = data.hoheWuerfelsumme;
        probe._kritisch = data.kritisch;
        probe._differenz = data.differenz;
        probe._erfolgsgrade = data.erfolgsgrade;
        return probe;
    }
}

class Standardwurf extends Probe {

    _wuerfeln() {
        let fertigkeitWertUndModifikator = `${this._fertigkeitWert}${modifikatorString(this._modifikator)}`;
        let roll = new Roll(`2d10+${fertigkeitWertUndModifikator}`).roll();
        this._hoheWuerfelsumme = this._niedrigeWuerfelsumme = roll.total - this._fertigkeitWert - this._modifikator;
        return roll;
    }
}

class Risikowurf extends Probe {

    _wuerfeln() {
        let fertigkeitWertUndModifikator = `${this._fertigkeitWert}${modifikatorString(this._modifikator)}`;
        let seed = twist.int();
        twist.seed(seed);
        let roll = new Roll(`4d10kh2+${fertigkeitWertUndModifikator}`).roll();
        twist.seed(seed);
        let roll2 = new Roll(`4d10kl2+${fertigkeitWertUndModifikator}`).roll();
        this._hoheWuerfelsumme = roll.total - this._fertigkeitWert - this._modifikator;
        this._niedrigeWuerfelsumme = roll2.total - this._fertigkeitWert - this._modifikator;
        return roll;
    }
}

class Sicherheitswurf extends Probe {

    _wuerfeln() {
        let fertigkeitWertUndModifikator = `${this._fertigkeitWert}${modifikatorString(this._modifikator)}`;
        let roll = new Roll(`2d10kh+${fertigkeitWertUndModifikator}`).roll();
        this._hoheWuerfelsumme = this._niedrigeWuerfelsumme = roll.total - this._fertigkeitWert - this._modifikator;
        return roll;
    }

    _patzerUndTriumphBehandeln() {
        // Kein Patzer oder Triumph beim Sicherheitswurf (GRW 20 links oben).
    }
}


const PROBENARTEN = { Standardwurf, Risikowurf, Sicherheitswurf }

const PROBENAUSWIRKUNG = {
    HERAUSRAGEND_GELUNGEN: 0,
    GUT_GELUNGEN: 1,
    GELUNGEN: 2,
    KNAPP_GELUNGEN: 3,
    KNAPP_MISSLUNGEN: 4,
    MISSLUNGEN: 5,
    SCHWER_MISSLUNGEN: 6,
    VERHEEREND_MISSLUNGEN: 7
}

const PROBENAUSWIRKUNG_LABEL = [
    'SPLITTERMOND.Label.HerausragendGelungen',
    'SPLITTERMOND.Label.GutGelungen',
    'SPLITTERMOND.Label.Gelungen',
    'SPLITTERMOND.Label.KnappGelungen',
    'SPLITTERMOND.Label.KnappMisslungen',
    'SPLITTERMOND.Label.Misslungen',
    'SPLITTERMOND.Label.SchwerMisslungen',
    'SPLITTERMOND.Label.VerheerendMisslungen'
]

class Probenergebnis {

    constructor(kritisch, differenz, erfolgsgrade) {
        this._kritisch = kritisch;
        this._differenz = differenz;
        this._erfolgsgrade = erfolgsgrade;
    }

    get kritisch() {
        return this._kritisch;
    }

    get erfolgsgrade() {
        return this._erfolgsgrade;
    }

    get auswirkung() {
        var auswirkung;
        if (this._erfolgsgrade >= 5) {
          auswirkung = PROBENAUSWIRKUNG.HERAUSRAGEND_GELUNGEN;
        } else if (this._erfolgsgrade >= 3) {
          auswirkung = PROBENAUSWIRKUNG.GUT_GELUNGEN;
        } else if (this._erfolgsgrade >= 1) {
          auswirkung = PROBENAUSWIRKUNG.GELUNGEN;
        } else if (this._erfolgsgrade == 0 && this.isGelungen) {
          auswirkung = PROBENAUSWIRKUNG.KNAPP_GELUNGEN;
        } else if (this._erfolgsgrade == 0) {
          auswirkung = PROBENAUSWIRKUNG.KNAPP_MISSLUNGEN;
        } else if (this._erfolgsgrade >= -2) {
          auswirkung = PROBENAUSWIRKUNG.MISSLUNGEN;
        } else if (this._erfolgsgrade >= -4) {
          auswirkung = PROBENAUSWIRKUNG.SCHWER_MISSLUNGEN;
        } else {
          auswirkung = PROBENAUSWIRKUNG.VERHEEREND_MISSLUNGEN;
        }
        return auswirkung;
    }

    get text() {
        let text = '';
        if (this.isPatzer) {
            text = game.i18n.localize('SPLITTERMOND.Label.Patzer') + '!';
        } else if (this.isTriumph) {
           text = game.i18n.localize('SPLITTERMOND.Label.Triumph') + '!';
        } else {
            text = game.i18n.localize(PROBENAUSWIRKUNG_LABEL[this.auswirkung]) + '.'
        }
        let erfolgsgradText = (Math.abs(this._erfolgsgrade) == 1 ? game.i18n.localize('SPLITTERMOND.Label.Erfolgsgrad') : game.i18n.localize('SPLITTERMOND.Label.Erfolgsgrade')) + '.';
        return text + ' ' + this._erfolgsgrade + ' ' + erfolgsgradText;
    }
    
    get isPatzer() {
        return this._kritisch == 'patzer';
    }

    get isTriumph() {
        return this._kritisch == 'triumph';
    }

    get isGelungen() {
        return this._differenz >= 0 && !this.isPatzer;
    }

    toJSON() {
        return {
            kritisch: this._kritisch,
            differenz: this._differenz,
            erfolgsgrade: this._erfolgsgrade
        }
    }

    static fromData(data) {
        return new this(data.kritisch, data.differenz, data.erfolgsgrade);
    }
}