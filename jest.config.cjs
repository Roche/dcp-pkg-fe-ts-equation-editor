module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        "**/__tests__/**/*.test.ts"
    ],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    // Sources import siblings with a `.js` suffix (NodeNext ESM); map them back to the .ts files.
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }]
    },
    reporters: [
        "default",
        ["jest-junit", { "outputDirectory": "./reports", "outputName": "junit.xml" }]
    ]
};
