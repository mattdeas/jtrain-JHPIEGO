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
export const StaffSearchAttendees = ({eventID, dataEvent, tei_id}) => {
    
    const dSysConstants = useDataQuery(qryConstants)
    let staffMemberid, defaultStaffOrgUnit;
    console.log('dataEvent',dataEvent)
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
                    ],
                    status: 'ACTIVE',
                    eventDate: formattedDate,
                },
            ],
        }),
    };


      //THIS IS WORKING
      const mutationCourseEventUpdatework2 = {
        resource: 'events',
        id: 'y4QZIFjVmey', // replace with actual event ID
        type: 'update',
        
        data: {
            program: 'P59PhQsB6tb', //Course Program
            programStage: 'r0gHZqEq6DE',
            orgUnit: 'VgrqnQEtyOP',
            eventDate: formattedDate,
            dataValues: [
                {
                    dataElement: 'l9aHlXLsEyE', // replace with actual data element ID
                    value: 'abcdeafh', // replace with actual tracked entity instance ID
                },
                {
                    dataElement: 'Av9iXMiGRou', // replace with actual data element ID
                    value: 1,
                },
            ],
        },
    };


    
    

    const mutationCourseEventUpdate ={
        resource: 'events',
        id: eventID,
        type: 'update',
        data: {
            eventId: eventID,
            program: dataEvent.events.program,
            programStage: dataEvent.events.programStage,
            orgUnit: dataEvent.events.orgUnit,
            eventDate: dataEvent.events.eventDate,
            dataValues: [
                {
                    dataElement: dataElement1,
                    value: dataElement1Value,
                },
                {
                    dataElement: dataElement2,
                    value: dataElement2Value,
                },
            ],
        },
    };

    const newCourseEventUpdate = () => ({
        resource: 'events',
        id: eventID,
        type: 'update',
        data: {
            event: eventID,
            program: dataEvent.events.program,
            programStage: dataEvent.events.programStage,
            orgUnit: dataEvent.events.orgUnit,
            eventDate: dataEvent.events.eventDate,
            dataValues: [
                {
                    dataElement: dataElement1,
                    value: dataElement1Value,
                },
                {
                    dataElement: dataElement2,
                    value: dataElement2Value,
                },
            ],
        },
    });


    const [mutate, { loading: mutationLoading, error: mutationError }] = useDataMutation(mutation);
    const [mutateNewCourseEventUpdate, { loading: mutationNewCourseEventLoading, error: mutationNewCourseEventError }] = useDataMutation(mutationCourseEventUpdate);
    //const [mutateRelationships, { loading: mutationRelationshipsLoading, error: mutationRelationshipsError }] = useDataMutation(mutationRelationships);



    const handleAssign = async (trackedEntityInstance) => {
        
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
        const { error } = await mutate({ trackedEntityInstance });
        console.log('mutation', mutate)
        if (error) {
            console.error('Error creating event:', error);
        } else {
            console.log('Event created successfully');
        }

        // Update Course Event Information for Attendees workaround

        const courseAttendeesObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-course-attendees');
        const courseAttendeesCode = courseAttendeesObj ? courseAttendeesObj.code : null;

        const courseAttendeesCountObj = dSysConstants.data.attributes.constants.find(item => item.displayName === 'jtrain-course-attendees-count');
        const courseAttendeesCountCode = courseAttendeesCountObj ? courseAttendeesCountObj.code : null;

        // Find the data values for the elements with the IDs in courseAttendeesCode and courseAttendeesCountCode
        const courseAttendeesDataValueObj = dataEvent.events.dataValues.find(item => item.dataElement === courseAttendeesCode);
        const courseAttendeesCountDataValueObj = dataEvent.events.dataValues.find(item => item.dataElement === courseAttendeesCountCode);

        // Extract the value property from the found objects, or set to '' or 0 if the objects are undefined
        let courseAttendeesDataValue = courseAttendeesDataValueObj !== undefined ? courseAttendeesDataValueObj.value : '';
        let courseAttendeesCountDataValue = courseAttendeesCountDataValueObj ? courseAttendeesCountDataValueObj.value : 0;

        courseAttendeesDataValue = courseAttendeesDataValue + '<' + trackedEntityInstance + '>';
        courseAttendeesCountDataValue = parseInt(courseAttendeesCountDataValue) + 1;

        // Update the mutation object
//         console.log('eventID:', eventID);
// console.log('dataEvent.events.program:', dataEvent.events.program);
// console.log('dataEvent.events.programStage:', dataEvent.events.programStage);
// console.log('dataEvent.events.orgUnit:', dataEvent.events.orgUnit);
// console.log('dataEvent.events.eventDate:', dataEvent.events.eventDate);
console.log('courseAttendeesCode:', courseAttendeesCode);
console.log('courseAttendeesDataValue:', courseAttendeesDataValue);
console.log('courseAttendeesCountCode:', courseAttendeesCountCode);
console.log('courseAttendeesCountDataValue:', courseAttendeesCountDataValue);

    setDataElement1(courseAttendeesCode)
    setDataElement1Value(courseAttendeesDataValue)
    setDataElement2(courseAttendeesCountCode)
    setDataElement2Value(courseAttendeesCountDataValue)
    
    console.log('mutationCourseEventUpdate',mutationCourseEventUpdate);
    const { errorCEU } = await mutateNewCourseEventUpdate(mutationCourseEventUpdate);
        if (errorCEU) {
            console.error('Error creating event:', errorCEU);
        } else {
            console.log('Event created successfully');
        }
    console.log('mutationCourseEventUpdate',mutationCourseEventUpdate)
    
    // Define your mutation object here
    
    
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
            
