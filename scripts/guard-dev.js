if (process.env.NODE_ENV === 'production') {
  console.error(
    'ERRO: Este script não pode ser executado em NODE_ENV=production.',
  );
  process.exit(1);
}
