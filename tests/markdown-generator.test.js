const { generateMarkdownFilesFromResult, formatUserStory, saveRawBacklog } = require('../server/lib/markdown-generator');
const fs = require('fs-extra');
const path = require('path');
const sinon = require('sinon');

// Load sample backlog for tests
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);

// Wrapper du résultat comme dans la nouvelle structure (success/result/error)
const sampleBacklogResult = {
  success: true,
  result: sampleBacklog
};

describe('Markdown Generator', () => {
  let mockFs;
  let tempDir;
  
  beforeEach(() => {
    // Create temporary directory for tests
    tempDir = path.join(__dirname, 'temp');
    
    // Mock fs-extra functions
    mockFs = {
      writeFile: sinon.stub().resolves(),
      ensureDir: sinon.stub().resolves()
    };
    
    // Replace fs-extra methods with our mocks
    sinon.stub(fs, 'writeFile').callsFake(mockFs.writeFile);
    sinon.stub(fs, 'ensureDir').callsFake(mockFs.ensureDir);
  });
  
  afterEach(() => {
    // Restore original fs-extra methods
    sinon.restore();
  });
  
  describe('formatUserStory', () => {
    test('Formats a user story correctly in Markdown with checkboxes', () => {
      const story = sampleBacklog.mvp[0];
      const formatted = formatUserStory(story);
      
      // Verify formatting contains expected elements
      expect(formatted).toContain(`# User Story ${story.id}: ${story.title}`);
      expect(formatted).toContain(`- [ ] ${story.description}`);
      expect(formatted).toContain(`### Acceptance Criteria`);
      expect(formatted).toContain(`### Technical Tasks`);
      
      // Verify all acceptance criteria are included with checkboxes
      story.acceptance_criteria.forEach(criteria => {
        expect(formatted).toContain(`- [ ] ${criteria}`);
      });
      
      // Verify all tasks are included with checkboxes
      story.tasks.forEach(task => {
        expect(formatted).toContain(`- [ ] ${task}`);
      });
      
      // Verify priority is included
      if (story.priority) {
        expect(formatted).toContain(`**Priority:** ${story.priority}`);
      }
      
      // Verify dependencies if they exist
      if (story.dependencies && story.dependencies.length > 0) {
        expect(formatted).toContain(`**Dependencies:** ${story.dependencies.join(', ')}`);
      }
    });

    test('Includes enhanced AI instructions for status updates', () => {
      const story = sampleBacklog.mvp[0];
      const formatted = formatUserStory(story);
      
      // Verify enhanced instructions are included
      expect(formatted).toContain('🤖');
      expect(formatted).toContain('User Story Instructions for AI');
      expect(formatted).toContain('Mettez à jour le statut des tâches');
      expect(formatted).toContain('[ ]');
      expect(formatted).toContain('[x]');
    });
  });
  
  describe('generateMarkdownFilesFromResult', () => {
    test('Creates necessary directories and Markdown files with proper structure', async () => {
      // Importer la fonction createSlug pour être cohérent avec l'implémentation
      const { createSlug } = require('../server/lib/utils');
      
      // Exécute la fonction à tester
      const result = await generateMarkdownFilesFromResult(sampleBacklog, tempDir);
      
      // Vérifie que la fonction a réussi
      expect(result.success).toBe(true);
      
      // Vérifie que le chemin de sortie utilise bien le dossier .agile-planner-backlog
      const expectedBaseDir = path.join(tempDir, '.agile-planner-backlog');
      
      // 1. Vérifie la création des dossiers principaux
      expect(fs.ensureDir.calledWith(expectedBaseDir)).toBe(true);
      expect(fs.ensureDir.calledWith(path.join(expectedBaseDir, 'epics'))).toBe(true);
      expect(fs.ensureDir.calledWith(path.join(expectedBaseDir, 'planning'))).toBe(true);
      expect(fs.ensureDir.calledWith(path.join(expectedBaseDir, 'planning', 'mvp'))).toBe(true);
      expect(fs.ensureDir.calledWith(path.join(expectedBaseDir, 'planning', 'iterations'))).toBe(true);
      
      // 2. Vérifie la création du README principal avec les nouveaux liens vers la structure hiérarchique
      const readmeCall = fs.writeFile.getCalls().find(call => 
        call.args[0] === path.join(expectedBaseDir, 'README.md')
      );
      expect(readmeCall).toBeDefined();
      if (readmeCall) {
        const content = readmeCall.args[1];
        expect(content).toContain('# Library Management System');
        expect(content).toContain('[Epics](./epics/)');
        expect(content).toContain('[MVP User Stories](./planning/mvp/mvp.md)');
        expect(content).toContain('[Iterations](./planning/iterations/)');
      }

      // 3. Vérifier la structure des épics
      const epicSlug = createSlug(sampleBacklog.epics[0].name);
      const epicDir = path.join(expectedBaseDir, 'epics', epicSlug);
      expect(fs.ensureDir.calledWith(epicDir)).toBe(true);
      
      // Vérifier que le fichier epic.md a été créé
      const epicFilePath = path.join(epicDir, 'epic.md');
      const epicFileCall = fs.writeFile.getCalls().find(call => 
        call.args[0] === epicFilePath
      );
      expect(epicFileCall).toBeDefined();
      
      // 4. Vérifier la structure des features
      const featuresDir = path.join(epicDir, 'features');
      expect(fs.ensureDir.calledWith(featuresDir)).toBe(true);
      
      // Examiner chaque feature de l'epic
      sampleBacklog.epics[0].features.forEach(feature => {
        const featureSlug = createSlug(feature.title);
        const featureDir = path.join(featuresDir, featureSlug);
        expect(fs.ensureDir.calledWith(featureDir)).toBe(true);
        
        // Vérifier que le fichier feature.md a été créé
        const featureFilePath = path.join(featureDir, 'feature.md');
        const featureFileCall = fs.writeFile.getCalls().find(call => 
          call.args[0] === featureFilePath
        );
        expect(featureFileCall).toBeDefined();
      });
      
      // 5. Vérifier la structure des user stories
      const featureSlug = createSlug(sampleBacklog.epics[0].features[0].title);
      const userStoriesDir = path.join(featuresDir, featureSlug, 'user-stories');
      expect(fs.ensureDir.calledWith(userStoriesDir)).toBe(true);
      
      // Vérifier qu'un fichier a été créé pour chaque user story
      const firstUserStory = sampleBacklog.epics[0].features[0].userStories[0];
      const userStorySlug = createSlug(`${firstUserStory.id.toLowerCase()}-${firstUserStory.title}`);
      const userStoryPath = path.join(userStoriesDir, `${userStorySlug}.md`);
      
      const userStoryFileCall = fs.writeFile.getCalls().find(call => 
        call.args[0].includes(userStoryPath)
      );
      expect(userStoryFileCall).toBeDefined();
    });
    
    test('Returns error for invalid backlog result', async () => {
      // Créer un résultat de backlog invalide (sans epics)
      const invalidBacklog = {
        projectName: 'Invalid Project',
        description: 'This is an invalid backlog with no epics',
        // Nous omettons intentionnellement le tableau epics
      };
      
      const result = await generateMarkdownFilesFromResult(invalidBacklog, tempDir);
      
      // Vérifier que la fonction renvoie une erreur
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      // Le message d'erreur exact généré par validateBacklogResult
      expect(result.error.message).toBe('Epics array is missing or not an array in backlog result');
    });
  });
  
  describe('Instructions IA et références croisées', () => {
    test('Les fichiers d\'epic contiennent des instructions IA améliorées', async () => {
      // Importer la fonction createSlug pour être cohérent avec l'implémentation
      const { createSlug } = require('../server/lib/utils');

      // Exécute la fonction à tester
      const result = await generateMarkdownFilesFromResult(sampleBacklog, tempDir);
      
      // Vérifie que la fonction a réussi
      expect(result.success).toBe(true);
      
      // Génère le path avec createSlug
      const epicSlug = createSlug(sampleBacklog.epics[0].name);
      
      // Vérifie le contenu des instructions dans le fichier epic
      const epicFilePath = path.join(tempDir, '.agile-planner-backlog', 'epics', epicSlug, 'epic.md');
      const epicFileCall = fs.writeFile.getCalls().find(call => 
        call.args[0] === epicFilePath
      );
      
      expect(epicFileCall).toBeDefined();
      if (epicFileCall) {
        const content = epicFileCall.args[1];
        expect(content).toContain('🤖 Epic Processing Instructions for AI');
        expect(content).toContain('Comprendre la vision globale');
        expect(content).toContain('Vérifier l\'alignement des User Stories');
      }
    });
    
    test('Les fichiers d\'itération incluent des liens vers les user stories', async () => {
      // Importer la fonction createSlug pour être cohérent avec l'implémentation
      const { createSlug } = require('../server/lib/utils');

      // Exécute la fonction à tester
      const result = await generateMarkdownFilesFromResult(sampleBacklog, tempDir);
      
      // Vérifie que la fonction a réussi
      expect(result.success).toBe(true);
      
      // Vérifie les liens dans les fichiers d'itération
      if (sampleBacklog.iterations && sampleBacklog.iterations.length > 0) {
        const iteration = sampleBacklog.iterations[0];
        const iterationSlug = createSlug(iteration.name);
        const iterationPath = path.join(tempDir, '.agile-planner-backlog', 'planning', 'iterations', iterationSlug, 'iteration.md');
        
        const iterationFileCall = fs.writeFile.getCalls().find(call => 
          call.args[0].includes(iterationPath)
        );
        
        if (iterationFileCall && iteration.stories && iteration.stories.length > 0) {
          const content = iterationFileCall.args[1];
          // Vérifie la présence d'une section "User Stories"
          expect(content).toContain('## User Stories');
          
          // Vérifier que les liens vers les user stories sont inclus
          iteration.stories.forEach(story => {
            expect(content).toContain(story.title);
          });
        }
      }
    });
  });
  
  describe('Structure hiérarchique complète', () => {
    test('Crée une structure hiérarchique avec epics contenant features et user stories', async () => {
      // Importer la fonction createSlug du module utils pour être cohérent avec l'implémentation
      const { createSlug } = require('../server/lib/utils');

      // Le sample backlog contient déjà la structure attendue
      const result = await generateMarkdownFilesFromResult(sampleBacklog, tempDir);
      expect(result.success).toBe(true);
      
      // Vérifie la structure de base
      const expectedBaseDir = path.join(tempDir, '.agile-planner-backlog');
      const expectedEpicsDir = path.join(expectedBaseDir, 'epics');
      expect(fs.ensureDir.calledWith(expectedEpicsDir)).toBe(true);
      
      // Vérifier la structure hiérarchique
      const epicSlug = createSlug(sampleBacklog.epics[0].name);
      const epicDir = path.join(expectedEpicsDir, epicSlug);
      
      // Vérifier que le dossier de l'epic existe
      expect(fs.ensureDir.calledWith(epicDir)).toBe(true);
      
      // Vérifier que le dossier features dans l'epic existe
      const epicFeaturesDir = path.join(epicDir, 'features');
      expect(fs.ensureDir.calledWith(epicFeaturesDir)).toBe(true);
      
      // Vérifier qu'un fichier epic.md a été créé
      const epicFilePath = path.join(epicDir, 'epic.md');
      const epicFileCall = fs.writeFile.getCalls().find(call => 
        call.args[0] === epicFilePath
      );
      expect(epicFileCall).toBeDefined();
      
      // Vérifier pour chaque feature de l'epic
      sampleBacklog.epics[0].features.forEach(feature => {
        const featureSlug = createSlug(feature.title);
        const featureDir = path.join(epicFeaturesDir, featureSlug);
        
        // Vérifier que le dossier de la feature existe
        expect(fs.ensureDir.calledWith(featureDir)).toBe(true);
        
        // Vérifier que le dossier user-stories dans la feature existe
        const userStoriesDir = path.join(featureDir, 'user-stories');
        expect(fs.ensureDir.calledWith(userStoriesDir)).toBe(true);
        
        // Vérifier qu'un fichier feature.md a été créé
        const featureFilePath = path.join(featureDir, 'feature.md');
        const featureFileCall = fs.writeFile.getCalls().find(call => 
          call.args[0] === featureFilePath
        );
        expect(featureFileCall).toBeDefined();
        
        // Vérifier pour chaque user story de la feature
        feature.userStories.forEach(story => {
          const storySlug = createSlug(`${story.id.toLowerCase()}-${story.title}`);
          const storyFilePath = path.join(userStoriesDir, `${storySlug}.md`);
          
          const storyFileCall = fs.writeFile.getCalls().find(call => 
            call.args[0] === storyFilePath
          );
          expect(storyFileCall).toBeDefined();
        });
      });
      
      // Vérifier que le dossier planning existe
      const planningDir = path.join(expectedBaseDir, 'planning');
      expect(fs.ensureDir.calledWith(planningDir)).toBe(true);
      
      // Vérifier que les sous-dossiers mvp et iterations existent dans planning
      const mvpDir = path.join(planningDir, 'mvp');
      const iterationsDir = path.join(planningDir, 'iterations');
      expect(fs.ensureDir.calledWith(mvpDir)).toBe(true);
      expect(fs.ensureDir.calledWith(iterationsDir)).toBe(true);
      
      // Vérifier qu'un fichier mvp.md a été créé
      const mvpFilePath = path.join(mvpDir, 'mvp.md');
      const mvpFileCall = fs.writeFile.getCalls().find(call => 
        call.args[0] === mvpFilePath
      );
      expect(mvpFileCall).toBeDefined();
      
      // Vérifier pour chaque itération
      if (sampleBacklog.iterations && sampleBacklog.iterations.length > 0) {
        sampleBacklog.iterations.forEach(iteration => {
          const iterationSlug = createSlug(iteration.name);
          const iterationDir = path.join(iterationsDir, iterationSlug);
          expect(fs.ensureDir.calledWith(iterationDir)).toBe(true);
          
          const iterationFilePath = path.join(iterationDir, 'iteration.md');
          const iterationFileCall = fs.writeFile.getCalls().find(call => 
            call.args[0] === iterationFilePath
          );
          expect(iterationFileCall).toBeDefined();
        });
      }
    });
    
    test('Les fichiers markdown contiennent des liens croisés entre la structure et la planification', async () => {
      // Importer la fonction createSlug pour être cohérent avec l'implémentation
      const { createSlug } = require('../server/lib/utils');
      
      // Exécution
      const result = await generateMarkdownFilesFromResult(sampleBacklog, tempDir);
      
      // Vérifications
      expect(result.success).toBe(true);
      
      // Vérifier que le fichier MVP contient des liens vers les user stories dans la structure
      const mvpPath = path.join(tempDir, '.agile-planner-backlog', 'planning', 'mvp', 'mvp.md');
      const mvpFileCall = fs.writeFile.getCalls().find(call => 
        call.args[0] === mvpPath
      );
      
      expect(mvpFileCall).toBeDefined();
      if (mvpFileCall) {
        const mvpContent = mvpFileCall.args[1];
        // Vérifier si le contenu contient un lien vers la structure hiérarchique
        expect(mvpContent).toContain('# MVP');
        expect(mvpContent).toContain('User Story');
        
        // Vérifier les liens entre le MVP et les user stories dans la structure hiérarchique
        if (sampleBacklog.mvp && sampleBacklog.mvp.length > 0) {
          // Pour chaque user story dans le MVP, vérifier la présence de son titre dans le contenu
          sampleBacklog.mvp.forEach(story => {
            expect(mvpContent).toContain(story.title);
          });
        }
      }
      
      // Vérifier que les fichiers d'itération contiennent des liens vers les user stories
      if (sampleBacklog.iterations && sampleBacklog.iterations.length > 0) {
        // Pour la première itération du sample
        const iteration = sampleBacklog.iterations[0];
        const iterationSlug = createSlug(iteration.name);
        const iterationPath = path.join(tempDir, '.agile-planner-backlog', 'planning', 'iterations', iterationSlug, 'iteration.md');
        
        const iterationFileCall = fs.writeFile.getCalls().find(call => 
          call.args[0] === iterationPath
        );
        
        expect(iterationFileCall).toBeDefined();
        if (iterationFileCall && iteration.stories && iteration.stories.length > 0) {
          const iterationContent = iterationFileCall.args[1];
          // Vérifier la présence d'une section pour les user stories
          expect(iterationContent).toContain('## User Stories');
          
          // Pour chaque user story dans l'itération, vérifier la présence de son titre
          iteration.stories.forEach(story => {
            expect(iterationContent).toContain(story.title);
          });
        }
      }
    });
  });
  
  describe('saveRawBacklog', () => {
    test('Correctly saves the raw JSON', async () => {
      // La fonction saveRawBacklog reçoit maintenant un résultat OpenAI complet
      // et non plus directement le contenu du backlog
      const apiResult = {
        choices: [
          {
            message: {
              content: JSON.stringify(sampleBacklog)
            }
          }
        ]
      };
      
      const jsonPath = await saveRawBacklog(apiResult, tempDir);
      
      // Le chemin de sortie est désormais dans .agile-planner-backlog/raw
      const expectedPath = path.join(tempDir, '.agile-planner-backlog', 'raw', 'openai-response.json');
      expect(jsonPath).toBe(expectedPath);
      
      // Vérifier que le dossier raw est créé
      expect(fs.ensureDir.calledWith(
        path.join(tempDir, '.agile-planner-backlog', 'raw')
      )).toBe(true);
      
      // Vérifier que le fichier JSON est écrit
      expect(fs.writeFile.calledWith(
        expectedPath,
        sinon.match.string,
        'utf8'
      )).toBe(true);
      
      // Vérifier que le JSON est formaté avec indentation
      const jsonContent = fs.writeFile.getCalls().find(call => 
        call.args[0] === expectedPath
      ).args[1];
      
      // Le JSON doit contenir la réponse complète de l'API
      expect(jsonContent).toContain('"choices"');
    });
  });
});
