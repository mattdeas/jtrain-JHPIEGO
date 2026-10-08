/**
 * MyComponent (test page at /testtree)
 * Sandbox for the OrganisationUnitTree and CalendarInput components. Also caches
 * DHIS2 constants into sessionStorage on mount.
 */
import { useDataQuery, useDataEngine } from '@dhis2/app-runtime'
import { OrganisationUnitTree , CalendarInput} from '@dhis2/ui';
import React, {useState, useEffect} from 'react'

const MyComponent = () => {
    const [selected, setSelected] = useState([]);

    const handleSelect = ({ id }) => {
        setSelected(id);
    };

    const onTreeChange = ({ selected }) => {
        setSelected(selected);
        
    }

    const constantsQuery = {
        constants: {
            resource: 'constants',
            params: {
                fields: ['displayName', 'id', 'code', 'value'],
                paging: false,
            },
        },
    };

    const engine = useDataEngine();
    // Cache constants once per session.
    // Note: engine.query resolves to the data itself, so `data` here is undefined and nothing is stored.
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (sessionStorage.getItem('constants') == null) {
                    const { loading, error, data } = await engine.query(constantsQuery);
                    console.log('data:', data);

                    if (!loading && !error && data) {
                        sessionStorage.setItem('constants', JSON.stringify(data.constants));
                        console.log('sessionStorage Set')
                    }
                }
            } catch (error) {
                console.log('Caught error:', error);
            }
        };

        fetchData();
    }, [engine]);



    return (
        <div>
            <OrganisationUnitTree
                roots={['VgrqnQEtyOP']} // replace with your root organisation unit ID
                selected={selected}
                onChange={onTreeChange}
                singleSelection
            />

<CalendarInput date="2021-10-13"     dir="ltr"
    locale="en-CA"
    timeZone="Africa/Khartoum"
    weekDayFormat="short" />
    
        </div>
    );
};

export default MyComponent;