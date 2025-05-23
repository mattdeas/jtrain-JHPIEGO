import { useDataQuery,useDataMutation, useDataEngine } from '@dhis2/app-runtime'
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
    IconAddCircle24,
    IconView24,
    CircularLoader,
} from '@dhis2/ui'
import React, { useState, useEffect } from 'react'
import { Link, BrowserRouter, Switch, Route } from 'react-router-dom'
import { utilConfigConstantValueByName } from '../utils/utils';

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

// const query = {
//     instances: {
//         resource: 'trackedEntityInstances',
//         params: ({ ou ,trackedEntityType }) => ({
//             ou : ou,
//             trackedEntityType : trackedEntityType,
//         }),
//     },
// }

const query = {
    instances: {
        resource: 'trackedEntityInstances',
        params: ({ ou, trackedEntityType, page, pageSize, searchLastName, searchFirstName }) => {
            const filters = [];
            if (searchLastName) {
                filters.push(`wXRW65yTN1d:like:${searchLastName}`);
            }
            if (searchFirstName) {
                filters.push(`Lez2r3d0oxb:like:${searchFirstName}`);
            }
            return {
                ou: ou,
                trackedEntityType: trackedEntityType,
                fields: [
                    'trackedEntityInstance',
                    'orgUnits[id,displayName]',
                    'attributes[attribute,code,displayName,value]',
                    'enrollments[enrollment,program,orgUnit,enrollmentDate,incidentDate,status,attributes[attribute,code,displayName,value]]',
                    'created',
                    'lastUpdated',
                    'orgUnits[id,displayName]',
                    '*',
                ],
                page: page,
                pageSize: pageSize,
                order: 'wXRW65yTN1d:asc,Lez2r3d0oxb:desc', //LastName , FirstName SL
                filter: filters,
            };
        },
    },
};
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
export const StaffSearchAttendees = ({eventID, dataEvent, tei_id, tei_count, dElements, onAssign, refreshCount}) => {

    const [isLoading, setIsLoading] = useState(false);
    
    const defStaffProgramId = utilConfigConstantValueByName('StaffProgram');
    const defStaffProgramCourseId = utilConfigConstantValueByName('StaffProgramCourse');
    const defStaffOrgUnitId = utilConfigConstantValueByName('DefaultStaffOrgUnit');
    const defStaffTEIType = utilConfigConstantValueByName('TEITypeStaff');
    const defCourseEventId = utilConfigConstantValueByName('CourseEventId');
    const defCourseAttendeesDE = utilConfigConstantValueByName('CourseAttendees');
    const defCourseAttendeesCountDE = utilConfigConstantValueByName('CourseAttendeesCount');
    const defCoursePreScore = utilConfigConstantValueByName('CoursePreTestScore');
    const defCoursePostScore = utilConfigConstantValueByName('CoursePostTestScore');
    const defCourseProgramId = utilConfigConstantValueByName('CourseProgram');
    const defCourseProgramStageId = utilConfigConstantValueByName('CourseProgramStage');

    const [page, setPage] = useState(1); // Current page
    const [pageSize, setPageSize] = useState(50); // Items per page
    const [searchLastName, setLastName] = useState('');
    const [searchFirstName, setFirstName] = useState('');
    const [assignedPerson, setAssignedPerson] = useState(null);

    const { loading, error, data, refetch } = useDataQuery(query, {
        variables: {
            ou: defStaffOrgUnitId,
            trackedEntityType: defStaffTEIType,
            page: page,
            pageSize: pageSize,
            searchLastName: searchLastName,
            searchFirstName: searchFirstName,
        },
    });


    
    useEffect(() => {
        refetch();
        // This code will run whenever refreshCount changes

        // Fetch data or perform other side effects here

    }, [refreshCount]); // Pass refreshCount as a dependency to useEffect


    const handleSearchTermChangeLast = (event) => {
        setLastName(event.target.value);
    };

    const handleSearchTermChangeFirst = (event) => {
        setFirstName(event.target.value);
    };

    const handleSearch = () => {
        setPage(1); // Reset to the first page
        refetch({
            ou: defStaffOrgUnitId,
            trackedEntityType: defStaffTEIType,
            page: 1,
            pageSize: pageSize,
            searchLastName: searchLastName,
            searchFirstName: searchFirstName,
        });
    };

    const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const mutation = {
        resource: 'events',
        type: 'create',
        data: ({ trackedEntityInstance }) => ({
            events: [
                {
                    trackedEntityInstance,
                    program: defStaffProgramId,
                    programStage: defStaffProgramCourseId,
                    //enrollment: 'qIuyPn7AVu2',
                    orgUnit: defStaffOrgUnitId,
                    dataValues: [
                        {
                            dataElement: defCourseEventId,
                            value: eventID,
                        },
                        {
                            dataElement: defCoursePreScore,
                            value: 0,
                        },
                        {
                            dataElement: defCoursePostScore,
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
      
        const dataValues = [];
        events.dataValues.forEach(item => {
          dataValues.push({ dataElement: item.dataElement, value: item.value });
        });
      
        return dataValues;
      };

      
    // Caused by DHIS2 API version structure - caters for 2.40.3 and lower
    const getAttributes = (instance) => {
        // Check if attributes are at the root level
        if (instance.attributes && instance.attributes.length > 0) {
            return instance.attributes;
        }
        // Check if attributes are within enrollments
        if (instance.enrollments && instance.enrollments.length > 0) {
            return instance.enrollments[0].attributes;
        }
        return [];
    };

    const handleAssign = async (trackedEntityInstance) => {
        const dataValues = await fetchEvent(eventID);

        setIsLoading(true);

        // try {
        //     // Perform the assign action here
        //     // For example, you might call a mutation or an API
        // } catch (error) {
        //     console.error(error);
        // } finally {
            
        // }

        const dataInputs = [];
        dataValues.forEach(item => {
            let value;
            switch (item.dataElement) {
                case defCourseAttendeesDE:
                    value = (tei_id || '') + trackedEntityInstance + ';';
                    break;
                case defCourseAttendeesCountDE:
                    value = tei_count + 1;
                    break;
                default:
                    value = item.value;
                    break;
            }
            dataInputs.push({ dataElement: item.dataElement, value: value });


            
        });

        const HasAttendees = dataInputs.some(item => item.dataElement === defCourseAttendeesDE);
        if (!HasAttendees) {
            dataInputs.push({ dataElement: defCourseAttendeesDE, value: (tei_id || '') + trackedEntityInstance + ';' });
        }




   const myMutation = UpdateEvent(defCourseProgramId, defCourseProgramStageId, defStaffOrgUnitId, eventID, dataInputs);
   await engine.mutate(myMutation);

     const dataStaffDefault = [];
     dataStaffDefault.push({ dataElement: defCourseEventId, value: eventID });
     dataStaffDefault.push({ dataElement: defCoursePreScore, value: 0 });
     dataStaffDefault.push({ dataElement: defCoursePostScore, value: 0 });
     const myStaffUpdate = CreateEvent(defStaffProgramId, defStaffProgramCourseId, defStaffOrgUnitId, dataStaffDefault, trackedEntityInstance);
     try {
            const response2 = await engine.mutate(myStaffUpdate);
            console.log('Mutation completed', response2);
            
            // Add a delay before calling onAssign and refetch
            setTimeout(() => {
                console.log('Calling onAssign');
                onAssign(); // Ensure this is called
                refetch();
            }, 1000); // Delay of 1 second
        } catch (error) {
            console.error('An error occurred:', error);
        }
        setIsLoading(false);
    }
    
    
    return (
        
        <div> 
         {isLoading ? <CircularLoader large /> : <div>
            <h3>Search Trainee to Enroll </h3>

{/* <input type="text" onChange={handleSearchTermChange} /> */}

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
        <div>
        <input 
        type="text" 
        onChange={handleSearchTermChangeLast} 
        value={searchLastName}
        placeholder="Last Name" 
        onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }}
        />
        <input 
        type="text" 
        value={searchFirstName}
        onChange={handleSearchTermChangeFirst} 
        placeholder="First Name" 
        onKeyPress={(e) => { if (e.key === 'Enter') handleSearch(); }}
        />
<button onClick={handleSearch}>Search</button>{assignedPerson && <p>{assignedPerson} was added.</p>}
        <Table>
<TableHead>
<TableRowHead>
<TableCellHead>Last Name</TableCellHead>
<TableCellHead>First Name</TableCellHead>
<TableCellHead>Mobile #</TableCellHead>
<TableCellHead>Designation</TableCellHead>
<TableCellHead>Open</TableCellHead>
<TableCellHead>Enroll</TableCellHead>
</TableRowHead>
</TableHead>
<TableBody>
{data.instances.trackedEntityInstances
    .filter(item => {
        const attributes = getAttributes(item);
        return attributes.some(attr => attr.displayName === 'Last Name' && attr.value.toLowerCase().includes('')) &&
            !(tei_id && tei_id.includes(item.trackedEntityInstance)); // Exclude the instances that are in tei_id
    })
    .slice(0, 10)
    .map(item => {
        const attributes = getAttributes(item);
        // Create an object from the attributes array
        const attributesObj = attributes.reduce((obj, item) => {
            obj[item.displayName] = item.value;
            return obj;
        }, {});

        return (
            <TableRow key={item.trackedEntityInstance}>
                {/* <!-- This area needs to be dynamic --> */}
                <TableCell>{attributesObj['Last Name']}</TableCell>
                <TableCell>{attributesObj['First Name']}</TableCell>
                <TableCell>{attributesObj['Mobile #']}</TableCell>
                <TableCell>{attributesObj['Designation']}</TableCell>
                <TableCell>
                    <a href={`/staffview/${item.trackedEntityInstance}`} target="_blank" rel="noopener noreferrer"><IconView24 /></a>
                </TableCell>
                {/* <TableCell>{item.trackedEntityInstance}</TableCell> */}
                <TableCell align="left">
                    <div onClick={() => {
                        handleAssign(item.trackedEntityInstance);
                        setAssignedPerson(`${attributesObj['First Name']} ${attributesObj['Last Name']}`);
                    }}>
                        <IconAddCircle24 />
                    </div>
                </TableCell>
            </TableRow>
        );
    })}
            </TableBody>
</Table>
</div>
    )
}
         </div>}
            
        </div>
    )
}
            
