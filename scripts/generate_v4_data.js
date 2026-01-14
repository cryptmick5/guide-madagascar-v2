const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(__dirname, '../data_rewrite_v4.json');

// --- HELPERS ---
function loadBrowserDataFile(filename, variableName) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) throw new Error(`Fichier introuvable : ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(content, sandbox);
    return sandbox.window[variableName];
}

// --- CONTENT REWRITES (GASIKARA EXPLORER PERSONA) ---
// Format: "Gasikara Explorer" - Immersion, Local Terms (Bajaj, Taxi-brousse), Pedagogical, Honest.
const LIEUX_REWRITES = {
    // DIEGO SUAREZ
    601: "Bienvenue à Diego (Antsiranana), la belle endormie du Nord ! C'est un mélange unique d'histoire coloniale et de douceur de vivre tropicale.\n\n🏙️ **Architecture** : Flânez rue Colbert pour admirer les vieilles bâtisses coloniales, témoins d'une époque révolue.\n🚙 **Transport** : Ici, on se déplace en **Bajaj** (les tuk-tuks jaunes). C'est fun, ça passe partout et ça coûte rien !\n🌅 **Ambiance** : C'est 'Mora Mora' (doucement). Prenez le temps de boire un café en terrasse et de regarder la vie passer.\n\nUne ville authentique qui vous séduira par son charme nostalgique.",
    602: "La Mer d'Émeraude, c'est LA carte postale mauricienne... mais à Madagascar ! Un lagon immense, peu profond, d'un turquoise qui fait mal aux yeux (dans le bon sens).\n\n⛵ **Accès** : On y va en boutre traditionnel depuis Ramena. La traversée est déjà une aventure.\n🐠 **Snorkeling** : L'eau est si claire que vous verrez les poissons depuis le bateau. Parfait pour une initiation.\n🏝️ **Déjeuner** : Grillades de poissons frais sur un îlot désert. Le luxe, le vrai : les pieds dans le sable.\n\n⚠️ Attention au soleil, ça tape fort sur l'eau !",
    603: "Oubliez la roche grise, ici la terre saigne ! Les Tsingy Rouges sont un canyon éphémère sculpté par la pluie dans de la latérite et du grès.\n\n🎨 **Couleurs** : Un dégradé spectaculaire du blanc à l'ocre rouge. C'est le paradis des photographes.\n⏳ **Fragile** : Contrairement aux Tsingy de pierre, ceux-ci sont fragiles. On regarde avec les yeux, on touche pas !\n☀️ **Moment** : Idéal en fin d'après-midi quand le soleil rasant enflamme les couleurs.\n\nUn paysage martien au milieu de la brousse.",
    604: "La Montagne d'Ambre, c'est votre climatiseur naturel ! Une forêt pluviale d'altitude qui tranche avec la chaleur de la côte.\n\n🦎 **Faune** : Cherchez bien, le plus petit caméléon du monde (Brookesia) se cache dans les feuilles mortes.\n💦 **Fraîcheur** : Cascades sacrées et lacs de cratère. Ça fait un bien fou de respirer l'air frais.\n🌿 **Flore** : Des fougères arborescentes géantes comme à l'époque des dinosaures.\n\nPrévoyez un K-way, ici la météo est capricieuse !",
    605: "L'Ankarana, c'est le Mordor version tropicale. Des formations calcaires acérées à perte de vue (les Tsingy) qui cachent un monde souterrain.\n\n🦇 **Grottes** : Explorez des cathédrales souterraines habitées par des colonies de chauves-souris. Indiana Jones, c'est vous !\n🌉 **Pont Suspendu** : Oserez-vous traverser au-dessus du vide ? La vue sur le canyon est imprenable.\n🐒 **Lémuriens** : Les Lémurs couronnés sont chez eux ici. Ils sont curieux, mais gardez vos distances.\n\nC'est physique, il fait chaud, mais c'est inoubliable.",
    606: "Ambanja, c'est la capitale du cacao fin ! Ici, l'air sent le chocolat et l'ylang-ylang. Une étape sensorielle obligatoire.\n\n🍫 **Plantations** : Visitez les champs de cacaoyers sous l'ombrage des grands arbres. C'est ici que naissent les grands crus.\n🚕 **Transport** : Baladez-vous en vélo ou en **Bajaj** à travers les allées de la vallée du Sambirano.\n🌿 **Nature** : Une végétation luxuriante qui change de la savane du nord.\n\nSi vous aimez le chocolat, vous êtes en pèlerinage.",
    607: "Ankify n'est pas qu'un port d'embarquement, c'est un petit village paisible posé sur l'eau.\n\n🚤 **Connexion** : C'est le hub pour aller à Nosy Be. Les vedettes partent d'ici.\n🥥 **Détente** : En attendant le bateau, profitez des petites gargotes qui servent du poisson coco délicieux.\n👀 **Vue** : On aperçoit déjà les îles au loin. L'aventure insulaire commence ici.\n\nSoyez 'Mora Mora' avec les horaires des bateaux, c'est ça les vacances !",
    610: "Les Plantations Millot, c'est l'histoire vivante d'Ambanja. Une institution centenaire qui produit cacao, épices et parfums.\n\n👨‍🌾 **Savoir-faire** : Découvrez comment on transforme la fève brute en or noir. C'est tout un art.\n🌸 **Parfums** : L'Ylang-Ylang embaume l'air. On l'appelle la fleur des fleurs.\n🍽️ **Dégustation** : Le clou du spectacle : goûter le chocolat à la source. Attention, c'est puissant !\n\nUne visite pédagogique passionnante pour comprendre la richesse du terroir malgache.",
    611: "Le Fleuve Sambirano, c'est l'artère vitale de la région. Une balade en pirogue pour déconnecter totalement.\n\n🐊 **Faune** : Ouvrez l'œil, des crocodiles se dorent parfois sur les berges (de loin, c'est mieux !).\n🌳 **Paysage** : Des berges verdoyantes, des oiseaux pêcheurs... c'est le calme absolu.\n🛶 **Authentique** : La pirogue, c'est le moyen de transport local. Laissez-vous glisser au fil de l'eau.\n\nUn moment de pure zénitude au cœur de la nature.",

    // NOSY BE
    201: "Hell-Ville, c'est le cœur bouillonnant de Nosy Be. Une capitale de poche où tout le monde se croise.\n\n🏛️ **Colonial** : Des bâtiments anciens qui ont du cachet, vestiges du passé comptoir de l'île.\n🛒 **Marché** : Le Bazar Be est incontournable. Épices, vanille, artisanat... négociez avec le sourire !\n🍹 **Vie** : C'est animé, bruyant, vivant. C'est là que bat le pouls de l'île.\n\nIdéal pour faire ses emplettes souvenirs et sentir l'atmosphère locale.",
    250: "Nosy Komba, c'est l'île granitique qui veille sur Nosy Be. Ici, pas de voitures, pas de stress, juste la nature.\n\n🐒 **Makis** : Les Lémurs Macaco sont les rois. Ils viendront vous manger des bananes sur l'épaule (photos garanties !).\n🧵 **Artisanat** : Les femmes du village brodent des nappes magnifiques ('Richelieu'). C'est fin et local.\n🚶 **Rando** : Ça grimpe ! Mais la vue depuis le sommet vaut chaque goutte de sueur.\n\nUne parenthèse enchantée où l'homme et l'animal cohabitent.",
    251: "Nosy Tanikely, c'est un aquarium géant... sans les vitres ! Réserve marine protégée, c'est le spot de snorkeling ultime.\n\n🐢 **Tortues** : Elles sont là, tranquilles, à brouter les coraux. Nagez avec elles (sans les toucher !).\n🐠 **Poissons** : Des milliers de poissons colorés dès qu'on met la tête sous l'eau. Même pour les débutants.\n🏝️ **Phare** : Grimpez au vieux phare pour une vue panoramique à 360° sur l'archipel.\n\nPrenez votre masque et tuba, c'est le meilleur film que vous verrez.",
    252: "Le Mont Passot, c'est le balcon de Nosy Be. Le point de rendez-vous obligatoire pour finir la journée en beauté.\n\n🌅 **Sunset** : Le coucher de soleil y est légendaire. Le ciel s'embrase sur l'océan.\n🌋 **Lacs Sacrés** : On domine les lacs de cratère. Attention, ils sont sacrés (et habités par des crocodiles, paraît-il).\n🍹 **Apéro** : Siroter un cocktail en regardant le soleil plonger dans la mer... What else ?\n\nArrivez tôt pour avoir une bonne place !",
    253: "Nosy Iranja, c'est la star d'Instagram. Deux îlots reliés par une langue de sable blanc aveuglant.\n\n🏖️ **Sable** : Une marche sur l'eau (presque) à marée basse. C'est magique.\n🐢 **Ponte** : C'est un lieu de nidification pour les tortues marines. Respectez leur tranquillité.\n💎 **Eau** : Un bleu turquoise impossible à décrire. C'est le paradis, littéralement.\n\nC'est loin (1h30 de bateau), mais c'est l'excursion d'une vie.",
    254: "Lokobe, c'est la forêt originelle de Nosy Be. La jungle comme elle était avant l'homme.\n\n🛶 **Accès** : On y arrive en pirogue à balancier. Silence, on glisse sur l'eau.\n🐍 **Faune** : Boas (gentils), lémuriens nocturnes, caméléons... C'est un festival de biodiversité.\n🌳 **Atmosphère** : Humide, dense, mystérieuse. On se sent tout petit sous les arbres géants.\n\nGuide obligatoire pour voir les animaux camouflés !",
    255: "Andilana, c'est LA plage carte postale du dimanche. La plus belle plage publique de l'île, et de loin.\n\n🌴 **Cadre** : Cocotiers, sable fin, eau calme. Tout y est pour le farniente.\n🎉 **Ambiance** : Le dimanche, c'est la fête ! Musique, grillades, familles... C'est la vie malgache joyeuse.\n🍽️ **Miam** : Mangez des langoustes grillées les pieds dans le sable dans les paillotes.\n\nLe spot parfait pour déconnecter et bronzer 'Tsara'.",

    // TANA
    1: "Le Rova, c'est l'âme de l'Imerina. Perché sur la plus haute colline, il veille sur Tana depuis des siècles.\n\n👑 **Histoire** : Ici vivaient les Rois et Reines. C'est sacré. Écoutez bien les légendes du guide.\n🏙️ **Vue** : Le panorama à 360° sur la capitale est juste dingue. On comprend mieux la ville d'ici.\n🔥 **Résilience** : Reconstruit après l'incendie, c'est un symbole fort pour les Malgaches.\n\nUne montée au ciel pour toucher l'histoire du doigt.",
    2: "Le Marché de la Digue, c'est la caverne d'Ali Baba de l'artisanat. Préparez vos valises, vous allez craquer !\n\n🎁 **Choix** : Vannerie, bois sculpté, pierres, broderie... Tout le savoir-faire malgache est ici.\n🤝 **Négociation** : C'est le jeu ! Discutez les prix avec le sourire, c'est l'échange qui compte.\n🎨 **Couleurs** : C'est visuellement superbe. Même juste pour les yeux, ça vaut le détour.\n\nLe passage obligé avant de reprendre l'avion pour les cadeaux.",

    // MAJUNGA
    31: "Le Cirque Rouge, c'est de la géologie psychédélique ! Un amphithéâtre naturel où la terre a toutes les couleurs.\n\n🌈 **Palette** : 12 nuances d'ocre et de rouge. C'est comme si un peintre géant avait renversé ses pots.\n🦕 **Fossiles** : On trouve parfois des traces du passé. C'est une terre ancienne.\n☀️ **Timing** : Allez-y pour le coucher du soleil, quand la roche s'embrase. Magique.\n\nUne balade facile pour un spectacle grandiose.",
    34: "Le Bord de Majunga, c'est le salon de la ville. Le soir, tout le monde est là. C'est immanquable.\n\n🍢 **Brochettes** : Les meilleures de Madagascar (si, si !). Asseyez-vous, commandez, savourez.\n🌳 **Baobab** : Le grand-père de la ville. Un baobab géant au milieu du rond-point. Respect.\n❄️ **Frais** : On vient chercher la brise marine après la chaleur de la journée. Ambiance 'cool Raoul'.\n\nC'est ça la vraie vie majungaise : simple, conviviale et dehors.",
};

const ITINERAIRES_REWRITES = {
    // CIRCUIT NORD
    "circuit-nord": {
        description: "L'aventure ultime du Nord ! De la jungle dense aux lagons turquoises, c'est le best-of de Madagascar en mode 4x4.",
        etapes: {
            1: "Tonga soa à Diego ! La Havane malgache vous accueille. On pose les valises, on hume l'air marin et on file direct voir la baie. C'est parti !",
            2: "Cap sur la Mer d'Émeraude. Imaginez une piscine olympique géante remplie de Menthe à l'eau. Bateau, poisson grillé, sieste. La définition du bonheur.",
            3: "Direction les Tsingy Rouges. On quitte la côte pour la brousse. Le paysage devient martien. Préparez les cartes SD, ça va flasher !",
            4: "On monte au frais à la Montagne d'Ambre. Changement de décor : forêt humide, cascades, et nos premiers lémuriens. Respirez, ça sent l'humus et l'aventure.",
            5: "Expédition vers la Baie des Courriers. C'est sauvage, c'est beau, c'est le bout du monde. Un spot secret pour se sentir seul au monde.",
            6: "Route vers le sud, direction l'Ankarana. Les fameux Tsingy gris, tranchants comme des rasoirs. Un paysage de pierre unique au monde.",
            7: "Journée Indiana Jones ! On explore les grottes et les ponts suspendus de l'Ankarana. Frontale vissée sur la tête, on part à la rencontre des chauves-souris.",
            8: "Escale à Ambilobe. C'est le carrefour du Nord. Le marché est un souk vibrant de couleurs. On y sent l'âme du peuple Antakarana.",
            9: "La Vallée du Sambirano. On entre dans le jardin de Madagascar. Cacao, vanille, poivre... vos narines vont être en fête. Visite de plantation obligatoire !",
            10: "Dernier trajet vers le port d'Ankify. On dit au revoir à la Grande Terre. La vedette nous attend pour glisser vers Nosy Be. Veloma !"
        }
    },
    // CIRCUIT CACAO
    "circuit-cacao": {
        description: "La route des saveurs. Une immersion gourmande au pays du chocolat et des épices. Pour les épicuriens curieux.",
        etapes: {
            1: "On descend la RN6. La route est... une aventure en soi ! On regarde les paysages défiler, on s'arrête manger des brochettes. C'est le 'Road Trip' malgache.",
            2: "Journée Chocolat ! On visite les plantations mythiques. De la cabosse à la fève, vous saurez tout. Dégustation incluse (évidemment !).",
            3: "Farniente à Ankify. Après la route, la pause. On regarde la mer, on mange des fruits de mer, on ne fait RIEN. C'est ça aussi les vacances.",
            4: "Pirogue sur le fleuve. On remonte le courant comme les explorateurs d'antan. La nature est reine, on se fait tout petit et on observe.",
            5: "C'est l'heure du choix ! Retour vers Diego pour boucler la boucle ou cap sur Nosy Be pour continuer la fête. Dans les deux cas, vous repartez chargés d'épices."
        }
    },
    // CIRCUIT NOSY BE
    "circuit-nosybe": {
        description: "L'Île aux Parfums en mode VIP. Plages de rêve, fonds marins exceptionnels et ambiance tropicale chic.",
        etapes: {
            1: "Atterrissage à Fascene. La chaleur humide et l'odeur d'ylang-ylang vous sautent au visage. Bienvenue sous les tropiques ! Cocktail de bienvenue obligatoire.",
            2: "Duo de choc : Komba et Tanikely. Lémuriens le matin, tortues l'après-midi. C'est la journée 'National Geographic' mais en vrai.",
            3: "Scooter trip ! On fait le tour de l'île cheveux au vent. On s'arrête où on veut, on parle aux gens. Liberté totale jusqu'au coucher de soleil au Mont Passot.",
            4: "L'apothéose : Nosy Iranja. Deux îles, un banc de sable, et l'eau la plus bleue que vous ayez jamais vue. C'est le paradis, point final.",
            5: "Immersion nature à Lokobe. On laisse le moteur pour la pagaie. La forêt primaire nous attend avec ses mystères et ses boas. Chut, on écoute la jungle.",
            6: "Dimanche à Andilana. On fait comme les locaux : pique-nique géant, musique et baignade. C'est convivial, c'est joyeux, c'est Madagascar.",
            7: "Derniers achats à Hell-Ville. On remplit la valise de vanille et de souvenirs. Un dernier jus de fruit frais et on file à l'aéroport le cœur gros."
        }
    },
    // CIRCUIT VANILLE
    "circuit-vanille": {
        description: "L'expédition sauvage de la SAVA. Pour les vrais aventuriers qui veulent sortir des sentiers battus et sentir l'âme de la vanille.",
        etapes: {
            1: "Arrivée à Sambava. Ici, tout tourne autour de la vanille. L'ambiance est laborieuse et parfumée. On sent qu'on est au cœur du réacteur.",
            2: "La Cocoteraie géante. Des millions de cocotiers alignés. C'est impressionnant et vertigineux. On boit de l'eau de coco fraîche à la source !",
            3: "Trek du Marojejy. On attaque la montagne. C'est physique, c'est humide, c'est intense. On entre dans le royaume des lémuriens rares.",
            4: "Le sommet du trek. On cherche le Sifaka Soyeux, le fantôme blanc de la forêt. Une rencontre magique qui se mérite.",
            5: "Au toit du monde (ou presque). La vue depuis le sommet est une récompense absolue. On domine toute la région verte de la SAVA.",
            6: "Redescente tranquile. Les jambes tirent un peu, mais la tête est pleine d'images. Retour à la civilisation pour une douche bien méritée.",
            7: "Route vers Antalaha. La capitale du chic et de la vanille. La route côtière est belle à pleurer. On roule fenêtres ouvertes.",
            8: "Masterclass Vanille. On visite les ateliers de préparation. Massage, séchage... c'est de l'orfèvrerie végétale. Vous ne regarderez plus jamais une gousse pareille.",
            9: "Cap Est, le bout du monde. Le point le plus oriental de l'Afrique. C'est sauvage, venté, puissant. On se sent pionnier.",
            10: "Macolline, la pause nature. Une colline préservée avec amour. On y apprend tout sur les plantes médicinales et les bois précieux.",
            11: "Détente bien méritée. Plage, langouste, sieste. On digère toutes ces aventures avant le départ.",
            12: "Vol retour. On décolle au-dessus de la forêt verte, les valises pleines de gousses noires et odorantes. Veloma la SAVA !"
        }
    }
};

// --- MAIN SCRIPT ---
async function main() {
    console.log("🚀 Démarrage de la réécriture du contenu (Gasikara Explorer)...");

    // 1. Charger les données originales pour garder la structure (IDs, images, coords...)
    console.log("📂 Chargement des données sources...");
    const lieuxOriginal = loadBrowserDataFile('lieux.js', 'LIEUX_DATA');
    const itinerairesOriginal = loadBrowserDataFile('itineraires.js', 'ITINERAIRES_DATA');

    const outputData = {
        lieux: [],
        itineraires: {}
    };

    // 2. Traiter les LIEUX
    console.log(`\n🌍 Traitement des lieux...`);
    outputData.lieux = lieuxOriginal.map(lieu => {
        const newDesc = LIEUX_REWRITES[lieu.id];
        if (newDesc) {
            // console.log(`   ✅ Rewrite Lieu [${lieu.id}] ${lieu.nom}`);
            return { ...lieu, description: newDesc };
        }
        // Si pas de rewrite spécifique, on garde l'original (ou on pourrait mettre un default)
        return lieu;
    });

    // 3. Traiter les ITINÉRAIRES
    console.log(`\n🗺️ Traitement des circuits...`);
    for (const [key, circuit] of Object.entries(itinerairesOriginal)) {
        const rewriteCircuit = ITINERAIRES_REWRITES[circuit.id] || {};
        const newCircuit = { ...circuit };

        // Rewrite Main Description
        if (rewriteCircuit.description) {
            newCircuit.description = rewriteCircuit.description;
            // console.log(`   ✅ Rewrite Circuit [${circuit.id}] Main Description`);
        }

        // Rewrite Etapes
        if (newCircuit.etapes && Array.isArray(newCircuit.etapes)) {
            newCircuit.etapes = newCircuit.etapes.map(etape => {
                const stepRewrite = rewriteCircuit.etapes ? rewriteCircuit.etapes[etape.jour] : null;
                if (stepRewrite) {
                    // console.log(`      -> Etape ${etape.jour} rewritten`);
                    return { ...etape, description: stepRewrite };
                }
                return etape;
            });
        }
        outputData.itineraires[key] = newCircuit;
    }

    // 4. Sauvegarder
    console.log(`\n💾 Sauvegarde dans ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    console.log("✅ Terminé ! Le fichier data_rewrite_v4.json est prêt.");
}

main().catch(console.error);
