# Modifier les QCM à la main

Ce site n'a **aucun outil de compilation** : tout est en HTML statique. Pour changer une
question, tu ouvres la page de la section dans ton éditeur, tu modifies le HTML, tu enregistres,
et tu rafraîchis la page dans le navigateur. C'est tout — pas de Node, pas de LaTeX à recompiler.

---

## 1. Où sont les questions ?

Chaque **section** est une page : `s<chapitre>_<section>.html`
(par exemple `s5_1.html` = chapitre 5, section 1 ; `s12_4.html` = chapitre 12, section 4).

Dans cette page, les questions sont regroupées dans un bloc :

```html
<div id="quiz" data-chap="5" data-start="1">
  ... les questions ...
</div>
```

- `data-chap` = numéro de chapitre (sert aux étiquettes « 5.1 », « 5.2 »…).
- `data-start` = numéro de la **première** question de la page.

Un rappel du format est aussi écrit en commentaire en haut de chaque bloc `#quiz`.

Tu ne touches qu'à **l'intérieur** de ce bloc. Le reste de la page (en-tête, boutons, pied de page)
et les fichiers partagés `assets/quiz.js` (le moteur) et `assets/styles.css` (le style) n'ont pas
besoin d'être modifiés.

---

## 2. Une question = un bloc `<div class="q">`

Il y a quatre types de questions. Dans tous les cas :

- **les maths s'écrivent entre `$ … $`** (comme en LaTeX : `$x^2$`, `$\dfrac{\pi}{3}$`, `$\R$`…),
  avec **un seul antislash** (c'est du HTML, pas du JavaScript) ;
- tu peux mettre du **HTML** dans une réponse : `<code>print()</code>`, `<strong>gras</strong>`, etc.
  (les chevrons littéraux s'écrivent `&lt;` et `&gt;`) ;
- les **numéros sont automatiques** : tu n'écris jamais « 5.1 », « 5.2 » toi-même.

### a) QCM (le plus courant)

```html
<div class="q" data-type="qcm">
  <div class="opt" data-ok>$x \mapsto 2x$</div>
  <div class="opt">$x \mapsto x$</div>
  <div class="opt">$x \mapsto 2$</div>
  <div class="sol">On dérive : $(x^2)' = 2x$.</div>
</div>
```

- Chaque réponse est un `<div class="opt">`.
- Ajoute l'attribut **`data-ok`** sur les **bonnes** réponses. Tu peux en mettre **plusieurs**
  (question à réponses multiples) ou **une seule**.
- Les lettres **A, B, C, D…** sont attribuées automatiquement dans l'ordre d'écriture.
- `<div class="sol">…</div>` est **facultatif** : c'est la solution dépliable, affichée
  seulement après « Vérifier » et seulement si l'élève a répondu.

### b) Grille (cases à cocher)

Une grille est faite de trois briques, que tu peux mélanger :

- `<span class="lab">…</span>` = une **étiquette** (texte ou maths), non cochable ;
- `<span class="case">…</span>` = une **case à cocher** ; mets **`data-ok`** sur les cases qui
  **doivent** être cochées (la question est juste si l'élève coche *exactement* les cases `data-ok`) ;
- `<div class="cadre">…</div>` = un **cadre pointillé gris** (comme ton `\cadrepointille` en LaTeX)
  qui regroupe des cases ; à l'intérieur, chaque `<div class="row">` est une ligne, et les cases
  s'alignent automatiquement en colonnes ;
- `<div class="row">…</div>` **en dehors** d'un cadre = une ligne pleine largeur (pour les grilles
  « $a =$ / $b =$ », dizaine/unité…).

**Exemple 1 — grille en lignes** (valeurs à cocher, pleine largeur) :

```html
<div class="q" data-type="grille">
  <div class="row"><span class="lab">$a =$</span>
    <span class="case">$-$</span><span class="case" data-ok>$1$</span><span class="case">$2$</span></div>
  <div class="row"><span class="lab">$b =$</span>
    <span class="case">$0$</span><span class="case" data-ok>$5$</span></div>
</div>
```

**Exemple 2 — grille avec cadres pointillés** (comme la négation de « $P$ et $Q$ ») :

```html
<div class="q" data-type="grille">
  <div class="cadre">
    <div class="row"><span class="case">$P$</span></div>
    <div class="row"><span class="case" data-ok>$\non{P}$</span></div>
  </div>
  <div class="cadre">
    <div class="row"><span class="case">$\Longrightarrow$</span><span class="case">et</span></div>
    <div class="row"><span class="case">$\Longleftarrow$</span><span class="case" data-ok>ou</span></div>
  </div>
  <div class="cadre">
    <div class="row"><span class="case">$Q$</span></div>
    <div class="row"><span class="case" data-ok>$\non{Q}$</span></div>
  </div>
</div>
```

Les cadres se placent côte à côte (et reviennent à la ligne si l'écran est étroit). Tu peux aussi
mettre des étiquettes/cases **inline** autour d'un cadre, par ex. `ρ = √` suivi d'un cadre :

```html
<div class="q" data-type="grille">
  <span class="lab">$\rho =$</span>
  <span class="case">$\sqrt{\ }$</span>
  <div class="cadre">
    <div class="row"><span class="case">$1$</span><span class="case" data-ok>$2$</span><span class="case">$3$</span></div>
    <div class="row"><span class="case">$4$</span><span class="case">$5$</span><span class="case">$6$</span></div>
  </div>
</div>
```

### b bis) Droite graduée (axe / tableau de signes)

Pour les questions « ensemble des solutions de l'inéquation… » où l'élève coche les
**intervalles** et les **points** sur une droite graduée :

```html
<div class="q" data-type="axe">
  <span class="int" data-ok></span>          <!-- intervalle ]-∞ ; -2[ -->
  <span class="pt" data-lab="$-2$"></span>    <!-- point gradué -2 -->
  <span class="int"></span>                   <!-- intervalle ]-2 ; -1[ -->
  <span class="pt" data-lab="$-1$"></span>
  <span class="int"></span>
  <span class="pt" data-lab="$1$"></span>
  <span class="int" data-ok></span>
  <span class="pt" data-lab="$2$" data-ok></span>
  <span class="int" data-ok></span>
  <div class="sol">$(x-1)(x+2)>0 \iff x\in\,]-\infty;-2[\,\cup\,]1;+\infty[$.</div>
</div>
```

Règles :

- on **alterne** `<span class="int">` (intervalle, case large) et `<span class="pt">` (point gradué,
  petite case avec une croix) ; on commence et on finit par un `int` ;
- `<span class="pt" data-lab="$-2$">` : l'étiquette du point va dans **`data-lab`** (en `$…$`) ;
- **`data-ok`** marque les cases (intervalles ET points) qui font partie de l'ensemble solution ;
  l'élève coche *exactement* ces cases pour avoir juste (vert / rouge comme ailleurs) ;
- les extrémités affichent `-∞` et `+∞` automatiquement ; pour les changer, ajoute
  `data-left="$a$"` et/ou `data-right="$b$"` sur le `<div class="q" data-type="axe" …>`.

Astuce pour ne pas te tromper : un crochet **ouvert** (inégalité stricte `<`, `>`) = le point n'est
**pas** coché ; un crochet **fermé** (`\leqslant`, `\geqslant`) = le point **est** coché.

### b ter) Trouve la valeur (`a =` / `b =` : signe + chiffre)

Pour la grille où l'élève reconstitue un nombre en cochant le **signe** (si négatif) et **un chiffre**.
Chaque ligne = une valeur ; le signe « − » est une **case** comme les chiffres.

**La bonne façon : dans la même question que l'axe.** Pour reproduire tes énoncés « axe … avec a= / b= »
(une **seule** question, un seul verdict), tu mets un bloc `<div class="trouve">` **à l'intérieur** de la
question `axe`, après les cases de l'axe :

```html
<div class="q" data-type="axe">
  <span class="int"></span>
  <span class="pt" data-lab="$a$" data-ok></span>
  <span class="int" data-ok></span>
  <span class="pt" data-lab="$b$" data-ok></span>
  <span class="int"></span>
  <div class="trouve">
    <div class="row" data-lab="$a =$">
      <span class="sign"></span>              <!-- case du signe « − » ; data-ok si a<0 -->
      <span class="dig">0</span>
      <span class="dig" data-ok>1</span>       <!-- le bon chiffre de a -->
      <span class="dig">2</span><span class="dig">3</span>
      <span class="dig">4</span><span class="dig">5</span>
    </div>
    <div class="row" data-lab="$b =$">
      <span class="sign"></span>
      <span class="dig">0</span><span class="dig">1</span><span class="dig">2</span>
      <span class="dig">3</span><span class="dig">4</span>
      <span class="dig" data-ok>5</span>        <!-- le bon chiffre de b -->
    </div>
  </div>
  <div class="sol">$|x-3|\leqslant 2 \iff x\in[1;5]$ : $a=1$, $b=5$.</div>
</div>
```

L'axe s'affiche à gauche, le mot « avec » et la grille `a= / b=` à droite (ça passe à la ligne sur
mobile). Tout est **une seule question** : un seul « Correct / Incorrect ».

Règles de la grille :

- chaque `<div class="row" data-lab="$a =$">` est une valeur à trouver (une ligne) ;
- `<span class="sign">` = la case du signe « − » (présentée comme une case de chiffre). Mets **`data-ok`**
  dessus si la valeur est **négative** (sinon laisse-la sans `data-ok` : l'élève doit la laisser décochée).
  Tu peux l'omettre si aucun signe n'est proposé ;
- `<span class="dig">` = un chiffre proposé ; l'élève en coche **un seul** par ligne. Mets **`data-ok`**
  sur le bon. Tu mets autant de chiffres que tu veux (0–5, 0–9…) ;
- la ligne est juste si le signe est dans le bon état **et** le bon chiffre est coché.

**Variante : la grille seule.** Si tu veux juste la grille `a= / b=` sans axe, c'est le même bloc de
lignes dans une question `data-type="valeur"` :

```html
<div class="q" data-type="valeur">
  <div class="row" data-lab="$a =$"><span class="sign"></span>
    <span class="dig">0</span><span class="dig" data-ok>1</span><span class="dig">2</span></div>
</div>
```

> Nombres à **deux chiffres** (dizaine + unité) : pas encore géré (une seule colonne de chiffres par
> ligne). Dis-le si tu en as besoin.

### c) Figure (à faire sur le polycopié)

Pour une question qui nécessite un graphique / une figure qu'on ne reproduit pas en ligne :

```html
<div class="q" data-type="figure"></div>
```

Elle s'affiche en grisé, « à traiter sur le polycopié », et n'entre pas dans le score.

### d) Cercle trigonométrique (surtout chapitre 1.4)

```html
<div class="q" data-type="cercle">
  <span class="pt" data-x="1"   data-y="0">0</span>
  <span class="pt" data-x="0.5" data-y="0.866" data-ok>\pi/3</span>
  <span class="pt" data-x="0"   data-y="1">\pi/2</span>
</div>
```

- Chaque point : `data-x` et `data-y` sont les **coordonnées** sur le cercle (entre −1 et 1,
  donc `cos` et `sin` de l'angle), et le contenu est l'étiquette en LaTeX **sans** les `$`.
- `data-ok` marque le bon point. C'est le type le plus technique ; pour le reste, préfère `qcm`.

---

## 3. Ajouter, supprimer, réordonner

- **Ajouter** une question : copie un bloc `<div class="q">…</div>` et colle-le où tu veux dans le
  `#quiz`. La numérotation se recale toute seule.
- **Supprimer** : efface le bloc.
- **Réordonner** : déplace les blocs. L'ordre d'affichage = l'ordre dans le HTML.

⚠️ **Si tu changes le *nombre* de questions d'une section**, une retouche manuelle (facultative)
pour garder une numérotation continue avec le reste du chapitre : dans les sections **suivantes**
du même chapitre, ajuste `data-start` (il vaut le numéro de la première question de la page).
Exemple : si 5.1 passe de 19 à 20 questions, mets `data-start="21"` dans `s5_2.html`, etc.

Les pages de chapitre (`ch5.html`) et l'accueil (`index.html`) n'affichent aucun compteur : il n'y
a donc rien d'autre à corriger.

---

## 4. Les symboles mathématiques

MathJax rend tout ce qui est entre `$ … $`. En plus des commandes LaTeX usuelles, des **raccourcis**
sont définis dans `assets/mathjax-config.js` et utilisables directement :

`\R \N \Z \C \Q \K \E \V` (ensembles), `\ch \sh \th` (hyperboliques), `\un \vn \wn \xn \yn`
(suites $(u_n)$…), `\ima \rg \tr \card \dist \pgcd \ppcm`, `\dd` (le d de dérivée), `\non{P}`
(négation, affichée $\overline{P}$), `\ensemblesol`.

Pour **ajouter un raccourci**, édite le bloc `macros:{…}` dans `assets/mathjax-config.js`
(par ex. `D:'\\mathbb{D}'`). Ça s'applique à tout le site.

> Astuce : `\leqslant` / `\geqslant` pour ≤ / ≥ (le site les utilise déjà).

---

## 5. Les autres fichiers

- `assets/quiz.js` — le **moteur** (lecture des questions, cases à cocher, correction, score,
  sauvegarde des réponses, solutions). À modifier seulement pour changer un **comportement**
  global (par ex. le texte « ✓ Correct » se change tout en haut, dans l'objet `MSG`).
- `assets/styles.css` — le **style** (couleurs, mise en page). **Les deux couleurs du site** sont
  tout en haut du fichier, dans le bloc `:root` : `--c-impair` (chapitres 1, 3, 5…) et `--c-pair`
  (chapitres 2, 4, 6…). C'est le **seul** endroit à changer : modifie un code hexadécimal, enregistre,
  et tout le site (en-têtes, boutons, cases, cartes, pastilles de numéro) suit automatiquement.
  Aucune couleur n'est écrite dans les fichiers `.html`.
- `assets/mathjax-config.js` — les **macros** maths (voir §4).
- `ch1.html … ch17.html` — les pages de **chapitre** (menu des sections). Texte statique.
- `index.html` — l'**accueil** (liste des chapitres). Texte statique.

---

## 6. Tester

Ouvre simplement n'importe quelle page `.html` dans un navigateur (double-clic), ou pousse le dossier
sur ton dépôt git / GitHub Pages. Aucune installation nécessaire. Les réponses des élèves sont
mémorisées dans **leur** navigateur (localStorage) ; elles ne sont pas envoyées ni partagées.

---

### Exemple complet, de zéro

```html
<div class="q" data-type="qcm">
  <div class="opt">La fonction est paire</div>
  <div class="opt" data-ok>La fonction est impaire</div>
  <div class="opt">Ni paire ni impaire</div>
  <div class="sol">$\sin(-x) = -\sin(x)$ : la fonction $\sin$ est impaire.</div>
</div>
```

Colle ça dans un `#quiz`, enregistre, rafraîchis : la question apparaît, numérotée automatiquement,
avec ses cases A/B/C, le bouton « Vérifier » qui la corrige en vert/rouge, et la solution 💡.
