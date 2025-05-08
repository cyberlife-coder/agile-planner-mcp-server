test('Dummy error test', () => {
  process.stdout.write('STDOUT OK\n');
  process.stderr.write('STDERR OK\n');
  expect(true).toBe(false);
});
