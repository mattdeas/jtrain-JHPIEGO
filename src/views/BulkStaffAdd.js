import React, { useState } from 'react';
import { useDataEngine } from '@dhis2/app-runtime';
import Papa from 'papaparse';
import { utilGetConstantValueByName } from '../utils/utils';

export const BulkStaffAdd = () => {
    const [csvData, setCsvData] = useState();
    const [message, setMessage] = useState('');
    const engine = useDataEngine();

    const defStaffOrgUnitId = utilGetConstantValueByName('jtrain-DefaultStaffOrgUnit');
    const defStaffProgId = utilGetConstantValueByName('jtrain-staffprogram');
    const defStaffEntityType = utilGetConstantValueByName('jtrain-TEI-Type-Staff');
    const defLocationTEA = utilGetConstantValueByName('jtrain-location-TEA');

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        Papa.parse(file, {
            header: true,
            complete: (results) => {
                console.log('Parsed CSV Data:', results.data); // Log parsed data
                setCsvData(results.data);
            },
        });
    };

    const handleBulkAdd = async () => {
        console.log('handleBulkAdd called'); // Log function call
        if (!csvData) {
            setMessage('No CSV data available');
            console.log('No CSV data available'); // Log missing CSV data
            return;
        }

        for (const staff of csvData) {
            const newEntity = {
                attributes: Object.keys(staff).map(key => ({
                    attribute: key,
                    value: staff[key],
                })),
                program: defStaffProgId,
                orgUnit: defStaffOrgUnitId,
                trackedEntityType: defStaffEntityType,
            };

            try {
                console.log('Creating new entity:', newEntity); // Log new entity data
                const createResponse = await engine.mutate({
                    resource: 'trackedEntityInstances',
                    type: 'create',
                    data: newEntity,
                });

                console.log('Create response:', createResponse); // Log create response
                const teiId = createResponse.response.importSummaries[0].reference;

                const enrollmentData = {
                    trackedEntityInstance: teiId,
                    program: defStaffProgId,
                    orgUnit: defStaffOrgUnitId,
                    enrollmentDate: new Date().toISOString().split('T')[0],
                    incidentDate: new Date().toISOString().split('T')[0],
                };

                console.log('Enrolling entity:', enrollmentData); // Log enrollment data
                await engine.mutate({
                    resource: 'enrollments',
                    type: 'create',
                    data: enrollmentData,
                });

                setMessage('All staff members created and enrolled successfully');
            } catch (error) {
                console.error('Error creating or enrolling staff member:', error);
                console.error('Error details:', error); // Log detailed error
                setMessage('Error creating or enrolling some staff members');
            }
        }
    };

    return (
        <div>
            <h1>Bulk Add Staff</h1>
            <input type="file" accept=".csv" onChange={handleFileUpload} />
            <button onClick={handleBulkAdd}>Add Staff</button>
            {message && <p>{message}</p>}
        </div>
    );
};