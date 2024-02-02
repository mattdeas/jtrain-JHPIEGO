import { useDataQuery,useDataMutation } from '@dhis2/app-runtime'
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui'
import React, { useState } from 'react'
import { Link, BrowserRouter, Switch, Route } from 'react-router-dom'


function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const handleResize = debounce(() => {
}, 200);

window.addEventListener('resize', handleResize);

const itemsPerPage = 10;
//const [currentPage, setCurrentPage] = useState(1);

const qryConstants = {
    // One query object in the whole query
    attributes: {
        // The `attributes` endpoint should be used
        resource: 'constants',
        params: {
            // Paging is disabled
            paging: false,
            // Only the attribute properties that are required should be loaded
            fields: 'id, displayName, code, value',
        },
    },
}


const query = {
    // "page" variable below can be dinamically passed via refetch (see "handlePageChange" below)
    instances: {
        resource: 'trackedEntityInstances',
        params: ({ ou ,trackedEntityType }) => ({
            ou : ou,
            trackedEntityType : trackedEntityType,
        }),
    },
}

const mutationRelationships = {
    resource: 'relationships',
    type: 'create',
    data: ({ trackedEntityInstance, courseId, score, type }) => ({
        relationshipType: 'ZBUwOGosqI0',
        from: {
            trackedEntityInstance: {
                trackedEntityInstance: courseId,
            },
        },
        to: {
            trackedEntityInstance: {
                trackedEntityInstance: trackedEntityInstance,
            },
        },
        
    }),
};

//yuAHL6dRErF
//k7bpJin78fB



const mutation = {
    resource: 'events',
    type: 'create',
    data: ({ event }) => event,
};
//https://dhis2.af.jhpiego.org/api/trackedEntityInstances?ou=x0Zl6eKgC7B&trackedEntityType=W9FNXXgGbm7

export const StaffSearchAttendees = ({eventID}) => {
    // This is yet another functionality provided by the `@dhis2/app-runtime`
    // For the time being it does not matter what this does exactly
    // * loading will be true while the data is being loaded
    // * error will be an instance of `Error` if something fails
    // * data will be null while the data is being loaded or if something fails
    // * data will be an object once loading is done with the following path
    //   data.attributes.attributes <- That's an array of objects
    //const [mutate, { loading: mutationLoading, error: mutationError }] = useDataMutation(mutationRelationships);
    
    const dSysConstants = useDataQuery(qryConstants)

    let staffMemberid, defaultStaffOrgUnit;
    console.log({ dSysConstants })
    // Check if dSysConstants and constants exist
    if (dSysConstants && dSysConstants.data && dSysConstants.data.attributes && dSysConstants.data.attributes.constants) {
        // Find the jtrain-StaffMember and jtrain-DefaultStaffOrgUnit objects
        const staffMemberObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-StaffMember');
        const defaultStaffOrgUnitObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-DefaultStaffOrgUnit');

        console.log(staffMemberObj)
        console.log(defaultStaffOrgUnitObj)
        // Extract the values
        staffMemberid = staffMemberObj ? staffMemberObj.code : null;
        defaultStaffOrgUnit = defaultStaffOrgUnitObj ? defaultStaffOrgUnitObj.code : null;

        console.log('Constants Loaded')// Log the values to the console
        
    }
    //console.log({ dSysConstants });

    //const { loading, error, data } = useDataQuery(qryTrackedEntityTypes)
    //console.log({ loading, error, data });
    console.log({ staffMemberid, defaultStaffOrgUnit });
    const { loading, error, data } = useDataQuery(query, {
        variables: {
            ou: 'VgrqnQEtyOP',
            trackedEntityType: 'W9FNXXgGbm7',
        },
    })

    // State variable for search term
    const [searchTerm, setSearchTerm] = useState('');

    // Function to handle search term input change
    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
    }

    const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const mutation = {
        resource: 'events',
        type: 'create',
        data: ({ trackedEntityInstance }) => ({
            events: [
                {
                    trackedEntityInstance,
                    program: 'Ss21byybIqu',
                    programStage: 'Y6scAJvghc0',
                    enrollment: 'qIuyPn7AVu2',
                    orgUnit: 'VgrqnQEtyOP',
                    dataValues: [
                        {
                            dataElement: 'tsU3YD7kfYU',
                            value: eventID,
                        },
                    ],
                    status: 'ACTIVE',
                    eventDate: formattedDate,
                },
            ],
        }),
    };
    const [mutate, { loading: mutationLoading, error: mutationError }] = useDataMutation(mutation);

    const handleAssign = async (trackedEntityInstance) => {
        const { error } = await mutate({ trackedEntityInstance });
        console.log('mutation', mutate)
        if (error) {
            console.error('Error creating event:', error);
        } else {
            console.log('Event created successfully');
        }
    };
    

    return (
        <div>
            <h3>Search Staff to Assign </h3>

            <input type="text" value={searchTerm} onChange={handleSearchTermChange} />

            {
                // display that the data is being loaded
                // when loading is true
                loading && 'Loading...'
            }

            {
                // display the error message
                // is an error occurred
                error && error.message
                
            }

            {
                // if there is any data available
                data?.instances?.trackedEntityInstances && (
                    <Table>
      <TableHead>
        <TableRowHead>
          <TableCellHead>Family Name</TableCellHead>
          <TableCellHead>First Name</TableCellHead>
          <TableCellHead>Gender</TableCellHead>
          <TableCellHead>Date of Birth</TableCellHead>
          <TableCellHead>Age</TableCellHead>
          <TableCellHead>Open</TableCellHead>
          <TableCellHead>Assign</TableCellHead>
        </TableRowHead>
      </TableHead>
      <TableBody>
      {data.instances.trackedEntityInstances
    .filter(item => item.attributes.some(attr => attr.displayName === 'Family Name' && attr.value.toLowerCase().includes(searchTerm.toLowerCase())))
    .slice(0, 10)
    .map(
        ({ trackedEntityInstance, attributes }) => {
            // Create an object from the attributes array
            const attributesObj = attributes.reduce((obj, item) => {
                obj[item.displayName] = item.value;
                return obj;
            }, {});

            return (
                <TableRow key={trackedEntityInstance}>
                    <TableCell>{attributesObj['Family Name']}</TableCell>
                    <TableCell>{attributesObj['First Name']}</TableCell>
                    <TableCell>{attributesObj['Gender']}</TableCell>
                    <TableCell>{attributesObj['Date of Birth']}</TableCell>
                    <TableCell>{attributesObj['Age']}</TableCell>
                    <TableCell >
                    
                    <Link to={`/staffview/${trackedEntityInstance}`}>View</Link>
                    </TableCell>
                    <TableCell>{trackedEntityInstance}</TableCell>
                    <TableCell>
                        {/* <button onClick={() => mutate({ trackedEntityInstance, courseId: eventID, score: 99, type: 'ZBUwOGosqI0' })}>
                            Assign
                        </button> */}
                        <button onClick={() => handleAssign(trackedEntityInstance)}>
                            Assign
                        </button>
                    </TableCell>
                </TableRow>
            );
        }
    )}
                        </TableBody>
    </Table>
                )
            }
        </div>
    )
}
            
