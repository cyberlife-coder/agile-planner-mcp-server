require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '[OK]' : '[ABSENT]');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '[OK]' : '[ABSENT]');
if (process.env.OPENAI_API_KEY) {
  console.log('Valeur (premiers caractères):', process.env.OPENAI_API_KEY.slice(0, 8) + '...');
}
if (process.env.GROQ_API_KEY) {
  console.log('Valeur (premiers caractères):', process.env.GROQ_API_KEY.slice(0, 8) + '...');
}
