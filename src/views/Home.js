import React, { useEffect,useState } from 'react';
import { useDataEngine } from '@dhis2/app-runtime';
import { utilgetCodeByName } from '../utils/utils';
import { ReportOverview } from './ReportOverview';


export const Home = () => {
    const engine = useDataEngine();
    const [code, setCode] = useState(null);

    const constantsQuery = {
        constants: {
            resource: "constants",
            params: {
                fields: ['id', 'name', 'code']
            }
        }
    };

    // const getCodeByName = (name) => {
    //     const sessionStorageConstants = sessionStorage.getItem('constants');
    //     const constants = JSON.parse(sessionStorageConstants);
    //     if (Array.isArray(constants)) {
    //         const item = constants.find(d => d.name === name);
    //         if (item) {
    //             const codeWithoutName = item.code.replace(name + '-', '');
    //             return codeWithoutName;
    //         }
    //     }
    //     return null;
    // };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await engine.query(constantsQuery);
                if (response && response.constants && Array.isArray(response.constants.constants)) {
                    sessionStorage.setItem('constants', JSON.stringify(response.constants.constants));
                    const code = utilgetCodeByName('jtrain-TEI-Type-Staff');
                    setCode(code);
                }
            } catch (error) {
                console.error('Error running query', error);
            }
        };

        fetchData();
    }, [engine]);


    return (
        <div>
            <h1>Home</h1>
            {/* <p>Code for 'jtrain-TEI-Type-Staff': {code}</p> */}
            <ReportOverview />
        </div>
    );
}