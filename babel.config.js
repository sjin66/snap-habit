module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      'nativewind/babel',
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@screens': './src/screens',
            '@components': './src/components',
            '@services': './src/services',
            '@native': './src/native',
            '@stores': './src/stores',
            '@hooks': './src/hooks',
            '@types': './src/types',
            '@utils': './src/utils',
            '@constants': './src/constants',
            '@navigation': './src/navigation',
          },
        },
      ],
    ],
  };
};
