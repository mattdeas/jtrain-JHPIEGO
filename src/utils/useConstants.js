/**
 * useConstants
 * Loads all DHIS2 system constants and caches them in sessionStorage under 'constants'
 * (only if not already cached). Returns nothing - consumers read the cache via the
 * helpers in utils.js.
 *
 * Note: not currently imported anywhere; useFetchAndStoreConstants in utils.js does the same job.
 */
import { useEffect } from 'react';
import { useDataQuery } from '@dhis2/app-runtime';

export const useConstants = () => {
    const constantsQuery = {
        constants: {
            resource: 'constants',
            params: {
                fields: ['displayName', 'id', 'code', 'value'],
                paging: false,
            },
        },
    };

    const { loading, error, data } = useDataQuery(constantsQuery);
console.log('data is:',data)
    useEffect(() => {
        if (!loading && !error && data) {
            if (sessionStorage.getItem('constants') == null) {
                sessionStorage.setItem('constants', JSON.stringify(data.constants));
                console.log('sessionStorage Set')
            }
        }
    }, [loading, error, data]);
}