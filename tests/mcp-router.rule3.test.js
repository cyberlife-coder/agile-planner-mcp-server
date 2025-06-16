const fs = require('fs-extra');
jest.mock('fs-extra', () => ({
  ensureDirSync: jest.fn(),
  writeFileSync: jest.fn()
}));

const {
  validateRule3Params,
  createBaseDirectories,
  createFeatureDirectories,
  createUserStoriesReadme,
  writeTrackingFiles
} = require('../server/lib/mcp-router');

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Rule3 helper functions', () => {
  test('validateRule3Params returns defaults when inputs invalid', () => {
    const res = validateRule3Params('', {}, { feature: { title: 'f' } });
    expect(res.validBacklogDir).toBe(process.cwd());
    expect(res.validEpicToUse.title).toBe('Default Epic');
  });

  test('validateRule3Params returns null when adaptedResult missing', () => {
    expect(validateRule3Params('dir', { title: 'e' }, null)).toBeNull();
  });

  test('createBaseDirectories calls fs.ensureDirSync', () => {
    createBaseDirectories('/tmp');
    expect(fs.ensureDirSync).toHaveBeenCalled();
  });

  test('createBaseDirectories returns false on error', () => {
    fs.ensureDirSync.mockImplementationOnce(() => { throw new Error('fail'); });
    expect(createBaseDirectories('/tmp')).toBe(false);
  });

  test('createFeatureDirectories ensures dirs and returns slugs', () => {
    const result = createFeatureDirectories('/tmp', { title: 'Epic' }, { feature: { title: 'Feat' } });
    expect(result.epicSlug).toBe('epic');
    expect(fs.ensureDirSync).toHaveBeenCalledTimes(4);
  });

  test('createUserStoriesReadme writes file when no stories', () => {
    createUserStoriesReadme('/tmp/us', { userStories: [] });
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('createUserStoriesReadme does nothing when stories exist', () => {
    createUserStoriesReadme('/tmp/us', { userStories: [{ title: 's' }] });
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('writeTrackingFiles writes tracking files', () => {
    writeTrackingFiles('/tmp', '/tmp/feat', '/tmp/us', { feature: { title: 'F' }, userStories: [] }, { title: 'E' });
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test('writeTrackingFiles writes stories-info only when stories exist', () => {
    writeTrackingFiles('/tmp', '/tmp/feat', '/tmp/us', { feature: { title: 'F' }, userStories: [{ title: 'S' }] }, { title: 'E' });
    const writeCalls = fs.writeFileSync.mock.calls.filter(c => c[0].includes('stories-info.json'));
    expect(writeCalls.length).toBe(1);
  });
});
