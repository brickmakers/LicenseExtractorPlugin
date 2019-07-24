const usage = require('./constants')

const knownLicenses = {
  getLicenses: () => ({
    MIT: {
      usage: usage.allowed,
      conditions: 'Lizenz und Copyright müssen für das verwendete Projekt müssen einsehbar sein.',
    },
    ISC: {
      usage: usage.allowed,
      conditions: 'Lizenz und Copyright müssen für das verwendete Projekt müssen einsehbar sein.',
    },
    'BSD-3-Clause': {
      usage: usage.allowed,
      conditions: 'Lizenz und Copyright müssen für das verwendete Projekt müssen einsehbar sein. Es darf ohne Schriftliche Erlaubung nicht mit dem Namen des Autors oder Namen der Mitwirkenden beworben werden.',
    },
    'Apache-2.0': {
      usage: usage.allowed,
      conditions: 'Zusätzlich zu Lizenz und Copyright muss bei vorhanden sein einer "NOTICE" Datei, diese auch angehangen werden. Bei Änderungen am Quellcode müssen die Änderungen auch aufgelistet werden.',
    },
    'Apache License, Version 2.0': {
      usage: usage.allowed,
      conditions: 'Zusätzlich zu Lizenz und Copyright muss bei vorhanden sein einer "NOTICE" Datei, diese auch angehangen werden. Bei Änderungen am Quellcode müssen die Änderungen auch aufgelistet werden.',
    },
    'BSD-2-Clause': {
      usage: usage.allowed,
      conditions: 'Lizenz und Copyright müssen für das verwendete Projekt müssen einsehbar sein.',
    },
    'CC-BY-4.0': {
      usage: usage.allowed,
      conditions: 'Lizenz und Copyright. Bei Änderungen am Quellcode müssen die Änderungen auch aufgelistet werden.',
    },
    WTFPL: {
      usage: usage.allowed,
      conditions: 'Do what the fuck you want to ',
    },
    BSD: {
      usage: usage.allowed,
      conditions: 'Lizenz und Copyright vorweisen. Keine Werbung mit den Mitwrikenden oder Autoren ohne Genehmigung.',
    },
    'LGPL-2.1+': {
      usage: usage.forbidden,
      conditions: 'Die verwendete Library muss im ausgelieferten Code oder Programm austauschbar sein. Im Web-Kontext, müsste die Bibliothek daher nicht in Webpack sondern separat ausgeliefert werden.',
    },
    'AFLv2.1': {
      usage: usage.allowed,
      conditions: 'Lizenz und Copyright vorweisen.',
    },
    'Public Domain': {
      usage: usage.allowed,
      conditions: 'Keine',
    },
    'CC0-1.0': {
      usage: usage.allowed,
      conditions: 'Keine',
    },
    'CC-BY-3.0': {
      usage: usage.allowed,
      conditions: 'Namensnennung der Autoren',
    },
    Unlicense: {
      usage: usage.allowed,
      conditions: 'Keine',
    },
    '(GPL-2.0 OR MIT)': {
      usage: usage.allowed,
      conditions: 'Lizenz zwischen MIT und GPLv2 frei wählbar',
    },
    'GNU AGLP v3': {
      usage: usage.forbidden,
      conditions: 'Lizenz und Copyright. Source Code muss offen sein. Wird die Software über ein Netzwerk verteilt, muss auch der Quellcode auf gleicher Art bereitgestellt werden.',
    },
    'GNU GPLv3': {
      usage: usage.forbidden,
      conditions: 'Lizenz und Copyright. Source Code muss offen sein.',
    },
    'GNU LPGLv3': {
      usage: usage.forbidden,
      conditions: 'Lizenz und Copyright. Source Code je nach Projektgröße offen sein.',
    },
    'Microsoft Public License': {
      usage: usage.allowed,
      conditions: 'Lizenz und Copyright.',
    },
    '(MIT OR Apache-2.0)': {
      usage: usage.allowed,
      conditions: "MIT: Lizenz und Copyright müssen für das verwendete Projekt müssen einsehbar sein."
    },
    '(BSD-2-Clause OR MIT OR Apache-2.0)': {
      usage: usage.allowed,
      conditions: "MIT: Lizenz und Copyright müssen für das verwendete Projekt müssen einsehbar sein."
    },
    '(MIT OR CC0-1.0)': {
      usage: usage.allowed,
      condition: "MIT: Lizenz und Copyright müssen für das verwendete Projekt müssen einsehbar sein."
    }
  }),
}
module.exports = knownLicenses
