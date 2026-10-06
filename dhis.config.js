module.exports = {
    type: 'app',
    entryPoints: { app: './src/App.js' },
    api: { url: 'https://dhis2.jhpiego.org' },
    devServer: {
        proxy: {
            '/api': { target: 'https://dhis2.jhpiego.org', changeOrigin: true, secure: false },
            '/dhis-web-commons': { target: 'https://dhis2.jhpiego.org', changeOrigin: true, secure: false },
            '/oauth': { target: 'https://dhis2.jhpiego.org', changeOrigin: true, secure: false }
        }
    }
}
