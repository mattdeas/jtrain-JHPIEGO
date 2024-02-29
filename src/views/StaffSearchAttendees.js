import { useDataQuery,useDataMutation, useDataEngine } from '@dhis2/app-runtime'
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui'
import React, { useState, useEffect } from 'react'
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
// SHELVED TILL RELATIONSHIP BUG IS CLEARED
// const mutationRelationships = {
//     resource: 'relationships',
//     type: 'create',
//     data: ({ trackedEntityInstance, eventID, type }) => ({
//         relationshipType: type,
//         from: {
//             event: {
//                 event: eventID,
//             },
//         },
//         to: {
//             trackedEntityInstance: {
//                 trackedEntityInstance: trackedEntityInstance,
//             },
//         },
        
//     }),
// };
let tei_ids = [];
export const StaffSearchAttendees = ({eventID, dataEvent, tei_id, tei_count, dElements, onAssign}) => {

    console.log('dElement',dElements)
    const dSysConstants = useDataQuery(qryConstants)
    let staffMemberid, defaultStaffOrgUnit;
    console.log('dataEvent',dataEvent)
    const dataEngine = useDataEngine();
    console.log({ dSysConstants })
    // Check if dSysConstants and constants exist
    if (dSysConstants && dSysConstants.data && dSysConstants.data.attributes && dSysConstants.data.attributes.constants) {
        // Find the jtrain-TEI-Type-Staff and jtrain-DefaultStaffOrgUnit objects
        const staffMemberObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-TEI-Type-Staff');
        const defaultStaffOrgUnitObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-DefaultStaffOrgUnit');

        console.log(staffMemberObj)
        console.log(defaultStaffOrgUnitObj)
        // Extract the values
        staffMemberid = staffMemberObj ? staffMemberObj.code : null;
        defaultStaffOrgUnit = defaultStaffOrgUnitObj ? defaultStaffOrgUnitObj.code : null;
        
    }


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


    const [dataElement1, setDataElement1] = useState('');
    const [dataElement1Value, setDataElement1Value] = useState('');
    const [dataElement2, setDataElement2] = useState('');
    const [dataElement2Value, setDataElement2Value] = useState(0);


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
                        {
                            dataElement: 'qc3CCyM8VTc',
                            value: 0,
                        },
                        {
                            dataElement: 'HtoYZNR0ch6',
                            value: 0,
                        },
                    ],
                    status: 'ACTIVE',
                    eventDate: formattedDate,
                },
            ],
        }),
    };



    const [mutate, { loading: mutationLoading, error: mutationError }] = useDataMutation(mutation);

    //const [mutateRelationships, { loading: mutationRelationshipsLoading, error: mutationRelationshipsError }] = useDataMutation(mutationRelationships);

    const UpdateEvent = (program, programStage, orgUnit, event, dataValues, trackedEntityInstance) => ({
        resource: 'events',
        type: 'update',
        trackedEntityInstance,
        id: eventID,
        data: {
            event,
            program,
            programStage,
            orgUnit,
            dataValues,
        },
      });

    const CreateEvent = (program, programStage, orgUnit, dataValues, trackedEntityInstance) => ({
        resource: 'events',
        type: 'create',
        trackedEntityInstance,
        eventDate: formattedDate,
        data: {
          
          program,
          programStage,
          orgUnit,
          eventDate: formattedDate,
          status: 'COMPLETED',
          dataValues,
          trackedEntityInstance,
        },
      });

    //   const mutationCourseEvent = (program, programStage, orgUnit, idataValues, trackedEntityInstance, ) => ({
    //     resource: 'events',
    //     type: 'create',
    //     data: () => ({
    //       events: [
    //         {
    //           trackedEntityInstance: trackedEntityInstance,
    //           program: program,
    //           programStage: programStage,
    //           orgUnit: orgUnit,
    //           dataValues: idataValues,
    //           status: 'ACTIVE',
    //           eventDate: formattedDate,
    //         },
    //       ],
    //     }),
    //   });
      const engine = useDataEngine();



      const fetchEvent = async (eventID) => {
        const query = {
          events: {
            resource: 'events',
            id: eventID,
            params: {
              fields: ['event', 'dataValues[dataElement,value]'],
            },
          },
        };
      
        const { events } = await engine.query(query);
        console.log('EventDataElements', events);
      
        const dataValues = [];
        events.dataValues.forEach(item => {
          dataValues.push({ dataElement: item.dataElement, value: item.value });
        });
      
        return dataValues;
      };

      
    const handleAssign = async (trackedEntityInstance) => {
        const dataValues = await fetchEvent(eventID);

        console.log('trackedEntityInstance', trackedEntityInstance)

    //Cancelled until bug is cleared 
    // const type = 'ZBUwOGosqI0';
    // const { error: relationshipsError, data: relationshipsData } = await mutateRelationships({ trackedEntityInstance, eventID, type});
    // if (relationshipsError) {
    //     console.error('Error creating relationship:', relationshipsError);
    // } else {
    //     console.log('Relationship created successfully');
    //     console.log('Relationship data:', relationshipsData);
    // }

        // Create New Event for Staff Attendee
        // const { error } = await mutate({ trackedEntityInstance });
        // console.log('mutation', mutate)
        // if (error) {
        //     console.error('Error creating event:', error);
        // } else {
        //     console.log('Event created successfully');
        // }
        
        const dataInputs = [];
        dataValues.forEach(item => {
            let value;
            switch (item.dataElement) {
                case 'l9aHlXLsEyE':
                    value = (tei_id || '') + trackedEntityInstance + ';';
                    break;
                case 'Av9iXMiGRou':
                    value = tei_count + 1;
                    break;
                default:
                    value = item.value;
                    break;
            }
            dataInputs.push({ dataElement: item.dataElement, value: value });
        });

        const HasAttendees = dataInputs.some(item => item.dataElement === 'l9aHlXLsEyE');
        if (!HasAttendees) {
            dataInputs.push({ dataElement: 'l9aHlXLsEyE', value: (tei_id || '') + trackedEntityInstance + ';' });
        }




   const myMutation = UpdateEvent('P59PhQsB6tb', 'r0gHZqEq6DE', 'VgrqnQEtyOP', eventID, dataInputs);
   console.log('myMutation', myMutation)
   const response = await engine.mutate(myMutation);
   console.log('response', response)

     const dataStaffDefault = [];
     dataStaffDefault.push({ dataElement: 'tsU3YD7kfYU', value: eventID });
     dataStaffDefault.push({ dataElement: 'qc3CCyM8VTc', value: 0 });
     dataStaffDefault.push({ dataElement: 'HtoYZNR0ch6', value: 0 });
     console.log('StaffUpdateTEI', trackedEntityInstance)
     const myStaffUpdate = CreateEvent('Ss21byybIqu', 'Y6scAJvghc0', 'VgrqnQEtyOP', dataStaffDefault, trackedEntityInstance);
     const response2 = await engine.mutate(myStaffUpdate);
     console.log('response2', response2)
     onAssign();
    }

    
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
        .filter(item => 
        item.attributes.some(attr => attr.displayName === 'Family Name' && attr.value.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !(tei_id && tei_id.includes(item.trackedEntityInstance)) // Exclude the instances that are in tei_id
    )
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
            
