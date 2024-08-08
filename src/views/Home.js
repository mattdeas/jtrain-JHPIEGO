import React, { useEffect,useState } from 'react';
import { useDataEngine } from '@dhis2/app-runtime';
import { ReportOverview } from './ReportOverview';


export const Home = () => {
    const engine = useDataEngine();

    const [config, setConfig] = useState(null);

    useEffect(() => {
        fetch('/jtrain-config.json')
            .then(response => response.json())
            .then(data => sessionStorage.setItem('config', JSON.stringify(data)))
            .catch(error => console.error('Error fetching config:', error));
    }, []);

    

    const constantsQuery = {
        constants: {
            resource: "constants",
            params: {
                fields: ['id', 'name', 'code']
            }
        }
    };

    

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await engine.query(constantsQuery);
                if (response && response.constants && Array.isArray(response.constants.constants)) {
                    sessionStorage.setItem('constants', JSON.stringify(response.constants.constants));
                }
            } catch (error) {
                console.error('Error running query', error);
            }
        };

        fetchData();
    }, [engine]);

    
    

    //const testvalue = utilConfigConstantValueByName('CourseEndDate');

    return (
        <div>
            <h1>Home</h1>
            {/* <p>API Base URL: {testvalue}</p> */}
            <ReportOverview />
        </div>
    );
}