module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        "**/__tests__/**/*.test.ts"
    ],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    reporters: [
        "default",
        ["jest-junit", { "outputDirectory": "./reports", "outputName": "junit.xml" }]
    ]
};