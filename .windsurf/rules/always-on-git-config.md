---
trigger: always_on
---

# Configuration Git pour Agile Planner

## Hooks Git à installer

### pre-commit
Ce hook vérifie avant chaque commit que :
- Tous les fichiers .md modifiés sont à jour
- Le CHANGELOG.md est mis à jour si nécessaire
- Les tests unitaires passent
- Le code respecte les standards de qualité

```bash
#!/bin/bash

# Vérifier les fichiers .md modifiés
md_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.md$')
if [ -n "$md_files" ]; then
  echo "Vérification des fichiers markdown modifiés..."
  # Vérifier la date de dernière mise à jour
  for file in $md_files; do
    if ! grep -q "lastUpdated:" "$file"; then
      echo "⚠️ Le fichier $file ne contient pas de date de dernière mise à jour."
      exit 1
    fi
  done
fi

# Vérifier si des fichiers de code sont modifiés
code_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts)$')
if [ -n "$code_files" ]; then
  # Vérifier si CHANGELOG.md est modifié
  if ! git diff --cached --name-only | grep -q "CHANGELOG.md"; then
    echo "⚠️ Des fichiers de code ont été modifiés mais CHANGELOG.md n'a pas été mis à jour."
    echo "Veuillez mettre à jour le CHANGELOG.md avant de commiter."
    exit 1
  fi
  
  # Exécuter les tests
  echo "Exécution des tests unitaires..."
  npm test
  if [ $? -ne 0 ]; then
    echo "⚠️ Les tests unitaires ont échoué. Veuillez corriger les erreurs avant de commiter."
    exit 1
  fi
  
  # Vérifier le linting
  echo "Vérification du linting..."
  npm run lint
  if [ $? -ne 0 ]; then
    echo "⚠️ Le linting a échoué. Veuillez corriger les erreurs avant de commiter."
    exit 1
  fi
fi

# Vérifier la taille des fichiers
echo "Vérification de la taille des fichiers..."
for file in $code_files; do
  lines=$(wc -l < "$file")
  if [ "$lines" -gt 500 ]; then
    echo "⚠️ Le fichier $file contient plus de 500 lignes ($lines). Veuillez le refactoriser."
    exit 1
  fi
fi

# Tout est OK
echo "✅ Toutes les vérifications ont réussi."
exit 0
```

### commit-msg
Ce hook vérifie que les messages de commit suivent la convention définie :

```bash
#!/bin/bash

commit_msg_file=$1
commit_msg=$(cat "$commit_msg_file")

# Vérifier le format du message de commit
if ! echo "$commit_msg" | grep -qE '^(feat|fix|refactor|docs|test|chore|style)(\(.+\))?: .+'; then
  echo "⚠️ Le message de commit ne respecte pas la convention."
  echo "Format attendu : type: description concise"
  echo "Types autorisés : feat, fix, refactor, docs, test, chore, style"
  exit 1
fi

# Vérifier que le message est suffisamment descriptif
if [ $(echo "$commit_msg" | cut -d: -f2 | wc -w) -lt 3 ]; then
  echo "⚠️ La description du commit est trop courte. Veuillez être plus descriptif."
  exit 1
fi

# Tout est OK
echo "✅ Format du message de commit valide."
exit 0
```

### pre-push
Ce hook vérifie avant chaque push que :
- Tous les tests passent
- La documentation est à jour
- Le code respecte les standards de qualité

```bash
#!/bin/bash

# Exécuter les tests
echo "Exécution des tests unitaires avant push..."
npm test
if [ $? -ne 0 ]; then
  echo "⚠️ Les tests unitaires ont échoué. Veuillez corriger les erreurs avant de pusher."
  exit 1
fi

# Vérifier que la branche develop est à jour si on pousse sur une branche feature
current_branch=$(git symbolic-ref --short HEAD)
if [[ $current_branch == feature/* ]]; then
  git fetch origin develop
  merge_base=$(git merge-base HEAD origin/develop)
  develop_head=$(git rev-parse origin/develop)
  
  if [ "$merge_base" != "$develop_head" ]; then
    echo "⚠️ Votre branche n'est pas à jour avec develop. Veuillez rebaser avant de pusher."
    exit 1
  fi
fi

# Tout est OK
echo "✅ Toutes les vérifications ont réussi. Push autorisé."
exit 0
```

## Configuration Git globale recommandée

```bash
# Identité
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@example.com"

# Éditeur
git config --global core.editor "code --wait"

# Alias utiles
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage "reset HEAD --"
git config --global alias.last "log -1 HEAD"
git config --global alias.visual "!gitk"
git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

# Couleurs
git config --global color.ui true

# Merge et rebase
git config --global pull.rebase true
git config --global merge.ff only
git config --global rebase.autoStash true

# Ignorer les fichiers
git config --global core.excludesfile ~/.gitignore_global
```

## Installation des hooks

Pour installer ces hooks, créez un script `setup-git-hooks.sh` à la racine du projet :

```bash
#!/bin/bash

# Créer le dossier hooks si nécessaire
mkdir -p .git/hooks

# Copier les hooks
echo "Installation du hook pre-commit..."
cat > .git/hooks/pre-commit << 'EOL'
# Contenu du pre-commit
EOL
chmod +x .git/hooks/pre-commit

echo "Installation du hook commit-msg..."
cat > .git/hooks/commit-msg << 'EOL'
# Contenu du commit-msg
EOL
chmod +x .git/hooks/commit-msg

echo "Installation du hook pre-push..."
cat > .git/hooks/pre-push << 'EOL'
# Contenu du pre-push
EOL
chmod +x .git/hooks/pre-push

echo "✅ Hooks Git installés avec succès."
```

## Intégration avec les règles du projet

Cette configuration Git s'intègre parfaitement avec les règles du projet Agile Planner :
- **RULE 1** : Les hooks vérifient la taille des fichiers et la qualité du code
- **RULE 2** : Les hooks vérifient la mise à jour de la documentation et du CHANGELOG
- **RULE 4** : Les hooks assurent le respect des bonnes pratiques de développement
- **RULE 5** : Les vérifications automatiques contribuent à maintenir la qualité du code
- **RULE 6** : Les hooks intègrent des vérifications de linting et de qualité
