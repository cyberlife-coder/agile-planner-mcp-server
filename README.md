# Agile Planner MCP - Générateur de Backlog Agile propulsé par l'IA

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

**Agile Planner MCP** vous permet de générer automatiquement un backlog agile complet (Epics, User Stories, MVP, itérations) à partir d'une simple description de projet, directement dans Windsurf, Cascade ou Cursor, sans aucune compétence technique requise.

> **Dernières améliorations :** Structure centralisée dans `.agile-planner-backlog`, annotations détaillées pour guider l'IA, cases à cocher pour suivi des tâches, et conformité totale à la spécification MCP pour Windsurf.

---

## 🎯 À quoi sert cet outil ?

- Obtenez en quelques secondes un backlog agile structuré, prêt à l'emploi, pour tout type de projet (web, mobile, SaaS, MVP, etc.).
- Exportez automatiquement vos Epics, User Stories et itérations au format Markdown, avec des annotations spécifiques pour l'IA.
- Gagnez du temps et structurez vos projets avec l'intelligence artificielle (OpenAI ou Groq).
- La génération comprend des instructions précises pour guider l'IA dans l'implémentation de votre projet.

---

## 🚦 Mise en service dans Windsurf / Cascade / Cursor

Demandez à votre administrateur ou à votre équipe technique d'ajouter ce serveur MCP dans la configuration de votre espace :

```json
{
  "mcpServers": {
    "agile-planner": {
      "command": "node",
      "args": ["D:/Projets-dev/MCP/AgilePlanner/server/index.js"],
      "env": {
        "MCP_EXECUTION": "true",
        "OPENAI_API_KEY": "sk-...",
        "AGILE_PLANNER_OUTPUT_ROOT": "D:/chemin/vers/dossier/sortie"
      }
    }
  }
}
```

**Important :** La variable `MCP_EXECUTION` avec la valeur `"true"` est requise pour le fonctionnement correct avec Windsurf.

Une fois activé, l'outil `generateBacklog` s'affichera automatiquement dans la liste des outils MCP de votre interface.

---

## 📝 Comment utiliser Agile Planner MCP ?

1. **Sélectionnez l'outil `generateBacklog`** dans Windsurf, Cascade ou Cursor.
2. **Décrivez votre projet** le plus précisément possible dans le champ prévu à cet effet (exemples ci-dessous).
3. **Lancez la génération** :
   - Un dossier `.agile-planner-backlog` sera créé dans le répertoire spécifié par `AGILE_PLANNER_OUTPUT_ROOT` (ou dans le répertoire courant si non défini).
   - Les fichiers Markdown (epic, MVP, itérations) et le backlog JSON (optionnel) seront générés à l'intérieur, avec des instructions précises pour l'IA.

---

## 💡 Exemples concrets d'utilisation

**Générer un backlog pour un SaaS**
```json
{
  "project": "SaaS de gestion de tâches collaboratif pour PME. Fonctionnalités attendues : gestion de projets, tâches, notifications, intégration Slack, mobile-first, RGPD."
}
```

**Refonte d'application mobile**
```json
{
  "project": "Refonte complète de l'application mobile e-commerce. Objectifs : UX moderne, paiement Apple/Google Pay, notifications push, analytics, accessibilité AA."
}
```

**MVP rapide**
```json
{
  "project": "MVP d'une plateforme de réservation de salles de réunion pour startups, avec authentification Google, calendrier partagé, et notifications email."
}
```

---

## 🛡️ Architecture technique & Robustesse

### Flux de validation IA et génération de backlog

- **Validation stricte IA** : Toute réponse générée par l'IA (OpenAI ou Groq) est validée localement via un schéma JSON exhaustif (Ajv). Si la réponse n'est pas conforme, elle est repromptée automatiquement jusqu'à 3 fois.
- **Aucune génération de fichier** n'a lieu tant que la réponse IA n'est pas strictement conforme au schéma attendu.
- **Feedback JSON-RPC/MCP** : Toute erreur de validation ou d'exécution est renvoyée dans le champ `error` de la réponse MCP, donc visible dans Windsurf/Cascade/Cursor.
- **Logs** : Toutes les étapes clefs (appel IA, validation, génération, erreurs) sont loggées sur stderr pour auditabilité.

### Structure des fichiers générés

Les fichiers sont générés dans un sous-dossier `.agile-planner-backlog` avec la structure suivante :
```
.agile-planner-backlog/
├── README.md               # Vue d'ensemble et navigation
├── epics/
│   └── epic.md             # Description de l'épopée principale
├── mvp/
│   └── user-stories.md     # User stories du MVP avec cases à cocher
└── iterations/
    └── <NomItération>/
        └── user-stories.md # User stories par itération avec cases à cocher
```

### Annotations pour l'IA

Chaque fichier markdown généré contient :
- **Instructions générales** pour guider l'IA dans l'utilisation des documents
- **Instructions spécifiques** selon le type de fichier (Epic, MVP, Itération)
- **Critères d'acceptation et tâches** formatés avec des cases à cocher pour le suivi
- **Indications de priorité et dépendances** pour faciliter l'implémentation

### Extension et évolutivité
- Le serveur MCP est conçu pour accueillir d'autres outils (tools MCP) facilement, via un handler centralisé.
- Toute nouvelle fonctionnalité peut bénéficier du même pipeline de validation et de feedback.

### Sécurité et conformité MCP
- Le flux garantit la conformité à la spec Model Context Protocol ([modelcontextprotocol.io](https://modelcontextprotocol.io)).
- Les logs techniques ne polluent jamais stdout (seulement du JSON MCP).
- Les erreurs sont toujours visibles dans l'interface utilisateur.

---

## ✅ Bonnes pratiques
- Plus la description du projet est détaillée, plus le backlog généré sera pertinent.
- Chaque appel à `generateBacklog` crée un nouveau backlog dans `.agile-planner-backlog`.
- Pour utiliser le backlog, chargez les fichiers markdown dans Cascade ou Cursor et suivez les instructions intégrées.
- Demandez à l'IA d'implémenter les user stories dans l'ordre de priorité spécifié.
- Utilisez les cases à cocher pour suivre l'avancement de l'implémentation.
- Ne partagez jamais vos clés API publiquement.

---

## ❓ Questions fréquentes
- **Peut-on générer plusieurs backlogs à la suite ?** Oui, chaque appel à `generateBacklog` est indépendant.
- **Les fichiers générés écrasent-ils les anciens ?** Oui, si vous utilisez le même dossier de sortie. Changez `AGILE_PLANNER_OUTPUT_ROOT` pour générer dans un autre emplacement.
- **Groq ou OpenAI ?** Les deux sont supportés, selon la clé renseignée dans `.env` ou dans la configuration MCP.
- **Je ne vois pas l'outil dans Windsurf ?** Vérifiez que la variable `MCP_EXECUTION` est bien définie à `"true"` dans la configuration.
- **Comment utiliser le backlog généré ?** Chargez les fichiers markdown dans Cascade ou Cursor et demandez à l'IA de suivre les instructions incluses dans les fichiers.

---

## 🔒 Sécurité
- Vos descriptions de projet et backlogs générés restent dans votre espace de travail.
- Les clés API sont gérées par votre administrateur et ne doivent jamais être partagées.

---

## 🚀 Changelog

**v2.x**
- Structure centralisée de fichiers dans `.agile-planner-backlog`
- Instructions détaillées pour l'IA dans chaque type de fichier
- Cases à cocher pour les critères d'acceptation et tâches
- Validation stricte du backlog IA (schéma Ajv, correction automatique, feedback MCP)
- Génération de fichiers uniquement sur JSON valide
- Retour détaillé des erreurs dans Windsurf/Cascade/Cursor
- Architecture handler centralisé tools/call pour évolutivité
- Compatibilité stricte avec la spec MCP

**v1.x**
- Génération automatique de backlog agile (epics, mvp, itérations)
- Export Markdown structuré
- Support OpenAI et Groq

---

## 📄 Licence

Ce service est fourni sous licence MIT. Voir le fichier [LICENCE](LICENCE).

---

## 👋 Besoin d'aide ?
Contactez votre administrateur ou l'équipe support de votre plateforme Windsurf/Cascade/Cursor.
