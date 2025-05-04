# Agile Planner MCP

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

**Agile Planner MCP** vous permet de générer automatiquement un backlog agile complet (Epics, User Stories, MVP, itérations) à partir d'une simple description de projet, directement dans Windsurf, Cascade ou Cursor, sans aucune compétence technique requise.

---

## 🎯 À quoi sert cet outil ?

- Obtenez en quelques secondes un backlog agile structuré, prêt à l’emploi, pour tout type de projet (web, mobile, SaaS, MVP, etc.).
- Exportez automatiquement vos Epics, User Stories et itérations au format Markdown, utilisable dans vos outils de gestion ou de documentation.
- Gagnez du temps et structurez vos projets avec l’intelligence artificielle (OpenAI ou Groq).

---

## 🚦 Mise en service dans Windsurf / Cascade / Cursor

Demandez à votre administrateur ou à votre équipe technique d’ajouter ce serveur MCP dans la configuration de votre espace :

```json
{
  "mcpServers": {
    "agile-planner-local": {
      "command": "node",
      "args": ["D:/Projets-dev/MCP/AgilePlanner/server/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "MCP_EXECUTION": "true"
      }
    }
  }
}
```

Une fois activé, l’outil `generateBacklog` s’affichera automatiquement dans la liste des outils MCP de votre interface.

---

## 📝 Comment utiliser Agile Planner MCP ?

1. **Sélectionnez l’outil `generateBacklog`** dans Windsurf, Cascade ou Cursor.
2. **Décrivez votre projet** le plus précisément possible dans le champ prévu à cet effet (exemples ci-dessous).
3. **Lancez la génération** :
   - Les fichiers Markdown (epic, user stories, itérations) et le backlog JSON (optionnel) seront générés automatiquement dans votre espace de travail.

---

## 💡 Exemples concrets d’utilisation

**Générer un backlog pour un SaaS**
```json
{
  "project": "SaaS de gestion de tâches collaboratif pour PME. Fonctionnalités attendues : gestion de projets, tâches, notifications, intégration Slack, mobile-first, RGPD."
}
```

**Refonte d’application mobile**
```json
{
  "project": "Refonte complète de l’application mobile e-commerce. Objectifs : UX moderne, paiement Apple/Google Pay, notifications push, analytics, accessibilité AA."
}
```

**MVP rapide**
```json
{
  "project": "MVP d’une plateforme de réservation de salles de réunion pour startups, avec authentification Google, calendrier partagé, et notifications email."
}
```

---

## 🛡️ Architecture technique & Robustesse

### Flux de validation IA et génération de backlog

- **Validation stricte IA** : Toute réponse générée par l’IA (OpenAI ou Groq) est validée localement via un schéma JSON exhaustif (Ajv). Si la réponse n’est pas conforme, elle est repromptée automatiquement jusqu’à 3 fois.
- **Aucune génération de fichier** n’a lieu tant que la réponse IA n’est pas strictement conforme au schéma attendu.
- **Feedback JSON-RPC/MCP** : Toute erreur de validation ou d’exécution est renvoyée dans le champ `error` de la réponse MCP, donc visible dans Windsurf/Cascade/Cursor.
- **Logs** : Toutes les étapes clefs (appel IA, validation, génération, erreurs) sont loggées sur stderr pour auditabilité.
- **Structure générée** :
  - `epics/epic.md` : description de l’épopée principale
  - `mvp/user-stories.md` : user stories du MVP
  - `iterations/<NomItération>/user-stories.md` : user stories par itération

### Extension et évolutivité
- Le serveur MCP est conçu pour accueillir d’autres outils (tools MCP) facilement, via un handler centralisé.
- Toute nouvelle fonctionnalité peut bénéficier du même pipeline de validation et de feedback.

### Sécurité et conformité MCP
- Le flux garantit la conformité à la spec Model Context Protocol ([modelcontextprotocol.io](https://modelcontextprotocol.io)).
- Les logs techniques ne polluent jamais stdout (seulement du JSON MCP).
- Les erreurs sont toujours visibles dans l’interface utilisateur.

---

## ✅ Bonnes pratiques
- Plus la description du projet est détaillée, plus le backlog généré sera pertinent.
- Chaque appel à `generateBacklog` crée un nouveau backlog, sans modifier les précédents.
- Les fichiers générés portent toujours le même nom : pensez à les sauvegarder ailleurs si vous souhaitez conserver plusieurs versions.
- Ne partagez jamais vos clés API publiquement.

---

## ❓ Questions fréquentes
- **Peut-on générer plusieurs backlogs à la suite ?** Oui, chaque appel à `generateBacklog` est indépendant.
- **Les fichiers générés écrasent-ils les anciens ?** Oui, si les noms sont identiques. Changez de dossier ou sauvegardez avant de relancer.
- **Groq ou OpenAI ?** Les deux sont supportés, selon la clé renseignée dans `.env`.
- **Je ne vois pas l’outil dans mon interface ?** Contactez votre administrateur ou équipe technique pour vérifier la configuration MCP.

---

## 🔒 Sécurité
- Vos descriptions de projet et backlogs générés restent dans votre espace de travail.
- Les clés API sont gérées par votre administrateur et ne doivent jamais être partagées.

---

## 🚀 Changelog

**v2.x**
- Validation stricte du backlog IA (schéma Ajv, correction automatique, feedback MCP)
- Génération de fichiers uniquement sur JSON valide
- Retour détaillé des erreurs dans Windsurf/Cascade/Cursor
- Architecture handler centralisé tools/call pour évolutivité

**v1.x**
- Génération automatique de backlog agile (epics, mvp, itérations)
- Export Markdown structuré
- Support OpenAI et Groq

---

## 📄 Licence

Ce service est fourni sous licence MIT. Voir le fichier [LICENCE](LICENCE).

---

## 👋 Besoin d’aide ?
Contactez votre administrateur ou l’équipe support de votre plateforme Windsurf/Cascade/Cursor.
