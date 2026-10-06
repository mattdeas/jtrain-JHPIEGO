module.exports = {
    type: 'app',
    name: 'jTrain',
    title: 'jTrain',

    entryPoints: {
        app: './src/App.js',
    },

    api: {
        url: 'https://dhis2.jhpiego.org', // remote DHIS2 instance
    },

    devServer: {
        proxy: {
            '/api': {
                target: 'https://dhis2.jhpiego.org',
                changeOrigin: true,
                secure: false,
                logLevel: 'debug',   // <-- helps see proxy activity in console
            },
            '/dhis-web-commons': {
                target: 'https://dhis2.jhpiego.org',
                changeOrigin: true,
                secure: false,
                logLevel: 'debug',
            },
            '/oauth': {
                target: 'https://dhis2.jhpiego.org',
                changeOrigin: true,
                secure: false,
                logLevel: 'debug',
            },
        },
    },
}
