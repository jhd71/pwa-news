// Nouvelle approche: remplacer le modal par un panneau latéral

class BackgroundSelector {
    constructor() {
        this.storageKey = 'selectedBackground';
        this.init();
    }
    
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.createPanel();
        this.applySavedBackground();
        this.setupEventListeners();
        console.log('Sélecteur de fond d\'écran initialisé');
    }
    
    createPanel() {
        // Supprimer tout panel existant pour éviter les doublons
        const existingPanel = document.getElementById('bgSelectorPanel');
        if (existingPanel) {
            existingPanel.parentNode.removeChild(existingPanel);
        }
        
        // Créer un panneau latéral au lieu d'un modal
        const panel = document.createElement('div');
        panel.className = 'bg-selector-panel';
        panel.id = 'bgSelectorPanel';
        
        panel.innerHTML = `
            <div class="bg-selector-panel-content">
                <div class="bg-selector-header">
                    <h2>Choisir un fond d'écran</h2>
                    <button class="close-bg-selector" id="closeBgSelector">×</button>
                </div>
                
                <div class="bg-category">
    <h3>Fonds unis colorés</h3>
    <div class="backgrounds-grid" id="solidBgs">
        <div class="bg-thumbnail" data-bg="none" title="Couleur par défaut du thème">
            <div class="bg-thumbnail-gradient" style="background-color: var(--primary-color);"></div>
            <div class="bg-thumbnail-label">Par défaut</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-light-blue" title="Fond bleu clair">
            <div class="bg-thumbnail-gradient" style="background-color: #64B5F6;"></div>
            <div class="bg-thumbnail-label">Bleu clair</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-teal" title="Fond turquoise">
            <div class="bg-thumbnail-gradient" style="background-color: #4DB6AC;"></div>
            <div class="bg-thumbnail-label">Turquoise</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-indigo" title="Fond indigo">
            <div class="bg-thumbnail-gradient" style="background-color: #5C6BC0;"></div>
            <div class="bg-thumbnail-label">Indigo</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-green" title="Fond vert">
            <div class="bg-thumbnail-gradient" style="background-color: #81C784;"></div>
            <div class="bg-thumbnail-label">Vert</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-amber" title="Fond ambre">
            <div class="bg-thumbnail-gradient" style="background-color: #FFD54F;"></div>
            <div class="bg-thumbnail-label">Ambre</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-purple" title="Fond violet">
            <div class="bg-thumbnail-gradient" style="background-color: #9C27B0;"></div>
            <div class="bg-thumbnail-label">Violet</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-pink" title="Fond rose">
            <div class="bg-thumbnail-gradient" style="background-color: #EC407A;"></div>
            <div class="bg-thumbnail-label">Rose</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-deep-orange" title="Fond orange profond">
            <div class="bg-thumbnail-gradient" style="background-color: #FF5722;"></div>
            <div class="bg-thumbnail-label">Orange foncé</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-lime" title="Fond citron vert">
            <div class="bg-thumbnail-gradient" style="background-color: #CDDC39;"></div>
            <div class="bg-thumbnail-label">Citron vert</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-black" title="Fond noir">
            <div class="bg-thumbnail-gradient" style="background-color: #000000;"></div>
            <div class="bg-thumbnail-label">Noir</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-dark-grey" title="Fond gris foncé">
            <div class="bg-thumbnail-gradient" style="background-color: #212121;"></div>
            <div class="bg-thumbnail-label">Gris foncé</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-charcoal" title="Fond anthracite">
            <div class="bg-thumbnail-gradient" style="background-color: #333333;"></div>
            <div class="bg-thumbnail-label">Anthracite</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-navy" title="Fond bleu marine">
            <div class="bg-thumbnail-gradient" style="background-color: #0D1B2A;"></div>
            <div class="bg-thumbnail-label">Bleu marine</div>
        </div>
    </div>
</div>

<div class="bg-category">
    <h3>🤍 Fonds clairs et neutres</h3>
    <div class="backgrounds-grid" id="lightSolidBgs">
        <div class="bg-thumbnail" data-bg="bg-solid-white" title="Fond blanc pur">
            <div class="bg-thumbnail-gradient" style="background-color: #FFFFFF; border: 1px solid #ddd;"></div>
            <div class="bg-thumbnail-label">Blanc pur</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-off-white" title="Fond blanc cassé">
            <div class="bg-thumbnail-gradient" style="background-color: #FAFAFA;"></div>
            <div class="bg-thumbnail-label">Blanc cassé</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-cream" title="Fond crème">
            <div class="bg-thumbnail-gradient" style="background-color: #FFF8E1;"></div>
            <div class="bg-thumbnail-label">Crème</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-light-grey" title="Fond gris clair">
            <div class="bg-thumbnail-gradient" style="background-color: #F5F5F5;"></div>
            <div class="bg-thumbnail-label">Gris clair</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-silver" title="Fond argent">
            <div class="bg-thumbnail-gradient" style="background-color: #E0E0E0;"></div>
            <div class="bg-thumbnail-label">Argent</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-pearl" title="Fond perle">
            <div class="bg-thumbnail-gradient" style="background-color: #F8F8FF;"></div>
            <div class="bg-thumbnail-label">Perle</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-snow" title="Fond neige">
            <div class="bg-thumbnail-gradient" style="background-color: #FFFAFA;"></div>
            <div class="bg-thumbnail-label">Neige</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-ivory" title="Fond ivoire">
            <div class="bg-thumbnail-gradient" style="background-color: #FFFFF0;"></div>
            <div class="bg-thumbnail-label">Ivoire</div>
        </div>
    </div>
</div>

<div class="bg-category">
    <h3>⚫ Gris moyens</h3>
    <div class="backgrounds-grid" id="greyBgs">
        <div class="bg-thumbnail" data-bg="bg-solid-light-steel" title="Fond acier clair">
            <div class="bg-thumbnail-gradient" style="background-color: #B0BEC5;"></div>
            <div class="bg-thumbnail-label">Acier clair</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-medium-grey" title="Fond gris moyen">
            <div class="bg-thumbnail-gradient" style="background-color: #9E9E9E;"></div>
            <div class="bg-thumbnail-label">Gris moyen</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-cool-grey" title="Fond gris froid">
            <div class="bg-thumbnail-gradient" style="background-color: #90A4AE;"></div>
            <div class="bg-thumbnail-label">Gris froid</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-warm-grey" title="Fond gris chaud">
            <div class="bg-thumbnail-gradient" style="background-color: #A1887F;"></div>
            <div class="bg-thumbnail-label">Gris chaud</div>
        </div>
    </div>
</div>

<div class="bg-category">
    <h3>✨ Couleurs tendance</h3>
    <div class="backgrounds-grid" id="trendyBgs">
        <div class="bg-thumbnail" data-bg="bg-solid-sage" title="Fond sauge">
            <div class="bg-thumbnail-gradient" style="background-color: #B2DFDB;"></div>
            <div class="bg-thumbnail-label">Sauge</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-dusty-rose" title="Fond rose poudré">
            <div class="bg-thumbnail-gradient" style="background-color: #F8BBD0;"></div>
            <div class="bg-thumbnail-label">Rose poudré</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-powder-blue" title="Fond bleu poudre">
            <div class="bg-thumbnail-gradient" style="background-color: #B3E5FC;"></div>
            <div class="bg-thumbnail-label">Bleu poudre</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-mint" title="Fond menthe">
            <div class="bg-thumbnail-gradient" style="background-color: #C8E6C9;"></div>
            <div class="bg-thumbnail-label">Menthe</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-vanilla" title="Fond vanille">
            <div class="bg-thumbnail-gradient" style="background-color: #FFF9C4;"></div>
            <div class="bg-thumbnail-label">Vanille</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-lavender-mist" title="Fond brume lavande">
            <div class="bg-thumbnail-gradient" style="background-color: #E1BEE7;"></div>
            <div class="bg-thumbnail-label">Brume lavande</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-peach" title="Fond pêche">
            <div class="bg-thumbnail-gradient" style="background-color: #FFCCBC;"></div>
            <div class="bg-thumbnail-label">Pêche</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-sky-blue" title="Fond bleu ciel">
            <div class="bg-thumbnail-gradient" style="background-color: #87CEEB;"></div>
            <div class="bg-thumbnail-label">Bleu ciel</div>
        </div>
    </div>
</div>

<div class="bg-category">
    <h3>🌿 Couleurs terre et nature</h3>
    <div class="backgrounds-grid" id="earthBgs">
        <div class="bg-thumbnail" data-bg="bg-solid-sand" title="Fond sable">
            <div class="bg-thumbnail-gradient" style="background-color: #F4A460;"></div>
            <div class="bg-thumbnail-label">Sable</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-wheat" title="Fond blé">
            <div class="bg-thumbnail-gradient" style="background-color: #F5DEB3;"></div>
            <div class="bg-thumbnail-label">Blé</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-linen" title="Fond lin">
            <div class="bg-thumbnail-gradient" style="background-color: #FAF0E6;"></div>
            <div class="bg-thumbnail-label">Lin</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-misty-rose" title="Fond rose brumeux">
            <div class="bg-thumbnail-gradient" style="background-color: #FFE4E1;"></div>
            <div class="bg-thumbnail-label">Rose brumeux</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-solid-almond" title="Fond amande">
            <div class="bg-thumbnail-gradient" style="background-color: #FFDBCD;"></div>
            <div class="bg-thumbnail-label">Amande</div>
        </div>
    </div>
</div>

<div class="bg-category">
    <h3>🌈 Dégradés clairs</h3>
    <div class="backgrounds-grid" id="lightGradientBgs">
        <div class="bg-thumbnail" data-bg="bg-gradient-white-grey" title="Dégradé blanc-gris">
            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #FFFFFF, #F5F5F5, #E0E0E0);"></div>
            <div class="bg-thumbnail-label">Blanc-Gris</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-gradient-pearl-silver" title="Dégradé perle-argent">
            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #F8F8FF, #E8E8E8, #D0D0D0);"></div>
            <div class="bg-thumbnail-label">Perle-Argent</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-gradient-cream-beige" title="Dégradé crème-beige">
            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #FFF8E1, #F5F5DC, #F0E68C);"></div>
            <div class="bg-thumbnail-label">Crème-Beige</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-gradient-soft-clouds" title="Nuages doux">
            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #ECF0F1, #BDC3C7, #95A5A6);"></div>
            <div class="bg-thumbnail-label">Nuages doux</div>
        </div>
    </div>
</div>

<div class="bg-category">
    <h3>🌸 Dégradés pastels</h3>
    <div class="backgrounds-grid" id="pastelGradientBgs">
        <div class="bg-thumbnail" data-bg="bg-gradient-pastel-blue" title="Bleu pastel">
            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #E3F2FD, #BBDEFB, #90CAF9);"></div>
            <div class="bg-thumbnail-label">Bleu pastel</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-gradient-pastel-pink" title="Rose pastel">
            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #FCE4EC, #F8BBD0, #F48FB1);"></div>
            <div class="bg-thumbnail-label">Rose pastel</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-gradient-pastel-green" title="Vert pastel">
            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #E8F5E8, #C8E6C9, #A5D6A7);"></div>
            <div class="bg-thumbnail-label">Vert pastel</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-gradient-pastel-yellow" title="Jaune pastel">
            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #FFFDE7, #FFF9C4, #FFF176);"></div>
            <div class="bg-thumbnail-label">Jaune pastel</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-gradient-pastel-purple" title="Violet pastel">
            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #F3E5F5, #E1BEE7, #CE93D8);"></div>
            <div class="bg-thumbnail-label">Violet pastel</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-gradient-pastel-orange" title="Orange pastel">
            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #FFF3E0, #FFCC80, #FFB74D);"></div>
            <div class="bg-thumbnail-label">Orange pastel</div>
        </div>
    </div>
</div>

<div class="bg-category">
    <h3>🌍 Dégradés terre</h3>
    <div class="backgrounds-grid" id="earthGradientBgs">
        <div class="bg-thumbnail" data-bg="bg-gradient-earth-tones" title="Tons terre">
            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #F5DEB3, #DEB887, #D2B48C);"></div>
            <div class="bg-thumbnail-label">Tons terre</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-gradient-desert" title="Désert">
            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #F4A460, #CD853F, #A0522D);"></div>
            <div class="bg-thumbnail-label">Désert</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-gradient-morning-mist" title="Brume matinale">
            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #F0F8FF, #E6E6FA, #D3D3D3);"></div>
            <div class="bg-thumbnail-label">Brume matinale</div>
        </div>
    </div>
</div>

<div class="bg-category">
    <h3>⭕ Radiaux clairs</h3>
    <div class="backgrounds-grid" id="lightRadialBgs">
        <div class="bg-thumbnail" data-bg="bg-gradient-radial-light" title="Radial clair">
            <div class="bg-thumbnail-gradient" style="background: radial-gradient(circle at center, #FFFFFF, #F0F0F0);"></div>
            <div class="bg-thumbnail-label">Radial clair</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-gradient-radial-soft-blue" title="Bleu doux radial">
            <div class="bg-thumbnail-gradient" style="background: radial-gradient(circle at center, #E3F2FD, #81D4FA);"></div>
            <div class="bg-thumbnail-label">Bleu doux</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-gradient-radial-soft-pink" title="Rose doux radial">
            <div class="bg-thumbnail-gradient" style="background: radial-gradient(circle at center, #FCE4EC, #F48FB1);"></div>
            <div class="bg-thumbnail-label">Rose doux</div>
        </div>
        <div class="bg-thumbnail" data-bg="bg-gradient-radial-soft-green" title="Vert doux radial">
            <div class="bg-thumbnail-gradient" style="background: radial-gradient(circle at center, #E8F5E8, #A5D6A7);"></div>
            <div class="bg-thumbnail-label">Vert doux</div>
        </div>
    </div>
</div>

                                <div class="bg-category">
                    <h3>Dégradés classiques</h3>
                    <div class="backgrounds-grid" id="gradientBgs">
                        <div class="bg-thumbnail" data-bg="bg-gradient-violet" data-theme="light" title="Dégradé Violet">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #9575CD, #7E57C2, #5E35B1);"></div>
                            <div class="bg-thumbnail-label">Violet</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-blue" data-theme="dark" title="Dégradé Bleu">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #283593, #1a237e, #0d1257);"></div>
                            <div class="bg-thumbnail-label">Bleu nuit</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-red" data-theme="rouge" title="Dégradé Rouge">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #e53935, #c62828, #b71c1c);"></div>
                            <div class="bg-thumbnail-label">Rouge</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-bleu-ciel" data-theme="bleuciel" title="Dégradé Bleu Ciel">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #4FC3F7, #4FB3E8, #3F97C7);"></div>
                            <div class="bg-thumbnail-label">Bleu ciel</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-category">
                    <h3>Dégradés supplémentaires</h3>
                    <div class="backgrounds-grid" id="extraGradientBgs">
                        <div class="bg-thumbnail" data-bg="bg-gradient-sunset" title="Coucher de soleil">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #FF9E80, #FF6E40, #FF3D00);"></div>
                            <div class="bg-thumbnail-label">Coucher soleil</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-ocean" title="Océan">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #00BCD4, #0097A7, #006064);"></div>
                            <div class="bg-thumbnail-label">Océan</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-forest" title="Forêt">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #81C784, #4CAF50, #2E7D32);"></div>
                            <div class="bg-thumbnail-label">Forêt</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-lavender" title="Lavande">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #E1BEE7, #CE93D8, #AB47BC);"></div>
                            <div class="bg-thumbnail-label">Lavande</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-golden" title="Or">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #FFD54F, #FFC107, #FF8F00);"></div>
                            <div class="bg-thumbnail-label">Or</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-cherry" title="Cerise">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #F8BBD0, #F06292, #D81B60);"></div>
                            <div class="bg-thumbnail-label">Cerise</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-category">
                    <h3>Dégradés saisons</h3>
                    <div class="backgrounds-grid" id="seasonGradientBgs">
                        <div class="bg-thumbnail" data-bg="bg-gradient-spring" title="Printemps">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #8BC34A, #CDDC39, #FFC107);"></div>
                            <div class="bg-thumbnail-label">Printemps</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-autumn" title="Automne">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #F57F17, #FF8F00, #FFB300);"></div>
                            <div class="bg-thumbnail-label">Automne</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-winter" title="Hiver">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #B3E5FC, #81D4FA, #4FC3F7);"></div>
                            <div class="bg-thumbnail-label">Hiver</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-midnight" title="Minuit">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #131862, #2D31FA, #6667AB);"></div>
                            <div class="bg-thumbnail-label">Minuit</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-category">
                    <h3>Dégradés diagonaux</h3>
                    <div class="backgrounds-grid" id="diagonalGradientBgs">
                        <div class="bg-thumbnail" data-bg="bg-gradient-diagonal-blue" title="Dégradé diagonal bleu">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(45deg, #2196F3, #0D47A1);"></div>
                            <div class="bg-thumbnail-label">Bleu</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-diagonal-green" title="Dégradé diagonal vert">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(45deg, #4CAF50, #1B5E20);"></div>
                            <div class="bg-thumbnail-label">Vert</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-diagonal-purple" title="Dégradé diagonal violet">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(45deg, #9C27B0, #4A148C);"></div>
                            <div class="bg-thumbnail-label">Violet</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-diagonal-orange" title="Dégradé diagonal orange">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(45deg, #FF9800, #E65100);"></div>
                            <div class="bg-thumbnail-label">Orange</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-category">
                    <h3>Dégradés radiaux</h3>
                    <div class="backgrounds-grid" id="radialGradientBgs">
                        <div class="bg-thumbnail" data-bg="bg-gradient-radial-blue" title="Dégradé radial bleu">
                            <div class="bg-thumbnail-gradient" style="background: radial-gradient(circle at center, #64B5F6, #1976D2);"></div>
                            <div class="bg-thumbnail-label">Bleu</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-radial-purple" title="Dégradé radial violet">
                            <div class="bg-thumbnail-gradient" style="background: radial-gradient(circle at center, #CE93D8, #7B1FA2);"></div>
                            <div class="bg-thumbnail-label">Violet</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-radial-green" title="Dégradé radial vert">
                            <div class="bg-thumbnail-gradient" style="background: radial-gradient(circle at center, #A5D6A7, #2E7D32);"></div>
                            <div class="bg-thumbnail-label">Vert</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-radial-warm" title="Dégradé radial chaud">
                            <div class="bg-thumbnail-gradient" style="background: radial-gradient(circle at center, #FFCCBC, #E64A19);"></div>
                            <div class="bg-thumbnail-label">Chaleur</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-category">
                    <h3>Dégradés bicolores</h3>
                    <div class="backgrounds-grid" id="duoGradientBgs">
                        <div class="bg-thumbnail" data-bg="bg-gradient-duo-blue-green" title="Bleu à vert">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(to right, #2196F3, #4CAF50);"></div>
                            <div class="bg-thumbnail-label">Bleu-Vert</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-duo-purple-pink" title="Violet à rose">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(to right, #9C27B0, #E91E63);"></div>
                            <div class="bg-thumbnail-label">Violet-Rose</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-duo-orange-yellow" title="Orange à jaune">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(to right, #FF9800, #FFEB3B);"></div>
                            <div class="bg-thumbnail-label">Orange-Jaune</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-duo-red-blue" title="Rouge à bleu">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(to right, #F44336, #2196F3);"></div>
                            <div class="bg-thumbnail-label">Rouge-Bleu</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-category">
                    <h3>Dégradés sombres</h3>
                    <div class="backgrounds-grid" id="darkGradientBgs">
                        <div class="bg-thumbnail" data-bg="bg-gradient-dark-blue" title="Dégradé bleu sombre">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #0D1B2A, #1B263B, #415A77);"></div>
                            <div class="bg-thumbnail-label">Bleu nuit</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-dark-purple" title="Dégradé violet sombre">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #2A0944, #3B185F, #A12568);"></div>
                            <div class="bg-thumbnail-label">Violet nuit</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-dark-green" title="Dégradé vert sombre">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #14261D, #1E4D2B, #056835);"></div>
                            <div class="bg-thumbnail-label">Vert forêt</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-night-sky" title="Ciel nocturne">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #0F172A, #1E293B, #334155);"></div>
                            <div class="bg-thumbnail-label">Ciel nocturne</div>
                        </div>
                        <div class="bg-thumbnail" data-bg="bg-gradient-deep-black" title="Noir profond">
                            <div class="bg-thumbnail-gradient" style="background: linear-gradient(135deg, #000000, #0A0A0A, #1A1A1A);"></div>
                            <div class="bg-thumbnail-label">Noir profond</div>
                        </div>
                    </div>
                </div>

                <div class="bg-category">
                    <h3>🎨 Fonds personnalisés</h3>
                    <div class="custom-bg-actions">
                        <button class="add-custom-bg-btn" id="addCustomBgBtn">
                            <span class="material-icons">add_photo_alternate</span>
                            <span>Ajouter votre image</span>
                        </button>
                    </div>
                    <div class="backgrounds-grid" id="customBgsList">
                        <!-- Les fonds personnalisés apparaîtront ici -->
                    </div>
                </div>

                <button class="reset-bg-btn" id="resetBgBtn">Réinitialiser le fond</button>
                
                <!-- Bouton flottant de fermeture -->
                <button class="floating-close-btn" id="floatingCloseBtn">×</button>
            </div>
        `;
        
        document.body.appendChild(panel);
    }
    
    setupEventListeners() {
        const openBtn = document.getElementById('bgSelectorBtn');
if (openBtn) {
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Fermer la sidebar
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
        
        // Ouvrir le panneau
        this.openPanel();
        
        // Nettoyer TOUS les overlays immédiatement et complètement
        setTimeout(() => {
            // Méthode plus agressive pour trouver et supprimer TOUS les overlays
            const allDivs = document.querySelectorAll('div');
            allDivs.forEach(div => {
                // Vérifier si c'est un overlay par ses styles
                const styles = window.getComputedStyle(div);
                if (styles.position === 'fixed' && 
                    styles.zIndex > 1000 && 
                    (styles.backgroundColor.includes('rgba(0') || 
                     div.className.includes('overlay') ||
                     div.className.includes('backdrop'))) {
                    div.remove();
                }
            });
            
            // Nettoyer aussi par classes spécifiques
            document.querySelectorAll('.modal-backdrop, .overlay, .backdrop, .sidebar-overlay, .menu-overlay').forEach(el => {
                el.remove();
            });
            
            // Nettoyer complètement le body
            document.body.classList.remove('modal-open', 'has-modal', 'sidebar-open', 'menu-open');
            document.body.style.cssText = document.body.style.cssText.replace(/pointer-events[^;]+;?/g, '');
            document.body.style.filter = '';
            document.body.style.overflow = '';
        }, 100);
    });
}
        }
        
        const closeBtn = document.getElementById('closeBgSelector');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closePanel();
            });
        }
        
        // Ajouter l'écouteur pour le bouton flottant
        const floatingCloseBtn = document.getElementById('floatingCloseBtn');
        if (floatingCloseBtn) {
            floatingCloseBtn.addEventListener('click', () => {
                this.closePanel();
            });
        }
        
        const resetBtn = document.getElementById('resetBgBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetBackground();
            });
        }
        
        const thumbnails = document.querySelectorAll('.bg-thumbnail');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const bgClass = thumb.dataset.bg;
                this.setBackground(bgClass);
                this.selectThumbnail(thumb);
            });
        });
        
        // Fermer le panneau quand on clique en dehors (sur mobile seulement si on clique dans la zone visible du site)
	document.addEventListener('click', (e) => {
    const panel = document.getElementById('bgSelectorPanel');
    if (!panel || !panel.classList.contains('open')) return;
    
    // Vérifier si le clic est dans le panneau ou sur le bouton d'ouverture
    if (e.target.closest('.bg-selector-panel') || 
        e.target.closest('#bgSelectorBtn')) {
        return;
    }
    
    // Sur mobile, ne fermer que si on clique dans la partie visible du site (en haut)
    if (window.innerWidth <= 768) {
        const panelTop = parseInt(window.getComputedStyle(panel).top);
        if (e.clientY >= panelTop) {
            return; // Ne pas fermer si on clique en dessous du début du panneau
        }
    }
    
    this.closePanel();
	});
        
        // Écouter la touche Echap pour fermer le panneau
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePanel();
            }
        });
        
        window.addEventListener('themeChanged', (e) => {
            this.updateSelectedThumbnail();
        });

        // Gestionnaire pour le bouton d'ajout de fond personnalisé
        const addCustomBtn = document.getElementById('addCustomBgBtn');
        if (addCustomBtn) {
            addCustomBtn.addEventListener('click', () => {
                // Fermer le panneau de fond d'écran
                this.closePanel();
                
                // Ouvrir la modal de fond personnalisé après un délai
                setTimeout(() => {
                    if (window.customBackgroundManager) {
                        window.customBackgroundManager.openModal();
                    }
                }, 300);
            });
        }
    }
    
    openPanel() {
    const panel = document.getElementById('bgSelectorPanel');
    if (panel) {
        panel.classList.add('open');
        this.updateSelectedThumbnail();
        
        // Supprimer l'overlay du menu immédiatement
        this.removeMenuOverlay();
        
        // Mettre à jour les fonds personnalisés
        setTimeout(() => {
            this.updateCustomBackgrounds();
        }, 100);
    }
}
    
    closePanel() {
    const panel = document.getElementById('bgSelectorPanel');
    if (panel) {
        panel.classList.remove('open');
        
        // Nettoyer TOUS les overlays de la même manière agressive
        const allDivs = document.querySelectorAll('div');
        allDivs.forEach(div => {
            const styles = window.getComputedStyle(div);
            if (styles.position === 'fixed' && 
                styles.zIndex > 1000 && 
                (styles.backgroundColor.includes('rgba(0') || 
                 div.className.includes('overlay') ||
                 div.className.includes('backdrop'))) {
                div.remove();
            }
        });
        
        // Nettoyer par classes
        document.querySelectorAll('.modal-backdrop, .overlay, .backdrop, .sidebar-overlay, .menu-overlay').forEach(el => {
            el.remove();
        });
        
        // Réinitialiser complètement le body
        document.body.className = document.body.className.replace(/\b(modal-open|has-modal|sidebar-open|menu-open)\b/g, '').trim();
        document.body.style.overflow = '';
        document.body.style.filter = '';
        document.body.style.pointerEvents = '';
    }
}
    
	removeMenuOverlay() {
    // Cibler spécifiquement l'overlay du menu sidebar
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        // Chercher l'overlay associé au menu
        const menuOverlay = sidebar.previousElementSibling;
        if (menuOverlay && (menuOverlay.classList.contains('overlay') || 
            menuOverlay.style.backgroundColor.includes('rgba'))) {
            menuOverlay.remove();
        }
    }
    
    // Nettoyer tous les overlays par classe
    document.querySelectorAll('.sidebar-overlay, .menu-overlay, .overlay').forEach(el => {
        el.style.transition = 'none';
        el.style.opacity = '0';
        el.remove();
    });
    
    // Enlever les classes du body qui maintiennent l'overlay
    document.body.classList.remove('menu-open', 'sidebar-open');
}

    setBackground(bgClass) {
    // Supprimer toutes les classes de fond
    document.body.className = document.body.className
        .split(' ')
        .filter(cls => !cls.startsWith('bg-') && cls !== 'has-bg-image')
        .join(' ');
    
    // Ajouter la nouvelle classe
    if (bgClass && bgClass !== 'none') {
        document.body.classList.add('has-bg-image');
        document.body.classList.add(bgClass);
		// Supprimer l'overlay du menu quand on sélectionne un fond
		this.removeMenuOverlay();
    }
    
    // IMPORTANT : Enlever immédiatement tout overlay/assombrissement
    const overlays = document.querySelectorAll('.modal-backdrop, .overlay, .backdrop, .sidebar-overlay');
    overlays.forEach(overlay => {
        overlay.style.display = 'none';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 100);
    });
    
    // Réactiver le body pour enlever tout effet d'assombrissement
    document.body.style.filter = '';
    document.body.style.opacity = '';
    document.body.classList.remove('modal-open', 'has-modal', 'sidebar-open');
    
    // Sauvegarder le choix
    localStorage.setItem(this.storageKey, bgClass || 'none');
    
    // Afficher une notification
    this.showToast('Fond d\'écran modifié');
}
    
    resetBackground() {
    // Réinitialiser les fonds d'écran classiques
    this.setBackground('none');
    
    // Réinitialiser aussi les fonds personnalisés
    if (window.customBackgroundManager) {
        window.customBackgroundManager.resetToDefaultBackground();
    }
    
    this.updateSelectedThumbnail();
    this.showToast('Fond d\'écran réinitialisé');
}
    
    applySavedBackground() {
        const savedBg = localStorage.getItem(this.storageKey);
        if (savedBg && savedBg !== 'none') {
            document.body.classList.add('has-bg-image');
            document.body.classList.add(savedBg);
        }
    }
    
    selectThumbnail(thumbnail) {
        document.querySelectorAll('.bg-thumbnail.selected').forEach(thumb => {
            thumb.classList.remove('selected');
        });
        
        if (thumbnail) {
            thumbnail.classList.add('selected');
        }
    }
    
    updateSelectedThumbnail() {
        const savedBg = localStorage.getItem(this.storageKey) || 'none';
        const currentTheme = document.documentElement.getAttribute('data-theme');
        
        document.querySelectorAll('.bg-thumbnail').forEach(thumb => {
            thumb.classList.remove('selected');
            
            if (thumb.dataset.bg === savedBg) {
                if (!thumb.dataset.theme || thumb.dataset.theme === currentTheme) {
                    thumb.classList.add('selected');
                }
            }
        });
    }
    
    showToast(message) {
        if (window.contentManager && typeof window.contentManager.showToast === 'function') {
            window.contentManager.showToast(message);
        } else if (window.themeManager && typeof window.themeManager.showToast === 'function') {
            window.themeManager.showToast(message);
        } else {
            const existingToast = document.querySelector('.toast');
            if (existingToast) {
                existingToast.remove();
            }
            
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    // NOUVELLES MÉTHODES POUR LES FONDS PERSONNALISÉS
    updateCustomBackgrounds() {
        const customBgsList = document.getElementById('customBgsList');
        if (!customBgsList) return;
        
        const customBackgrounds = JSON.parse(localStorage.getItem('customBackgrounds') || '[]');
        
        if (customBackgrounds.length === 0) {
            customBgsList.innerHTML = '<p class="no-custom-bg">Aucun fond personnalisé pour le moment</p>';
            return;
        }
        
        customBgsList.innerHTML = customBackgrounds.map(bg => `
            <div class="bg-thumbnail custom-bg-thumb" data-bg="custom-${bg.id}" data-custom-id="${bg.id}">
                <div class="bg-thumbnail-gradient" style="background-image: url(${bg.data}); background-size: cover; background-position: center;"></div>
                <div class="bg-thumbnail-label">${bg.name}</div>
                <button class="delete-custom-bg" data-id="${bg.id}" title="Supprimer">×</button>
            </div>
        `).join('');
        
        // Ajouter les événements pour les nouveaux éléments
        customBgsList.querySelectorAll('.bg-thumbnail').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-custom-bg')) {
                    e.stopPropagation();
                    this.deleteCustomBackground(e.target.dataset.id);
                } else {
                    const customId = thumb.dataset.customId;
                    if (window.customBackgroundManager) {
                        window.customBackgroundManager.applyCustomBackground(customId);
                        this.selectThumbnail(thumb);
                    }
                }
            });
        });
    }

    deleteCustomBackground(bgId) {
        if (confirm('Supprimer ce fond d\'écran personnalisé ?')) {
            if (window.customBackgroundManager) {
                window.customBackgroundManager.removeCustomBackground(bgId);
            }
            this.updateCustomBackgrounds();
        }
    }
}

// Initialiser avec un délai pour s'assurer que tout est chargé
window.addEventListener('load', function() {
    setTimeout(function() {
        window.backgroundSelector = new BackgroundSelector();
    }, 1000);
});