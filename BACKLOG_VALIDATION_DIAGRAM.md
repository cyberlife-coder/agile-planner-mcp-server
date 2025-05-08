# Diagrammes d'architecture de validation du Backlog

Ce document présente les diagrammes Mermaid illustrant l'architecture et les flux de la validation du backlog, conformément à la RULE 7 (Documentation visuelle avec Mermaid).

*Dernière mise à jour: 08/05/2025*

## Diagramme 1: Normalisation des formats de Backlog

```mermaid
flowchart TD
    A[Backlog d'entrée] --> B{Détection format}
    B -->|Format "epic"| C[Normalisation vers format "epics"]
    B -->|Format "epics"| D[Normalisation vers format "epic"]
    B -->|Les deux formats présents| E[Backlog déjà normalisé]
    
    C --> F[Backlog normalisé]
    D --> F
    E --> F
    
    F --> G[Validation avec schema]
    G --> H{Validation réussie?}
    
    H -->|Oui| I[Résultat: valid=true]
    H -->|Non| J[Résultat: valid=false, errors=[...]]
```

## Diagramme 2: Architecture des Validateurs (Pattern Strategy)

```mermaid
classDiagram
    class SchemaValidatorStrategy {
        <<abstract>>
        +schema: Object
        +validate(data): Result
        +validateAgainstSchema(data, schema): Result
        +extractData(data): Object
    }
    
    class BacklogValidator {
        -epicValidator: EpicValidator
        -userStoryValidator: UserStoryValidator
        -supportLegacyFormat: boolean
        +validate(backlog): Result
        +normalizeBacklog(backlog): Object
        +validateMvp(backlog, errors): void
        +validateIterations(backlog, errors): void
    }
    
    class EpicValidator {
        +validate(epic): Result
    }
    
    class FeatureValidator {
        +validate(feature): Result
    }
    
    class UserStoryValidator {
        +validate(userStory): Result
    }
    
    class IterationValidator {
        +validate(iteration): Result
    }
    
    class ValidatorsFactory {
        -_userStoryValidator: UserStoryValidator
        -_featureValidator: FeatureValidator
        -_epicValidator: EpicValidator
        -_iterationValidator: IterationValidator
        -_backlogValidator: BacklogValidator
        +getUserStoryValidator(): UserStoryValidator
        +getFeatureValidator(): FeatureValidator
        +getEpicValidator(): EpicValidator
        +getIterationValidator(): IterationValidator
        +getBacklogValidator(): BacklogValidator
        +validate(data, type): Result
    }
    
    SchemaValidatorStrategy <|-- BacklogValidator
    SchemaValidatorStrategy <|-- EpicValidator
    SchemaValidatorStrategy <|-- FeatureValidator
    SchemaValidatorStrategy <|-- UserStoryValidator
    SchemaValidatorStrategy <|-- IterationValidator
    
    ValidatorsFactory --> BacklogValidator : creates
    ValidatorsFactory --> EpicValidator : creates
    ValidatorsFactory --> FeatureValidator : creates
    ValidatorsFactory --> UserStoryValidator : creates
    ValidatorsFactory --> IterationValidator : creates
    
    BacklogValidator --> EpicValidator : uses
    BacklogValidator --> UserStoryValidator : uses
```

## Diagramme 3: Processus de validation du Backlog

```mermaid
sequenceDiagram
    participant Client
    participant BacklogGenerator
    participant ValidatorsFactory
    participant BacklogValidator
    
    Client->>BacklogGenerator: generateBacklog(projectName, description)
    BacklogGenerator->>BacklogGenerator: createApiMessages()
    BacklogGenerator->>BacklogGenerator: callApiForBacklog()
    BacklogGenerator->>ValidatorsFactory: validate(backlog, 'backlog')
    ValidatorsFactory->>BacklogValidator: validate(backlog)
    
    BacklogValidator->>BacklogValidator: extractData(backlog)
    BacklogValidator->>BacklogValidator: normalizeBacklog(extractedBacklog)
    
    alt Format epic (singulier)
        BacklogValidator->>BacklogValidator: Convertir epic en epics[]
    else Format epics (pluriel) 
        BacklogValidator->>BacklogValidator: Extraire epic de epics[0]
    end
    
    BacklogValidator->>BacklogValidator: validateAgainstSchema(normalizedBacklog)
    BacklogValidator->>BacklogValidator: validateMvp(normalizedBacklog)
    BacklogValidator->>BacklogValidator: validateIterations(normalizedBacklog)
    
    BacklogValidator-->>ValidatorsFactory: {valid: true/false, errors?}
    ValidatorsFactory-->>BacklogGenerator: {valid: true/false, errors?}
    
    alt Validation réussie
        BacklogGenerator-->>Client: {success: true, result: backlog}
    else Validation échouée
        BacklogGenerator-->>Client: {success: false, error}
    end
```

Ces diagrammes respectent les principes de la RULE 7 :
- Maximum 7±2 éléments par diagramme
- Un seul concept clair par diagramme
- Noms explicites et organisation logique
