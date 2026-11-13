/* Avis de voyageurs PUBLIÉS par le guide. Uniquement de vrais avis, reçus puis validés à la main.
 *
 * Pour en ajouter un : une entrée par lieu (clé = id du lieu dans data/lieux.js).
 *   window.AVIS_DATA = {
 *     "100": [
 *       { "auteur": "Prénom N.", "date": "2026-12-02", "note": 5, "texte": "…", "source": "formulaire du site" }
 *     ]
 *   };
 *
 * Pour RECEVOIR des avis : renseigner AVIS_ENVOI_URL ci-dessous avec l'adresse d'un formulaire
 * (Google Forms, Tally, Formspree…). Les marqueurs {lieu}, {note} et {texte} sont remplacés
 * par ce que le visiteur a saisi. Tant que l'adresse est vide, le bouton d'envoi n'apparaît pas.
 */
window.AVIS_DATA = {};
window.AVIS_ENVOI_URL = '';
