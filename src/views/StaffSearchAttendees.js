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
} from '@dhis2/ui'
import React, { useState, useEffect } from 'react'
import { Link, BrowserRouter, Switch, Route } from 'react-router-dom'
import { utilGetConstantValueByName } from '../utils/utils';

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
export const StaffSearchAttendees = ({eventID, dataEvent, tei_id, tei_count, dElements, onAssign, refreshCount}) => {


    
    const defStaffProgramId = utilGetConstantValueByName('jtrain-staffprogram');
    const defStaffProgramCourseId = utilGetConstantValueByName('jtrain-staffprogram-course');
    const defStaffOrgUnitId = utilGetConstantValueByName('jtrain-DefaultStaffOrgUnit');
    const defStaffTEIType = utilGetConstantValueByName('jtrain-TEI-Type-Staff');
    const defCourseEventId = utilGetConstantValueByName('jtrain-course-eventid');
    const defCourseAttendeesDE = utilGetConstantValueByName('jtrain-course-attendees');
    const defCourseAttendeesCountDE = utilGetConstantValueByName('jtrain-course-attendees-count');
    const defCoursePreScore = utilGetConstantValueByName('jtrain-course-pretest-score');
    const defCoursePostScore = utilGetConstantValueByName('jtrain-course-posttest-score');
    const defCourseProgramId = utilGetConstantValueByName('jtrain-courseprogram');
    const defCourseProgramStageId = utilGetConstantValueByName('jtrain-courseprogramstage');

    const { loading, error, data, refetch } = useDataQuery(query, {
        variables: {
            ou: defStaffOrgUnitId,
            trackedEntityType: defStaffTEIType,
        },
    })

    
    useEffect(() => {
        refetch();
        // This code will run whenever refreshCount changes

        // Fetch data or perform other side effects here

    }, [refreshCount]); // Pass refreshCount as a dependency to useEffect




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

      
    const handleAssign = async (trackedEntityInstance) => {
        const dataValues = await fetchEvent(eventID);

        console.log('trackedEntityInstance', trackedEntityInstance)

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
   console.log('myMutation', myMutation)
   const response = await engine.mutate(myMutation);
   console.log('response', response)

     const dataStaffDefault = [];
     dataStaffDefault.push({ dataElement: defCourseEventId, value: eventID });
     dataStaffDefault.push({ dataElement: defCoursePreScore, value: 0 });
     dataStaffDefault.push({ dataElement: defCoursePostScore, value: 0 });
     console.log('StaffUpdateTEI', trackedEntityInstance)
     const myStaffUpdate = CreateEvent(defStaffProgramId, defStaffProgramCourseId, defStaffOrgUnitId, dataStaffDefault, trackedEntityInstance);
     try {
            const response2 = await engine.mutate(myStaffUpdate);
            console.log('Mutation completed', response2);
            
            // Add a delay before calling onAssign and refetch
            setTimeout(() => {
                onAssign();
                refetch();
            }, 1000); // Delay of 1 second
        } catch (error) {
            console.error('An error occurred:', error);
        }
        
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
                    <a href={`/staffview/${trackedEntityInstance}`} target="_blank" rel="noopener noreferrer"><IconView24 /></a>
                    
                    </TableCell>
                    {/* <TableCell>{trackedEntityInstance}</TableCell> */}
                       
                    <TableCell align="left">
                        <div onClick={() => handleAssign(trackedEntityInstance)}><IconAddCircle24 /></div>
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
            
