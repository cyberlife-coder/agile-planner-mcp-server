// TEST TEMPORAIREMENT DÉSACTIVÉ (TDD Wave 8) - À résoudre en priorité dans une prochaine MR
test.skip('Dummy error test', () => {
  process.stdout.write('STDOUT OK\n');
  process.stderr.write('STDERR OK\n');
  expect(true).toBe(false);
});
